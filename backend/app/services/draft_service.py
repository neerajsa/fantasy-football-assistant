from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_, desc
from datetime import datetime
import uuid
import random

from ..database.models import DraftSession, DraftTeam, DraftPick, CustomRankingPlayer
from ..schemas.draft import (
    DraftSessionCreate, DraftSession as DraftSessionSchema, 
    DraftStatus, MakePickRequest, DraftStateResponse
)
from .draft_engine import DraftEngine, DraftTurnLogic
from .draft_validation import DraftValidator, DraftValidationError
from .draft_ai import DraftAI, AIStrategy


class DraftService:
    """Service layer for managing draft sessions"""
    
    def __init__(self, db: Session):
        self.db = db
        self.validator = DraftValidator(db)
        self.ai = DraftAI(db)
    
    def create_draft_session(self, draft_data: DraftSessionCreate) -> DraftSession:
        """Create a new draft session with teams and initialize picks"""
        
        # Validate draft creation data
        validation_errors = self.validator.validate_draft_session_creation(draft_data)
        if validation_errors:
            raise DraftValidationError(f"Draft validation failed: {'; '.join(validation_errors)}")
        
        # Calculate total rounds
        total_rounds = DraftTurnLogic.calculate_total_rounds(draft_data.roster_positions)
        
        # Create draft session
        draft_session = DraftSession(
            num_teams=draft_data.num_teams,
            draft_type=draft_data.draft_type,
            scoring_type=draft_data.scoring_type,
            roster_positions=draft_data.roster_positions,
            total_rounds=total_rounds,
            status=DraftStatus.CREATED
        )
        
        self.db.add(draft_session)
        self.db.flush()  # Get the ID without committing
        
        # Create teams
        teams = []
        for team_data in draft_data.teams:
            team = DraftTeam(
                draft_session_id=draft_session.id,
                team_index=team_data.team_index,
                team_name=team_data.team_name,
                is_user=team_data.is_user,
                current_roster={pos: 0 for pos in draft_data.roster_positions.keys()}
            )
            teams.append(team)
            self.db.add(team)
        
        self.db.flush()  # Get team IDs
        
        # Initialize draft engine and create all pick slots
        draft_session.teams = teams
        draft_engine = DraftEngine(draft_session)
        picks = draft_engine.initialize_draft_picks()
        
        for pick in picks:
            self.db.add(pick)
        
        self.db.commit()
        self.db.refresh(draft_session)
        
        return draft_session
    
    def get_draft_session(self, draft_id: uuid.UUID) -> Optional[DraftSession]:
        """Get a draft session by ID with all relationships loaded"""
        return self.db.query(DraftSession).filter(
            DraftSession.id == draft_id
        ).first()
    
    def list_draft_sessions(self, limit: int = 50) -> List[DraftSession]:
        """List recent draft sessions"""
        return self.db.query(DraftSession).order_by(
            desc(DraftSession.created_at)
        ).limit(limit).all()
    
    def start_draft(self, draft_id: uuid.UUID) -> DraftSession:
        """Start a draft session"""
        draft_session = self.get_draft_session(draft_id)
        if not draft_session:
            raise ValueError(f"Draft session {draft_id} not found")
        
        # Validate draft can be started
        validation_errors = self.validator.validate_draft_start(draft_session)
        if validation_errors:
            raise DraftValidationError(f"Cannot start draft: {'; '.join(validation_errors)}")
        
        draft_session.status = DraftStatus.IN_PROGRESS
        draft_session.started_at = datetime.utcnow()
        
        self.db.commit()
        self.db.refresh(draft_session)
        
        return draft_session
    
    def make_pick(self, draft_id: uuid.UUID, team_id: uuid.UUID, pick_request: MakePickRequest) -> DraftPick:
        """Make a draft pick"""
        draft_session = self.get_draft_session(draft_id)
        if not draft_session:
            raise ValueError(f"Draft session {draft_id} not found")
        
        if draft_session.status != DraftStatus.IN_PROGRESS:
            raise ValueError(f"Draft is not in progress (status: {draft_session.status})")
        
        # Get the team making the pick
        team = self.db.query(DraftTeam).filter(
            and_(DraftTeam.id == team_id, DraftTeam.draft_session_id == draft_id)
        ).first()
        
        if not team:
            raise ValueError(f"Team {team_id} not found in draft {draft_id}")
        
        # Comprehensive pick validation
        is_valid, validation_errors = self.validator.validate_pick_attempt(
            draft_session, team, pick_request.player_id
        )
        if not is_valid:
            raise DraftValidationError(f"Invalid pick: {'; '.join(validation_errors)}")
        
        # Get the current pick slot
        current_pick = self.db.query(DraftPick).filter(
            and_(
                DraftPick.draft_session_id == draft_id,
                DraftPick.pick_number == draft_session.current_pick,
                DraftPick.team_id == team_id
            )
        ).first()
        
        if not current_pick:
            raise ValueError("Current pick slot not found")
        
        if current_pick.player_id is not None:
            raise ValueError("Pick has already been made")
        
        # Verify player exists and is available
        player = self.db.query(CustomRankingPlayer).filter(
            CustomRankingPlayer.id == pick_request.player_id
        ).first()
        
        if not player:
            raise ValueError(f"Player {pick_request.player_id} not found")
        
        # Check if player is already drafted
        existing_pick = self.db.query(DraftPick).filter(
            and_(
                DraftPick.draft_session_id == draft_id,
                DraftPick.player_id == pick_request.player_id,
                DraftPick.picked_at.isnot(None)
            )
        ).first()
        
        if existing_pick:
            raise ValueError(f"Player {player.player_name} has already been drafted")
        
        # Make the pick
        current_pick.player_id = pick_request.player_id
        current_pick.picked_at = datetime.utcnow()
        
        # Update team roster count
        player_position = player.position.lower()
        if player_position in team.current_roster:
            team.current_roster[player_position] += 1
        else:
            # Handle flex positions or map to appropriate roster slot
            if player_position in ['rb', 'wr', 'te']:
                if 'flex' in team.current_roster:
                    team.current_roster['flex'] += 1
                else:
                    team.current_roster[player_position] += 1
        
        # Advance to next pick
        draft_engine = DraftEngine(draft_session)
        draft_complete = not draft_engine.advance_to_next_pick()
        
        if draft_complete:
            draft_session.status = DraftStatus.COMPLETED
            draft_session.completed_at = datetime.utcnow()
        
        self.db.commit()
        self.db.refresh(current_pick)
        
        return current_pick
    
    def get_player_from_player_id(
        self, 
        draft_id: uuid.UUID, 
        player_id: uuid.UUID
    ) -> CustomRankingPlayer:
        """Get player from player id"""
        player = self.db.query(CustomRankingPlayer).filter(
            CustomRankingPlayer.id == player_id
        ).first()
        
        if not player:
            raise ValueError(f"Player {player_id} not found")
        
        return player
    
    def get_available_players(
        self, 
        draft_id: uuid.UUID, 
        position: Optional[str] = None, 
        limit: int = 100,
        scoring_type: Optional[str] = None
    ) -> List[CustomRankingPlayer]:
        """Get players available for drafting, ordered by appropriate ECR ranking based on scoring type"""
        
        # Get already drafted player IDs
        drafted_player_ids = self.db.query(DraftPick.player_id).filter(
            and_(
                DraftPick.draft_session_id == draft_id,
                DraftPick.player_id.isnot(None)
            )
        ).subquery()
        
        # Query available players
        query = self.db.query(CustomRankingPlayer).filter(
            ~CustomRankingPlayer.id.in_(drafted_player_ids)
        )
        
        if position:
            query = query.filter(CustomRankingPlayer.position == position.upper())
        
        # Order by appropriate ECR ranking field based on scoring type
        if scoring_type == 'standard':
            query = query.order_by(CustomRankingPlayer.ecr_rank_standard.asc())
        elif scoring_type == 'half_ppr':
            query = query.order_by(CustomRankingPlayer.ecr_rank_half_ppr.asc())
        else:  # Default to PPR for 'ppr' or any other/unknown scoring type
            query = query.order_by(CustomRankingPlayer.ecr_rank_ppr.asc())
        
        return query.limit(limit).all()
    
    def get_recent_picks(self, draft_id: uuid.UUID, limit: int = 10) -> List[DraftPick]:
        """Get recent picks made in the draft"""
        return self.db.query(DraftPick).filter(
            and_(
                DraftPick.draft_session_id == draft_id,
                DraftPick.picked_at.isnot(None)
            )
        ).order_by(desc(DraftPick.picked_at)).limit(limit).all()
    
    def get_draft_state(self, draft_id: uuid.UUID) -> DraftStateResponse:
        """Get complete current draft state for UI"""
        draft_session = self.get_draft_session(draft_id)
        if not draft_session:
            raise ValueError(f"Draft session {draft_id} not found")
        
        draft_engine = DraftEngine(draft_session)
        current_team = draft_engine.get_current_team()
        
        # Get available players with scoring type-aware ordering
        available_players = self.get_available_players(draft_id, limit=50, scoring_type=draft_session.scoring_type)
        recent_picks = self.get_recent_picks(draft_id, limit=5)
        
        # Convert players to dict format for response
        available_players_dict = []
        for player in available_players:
            available_players_dict.append({
                "id": str(player.id),
                "player_name": player.player_name,
                "position": player.position,
                "team": player.team,
                "ecr_rank_ppr": player.ecr_rank_ppr,
                "adp_ppr": float(player.adp_ppr) if player.adp_ppr else None
            })
        
        # Create enhanced draft session dict with player data populated in picks
        draft_session_dict = DraftSessionSchema.from_orm(draft_session).dict()
        
        # Populate player and team data for picks
        if draft_session_dict.get('picks'):
            # Get all unique player IDs and team IDs from picks
            player_ids = [pick['player_id'] for pick in draft_session_dict['picks'] if pick.get('player_id')]
            team_ids = [pick['team_id'] for pick in draft_session_dict['picks'] if pick.get('team_id')]
            
            # Batch fetch players and teams
            players_map = {}
            if player_ids:
                players = self.db.query(CustomRankingPlayer).filter(
                    CustomRankingPlayer.id.in_(player_ids)
                ).all()
                players_map = {str(p.id): {
                    "id": str(p.id),
                    "player_name": p.player_name,
                    "position": p.position,
                    "team": p.team
                } for p in players}
            
            teams_map = {}
            if team_ids:
                teams = self.db.query(DraftTeam).filter(
                    DraftTeam.id.in_(team_ids)
                ).all()
                teams_map = {str(t.id): {
                    "id": str(t.id),
                    "team_name": t.team_name,
                    "is_user": t.is_user
                } for t in teams}
            
            # Enhance picks with player and team data
            for pick in draft_session_dict['picks']:
                if pick.get('player_id') and str(pick['player_id']) in players_map:
                    pick['player'] = players_map[str(pick['player_id'])]
                else:
                    pick['player'] = None
                    
                if pick.get('team_id') and str(pick['team_id']) in teams_map:
                    pick['team'] = teams_map[str(pick['team_id'])]
                else:
                    pick['team'] = None
        
        return DraftStateResponse(
            draft_session=draft_session_dict,
            current_team=current_team,
            available_players=available_players_dict,
            recent_picks=recent_picks
        )
    
    def delete_draft_session(self, draft_id: uuid.UUID) -> bool:
        """Delete a draft session and all related data"""
        draft_session = self.get_draft_session(draft_id)
        if not draft_session:
            return False
        
        self.db.delete(draft_session)
        self.db.commit()
        return True
    
    def get_draft_validation_report(self, draft_id: uuid.UUID) -> dict:
        """Get comprehensive validation report for a draft"""
        draft_session = self.get_draft_session(draft_id)
        if not draft_session:
            raise ValueError(f"Draft session {draft_id} not found")
        
        return self.validator.get_draft_integrity_report(draft_session)
    
    def make_ai_pick(self, draft_id: uuid.UUID, strategy: AIStrategy = AIStrategy.BALANCED) -> DraftPick:
        """Make an AI pick for the current team on the clock"""
        
        # Get draft session
        draft_session = self.get_draft_session(draft_id)
        if not draft_session:
            raise ValueError(f"Draft session {draft_id} not found")
        
        if draft_session.status != DraftStatus.IN_PROGRESS:
            raise ValueError(f"Draft is not in progress (status: {draft_session.status})")
        
        # Get current team using draft engine
        draft_engine = DraftEngine(draft_session)
        current_team = draft_engine.get_current_team()
        
        if not current_team:
            raise ValueError("No current team found")
        
        if current_team.is_user:
            raise ValueError("Cannot make AI pick for user team")
        
        # Use AI to select player
        selected_player_id = self.ai.make_ai_pick(draft_session, current_team, strategy)
        
        # Make the pick using existing logic
        pick_request = MakePickRequest(player_id=selected_player_id)
        return self.make_pick(draft_id, current_team.id, pick_request)
    
    def get_pick_recommendations(self, draft_id: uuid.UUID, team_id: uuid.UUID, num_recommendations: int = 5) -> List[Dict[str, Any]]:
        """Get AI-powered pick recommendations for a team"""
        
        draft_session = self.get_draft_session(draft_id)
        if not draft_session:
            raise ValueError(f"Draft session {draft_id} not found")
        
        team = self.db.query(DraftTeam).filter(
            and_(DraftTeam.id == team_id, DraftTeam.draft_session_id == draft_id)
        ).first()
        
        if not team:
            raise ValueError(f"Team {team_id} not found in draft {draft_id}")
        
        return self.ai.get_pick_recommendations(draft_session, team, num_recommendations)
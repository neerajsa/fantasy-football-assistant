from typing import List, Optional, Dict, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import and_

from ..database.models import DraftSession, DraftTeam, DraftPick, CustomRankingPlayer
from ..schemas.draft import DraftStatus
from .draft_engine import DraftEngine


class DraftValidationError(Exception):
    """Custom exception for draft validation errors"""
    pass


class DraftValidator:
    """Comprehensive validation for draft operations"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def validate_draft_session_creation(self, draft_data) -> List[str]:
        """
        Validate draft session creation data
        
        Returns:
            List of validation error messages (empty if valid)
        """
        errors = []
        
        # Validate team count matches teams provided
        if len(draft_data.teams) != draft_data.num_teams:
            errors.append(f"Number of teams ({len(draft_data.teams)}) doesn't match num_teams ({draft_data.num_teams})")
        
        # Validate team indices are sequential and unique
        team_indices = [team.team_index for team in draft_data.teams]
        expected_indices = list(range(draft_data.num_teams))
        
        if sorted(team_indices) != expected_indices:
            errors.append(f"Team indices must be sequential from 0 to {draft_data.num_teams - 1}")
        
        # Validate exactly one user team
        user_teams = [team for team in draft_data.teams if team.is_user]
        if len(user_teams) != 1:
            errors.append("Exactly one team must be marked as user team")
        
        # Validate team names are unique
        team_names = [team.team_name for team in draft_data.teams]
        if len(set(team_names)) != len(team_names):
            errors.append("Team names must be unique")
        
        # Validate roster positions
        roster_errors = self._validate_roster_positions(draft_data.roster_positions)
        errors.extend(roster_errors)
        
        return errors
    
    def validate_draft_start(self, draft_session: DraftSession) -> List[str]:
        """
        Validate that a draft can be started
        
        Returns:
            List of validation error messages (empty if valid)
        """
        errors = []
        
        # Check draft status
        if draft_session.status != DraftStatus.CREATED:
            errors.append(f"Draft must be in 'created' status to start (currently {draft_session.status.value})")
        
        # Check teams are properly configured
        if not draft_session.teams:
            errors.append("Draft session has no teams")
        
        if len(draft_session.teams) != draft_session.num_teams:
            errors.append("Team count mismatch")
        
        # Check picks are initialized
        expected_picks = draft_session.num_teams * draft_session.total_rounds
        actual_picks = len(draft_session.picks)
        
        if actual_picks != expected_picks:
            errors.append(f"Expected {expected_picks} pick slots, found {actual_picks}")
        
        return errors
    
    def validate_pick_attempt(
        self, 
        draft_session: DraftSession, 
        team: DraftTeam, 
        player_id: str
    ) -> Tuple[bool, List[str]]:
        """
        Comprehensive validation for a pick attempt
        
        Returns:
            Tuple of (is_valid, error_messages)
        """
        errors = []
        
        # 1. Validate draft state
        if draft_session.status != DraftStatus.IN_PROGRESS:
            errors.append(f"Draft is not in progress (status: {draft_session.status.value})")
            return False, errors
        
        # 2. Validate it's the team's turn
        draft_engine = DraftEngine(draft_session)
        if not draft_engine.can_make_pick(team):
            current_team = draft_engine.get_current_team()
            current_team_name = current_team.team_name if current_team else "Unknown"
            errors.append(f"It's not {team.team_name}'s turn to pick. Current turn: {current_team_name}")
        
        # 3. Validate player exists
        player = self.db.query(CustomRankingPlayer).filter(
            CustomRankingPlayer.id == player_id
        ).first()
        
        if not player:
            errors.append(f"Player with ID {player_id} not found")
            return False, errors
        
        # 4. Validate player is available (not already drafted)
        existing_pick = self.db.query(DraftPick).filter(
            and_(
                DraftPick.draft_session_id == draft_session.id,
                DraftPick.player_id == player_id,
                DraftPick.picked_at.isnot(None)
            )
        ).first()
        
        if existing_pick:
            # Get the team that drafted this player
            drafting_team = self.db.query(DraftTeam).filter(
                DraftTeam.id == existing_pick.team_id
            ).first()
            team_name = drafting_team.team_name if drafting_team else "Unknown Team"
            errors.append(f"Player {player.player_name} was already drafted by {team_name} in round {existing_pick.round_number}")
        
        # 5. Validate current pick slot exists and is empty
        current_pick = self.db.query(DraftPick).filter(
            and_(
                DraftPick.draft_session_id == draft_session.id,
                DraftPick.pick_number == draft_session.current_pick,
                DraftPick.team_id == team.id
            )
        ).first()
        
        if not current_pick:
            errors.append("Current pick slot not found - draft state may be corrupted")
        elif current_pick.player_id is not None:
            errors.append("Current pick has already been made")
        
        # 6. Validate roster constraints (optional - could be warning instead of error)
        roster_warnings = self._validate_roster_constraints(team, player)
        if roster_warnings:
            # For now, treat as warnings, not blocking errors
            # Could be made configurable per league
            pass
        
        return len(errors) == 0, errors
    
    def validate_draft_completion_state(self, draft_session: DraftSession) -> bool:
        """
        Validate that a draft is properly completed
        
        Returns:
            True if draft is validly completed
        """
        if draft_session.status != DraftStatus.COMPLETED:
            return False
        
        # Check all picks are made
        total_picks = draft_session.num_teams * draft_session.total_rounds
        made_picks = self.db.query(DraftPick).filter(
            and_(
                DraftPick.draft_session_id == draft_session.id,
                DraftPick.player_id.isnot(None)
            )
        ).count()
        
        return made_picks == total_picks
    
    def _validate_roster_positions(self, roster_positions: Dict[str, int]) -> List[str]:
        """Validate roster position configuration"""
        errors = []
        
        # Required positions
        required_positions = ['qb', 'rb', 'wr', 'te', 'k', 'dst', 'bench']
        
        for pos in required_positions:
            if pos not in roster_positions:
                errors.append(f"Missing required roster position: {pos}")
            elif roster_positions[pos] < 0:
                errors.append(f"Roster position {pos} cannot be negative")
        
        # Validate reasonable limits
        position_limits = {
            'qb': (1, 3),
            'rb': (1, 6),
            'wr': (1, 6),
            'te': (1, 3),
            'k': (0, 2),
            'dst': (0, 2),
            'flex': (0, 3),
            'superflex': (0, 2),
            'bench': (1, 10)
        }
        
        for pos, count in roster_positions.items():
            if pos in position_limits:
                min_val, max_val = position_limits[pos]
                if count < min_val or count > max_val:
                    errors.append(f"Position {pos} must be between {min_val} and {max_val}, got {count}")
        
        # Validate total roster size is reasonable
        total_roster = sum(roster_positions.values())
        if total_roster < 10 or total_roster > 20:
            errors.append(f"Total roster size ({total_roster}) should be between 10 and 20 players")
        
        return errors
    
    def _validate_roster_constraints(self, team: DraftTeam, player: CustomRankingPlayer) -> List[str]:
        """
        Validate roster constraints for a potential pick
        
        Returns warnings about roster construction (not blocking errors)
        """
        warnings = []
        
        current_roster = team.current_roster
        player_position = player.position.lower()
        
        # Count current players at this position
        current_count = current_roster.get(player_position, 0)
        
        # Get roster requirements from draft session
        # Note: This would need the roster_positions from the draft session
        # For now, provide general warnings
        
        position_recommendations = {
            'qb': 2,
            'rb': 4,
            'wr': 4,
            'te': 2,
            'k': 1,
            'dst': 1
        }
        
        if player_position in position_recommendations:
            recommended = position_recommendations[player_position]
            if current_count >= recommended:
                warnings.append(f"Team already has {current_count} {player_position.upper()}s (recommended: {recommended})")
        
        return warnings
    
    def get_draft_integrity_report(self, draft_session: DraftSession) -> Dict[str, any]:
        """
        Generate a comprehensive integrity report for a draft
        
        Returns:
            Dictionary with validation results and statistics
        """
        report = {
            "draft_id": str(draft_session.id),
            "status": draft_session.status.value,
            "is_valid": True,
            "errors": [],
            "warnings": [],
            "statistics": {}
        }
        
        # Basic statistics
        total_picks_expected = draft_session.num_teams * draft_session.total_rounds
        picks_made = self.db.query(DraftPick).filter(
            and_(
                DraftPick.draft_session_id == draft_session.id,
                DraftPick.player_id.isnot(None)
            )
        ).count()
        
        report["statistics"] = {
            "total_picks_expected": total_picks_expected,
            "picks_made": picks_made,
            "picks_remaining": total_picks_expected - picks_made,
            "completion_percentage": (picks_made / total_picks_expected) * 100 if total_picks_expected > 0 else 0
        }
        
        # Validate pick sequence
        picks = self.db.query(DraftPick).filter(
            DraftPick.draft_session_id == draft_session.id
        ).order_by(DraftPick.pick_number).all()
        
        for pick in picks:
            if pick.player_id is not None:  # Pick has been made
                # Validate pick number sequence
                expected_team_index = DraftEngine.get_current_team_index(
                    draft_session.draft_type,
                    draft_session.num_teams,
                    pick.round_number,
                    pick.pick_number
                )
                
                team = self.db.query(DraftTeam).filter(DraftTeam.id == pick.team_id).first()
                if team and team.team_index != expected_team_index:
                    report["errors"].append(
                        f"Pick {pick.pick_number}: Expected team index {expected_team_index}, got {team.team_index}"
                    )
                    report["is_valid"] = False
        
        return report
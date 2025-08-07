from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_
import random
import uuid
from enum import Enum

from ..database.models import DraftSession, DraftTeam, DraftPick, CustomRankingPlayer
from ..schemas.draft import DraftStatus
from .draft_engine import DraftEngine


class AIStrategy(Enum):
    """Different AI draft strategies"""
    BEST_PLAYER_AVAILABLE = "bpa"
    POSITIONAL_NEED = "positional_need" 
    VALUE_BASED = "value_based"
    BALANCED = "balanced"


class DraftAI:
    """AI service for automated draft picks"""
    
    def __init__(self, db: Session):
        self.db = db
        
        # Position priority for different strategies
        self.position_priority_early = ['RB', 'WR', 'QB', 'TE', 'K', 'DST']
        self.position_priority_mid = ['RB', 'WR', 'TE', 'QB', 'K', 'DST']
        self.position_priority_late = ['QB', 'TE', 'K', 'DST', 'RB', 'WR']
        
        # Roster targets for balanced strategy
        self.roster_targets = {
            'qb': 1,
            'rb': 3,
            'wr': 4,
            'te': 2,
            'k': 1,
            'dst': 1
        }
    
    def make_ai_pick(
        self, 
        draft_session: DraftSession, 
        team: DraftTeam, 
        strategy: AIStrategy = AIStrategy.BALANCED
    ) -> uuid.UUID:
        """
        Make an AI pick for the given team using specified strategy
        
        Args:
            draft_session: Current draft session
            team: Team making the pick
            strategy: AI strategy to use
            
        Returns:
            UUID of the selected player
            
        Raises:
            ValueError: If no suitable player found or invalid state
        """
        
        # Get available players
        available_players = self._get_available_players(draft_session)
        
        if not available_players:
            raise ValueError("No available players for AI to pick")
        
        # Select player based on strategy
        if strategy == AIStrategy.BEST_PLAYER_AVAILABLE:
            selected_player = self._pick_best_available(available_players, draft_session.scoring_type)
        elif strategy == AIStrategy.POSITIONAL_NEED:
            selected_player = self._pick_positional_need(available_players, team, draft_session)
        elif strategy == AIStrategy.VALUE_BASED:
            selected_player = self._pick_value_based(available_players, draft_session, team)
        else:  # BALANCED or default
            selected_player = self._pick_balanced(available_players, team, draft_session)
        
        return selected_player.id
    
    def get_pick_recommendations(
        self, 
        draft_session: DraftSession, 
        team: DraftTeam, 
        num_recommendations: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Get pick recommendations for human users
        
        Args:
            draft_session: Current draft session
            team: Team requesting recommendations
            num_recommendations: Number of recommendations to return
            
        Returns:
            List of recommended players with reasoning
        """
        
        available_players = self._get_available_players(draft_session)
        
        if not available_players:
            return []
        
        recommendations = []
        
        # Get top recommendations using different strategies
        bpa_pick = self._pick_best_available(available_players, draft_session.scoring_type)
        need_pick = self._pick_positional_need(available_players, team, draft_session)
        value_pick = self._pick_value_based(available_players, draft_session, team)
        
        # Add BPA recommendation
        if bpa_pick:
            recommendations.append({
                'player': {
                    'id': str(bpa_pick.id),
                    'player_name': bpa_pick.player_name,
                    'position': bpa_pick.position,
                    'team': bpa_pick.team,
                    'ecr_rank': self._get_ecr_rank(bpa_pick, draft_session.scoring_type)
                },
                'reasoning': 'Best Player Available',
                'strategy': 'BPA'
            })
        
        # Add positional need recommendation if different
        if need_pick and need_pick.id != bpa_pick.id:
            recommendations.append({
                'player': {
                    'id': str(need_pick.id),
                    'player_name': need_pick.player_name,
                    'position': need_pick.position,
                    'team': need_pick.team,
                    'ecr_rank': self._get_ecr_rank(need_pick, draft_session.scoring_type)
                },
                'reasoning': f'Fills {need_pick.position} need',
                'strategy': 'Positional Need'
            })
        
        # Add value pick if different
        if value_pick and value_pick.id not in [p['player']['id'] for p in recommendations]:
            recommendations.append({
                'player': {
                    'id': str(value_pick.id),
                    'player_name': value_pick.player_name,
                    'position': value_pick.position,
                    'team': value_pick.team,
                    'ecr_rank': self._get_ecr_rank(value_pick, draft_session.scoring_type)
                },
                'reasoning': 'Great value at current pick',
                'strategy': 'Value Pick'
            })
        
        # Fill remaining slots with top available players
        added_player_ids = {p['player']['id'] for p in recommendations}
        remaining_players = [p for p in available_players[:num_recommendations*2] 
                           if str(p.id) not in added_player_ids]
        
        for player in remaining_players[:num_recommendations - len(recommendations)]:
            recommendations.append({
                'player': {
                    'id': str(player.id),
                    'player_name': player.player_name,
                    'position': player.position,
                    'team': player.team,
                    'ecr_rank': self._get_ecr_rank(player, draft_session.scoring_type)
                },
                'reasoning': 'High-ranked available player',
                'strategy': 'Top Available'
            })
        
        return recommendations[:num_recommendations]
    
    def _get_available_players(self, draft_session: DraftSession) -> List[CustomRankingPlayer]:
        """Get list of available players ordered by ECR ranking"""
        
        # Get already drafted player IDs
        drafted_player_ids = self.db.query(DraftPick.player_id).filter(
            and_(
                DraftPick.draft_session_id == draft_session.id,
                DraftPick.player_id.isnot(None)
            )
        ).subquery()
        
        # Query available players
        query = self.db.query(CustomRankingPlayer).filter(
            ~CustomRankingPlayer.id.in_(drafted_player_ids)
        )
        
        # Order by appropriate ECR ranking field based on scoring type
        if draft_session.scoring_type == 'standard':
            query = query.order_by(CustomRankingPlayer.ecr_rank_standard.asc())
        elif draft_session.scoring_type == 'half_ppr':
            query = query.order_by(CustomRankingPlayer.ecr_rank_half_ppr.asc())
        else:  # PPR or unknown
            query = query.order_by(CustomRankingPlayer.ecr_rank_ppr.asc())
        
        return query.limit(500).all()
    
    def _pick_best_available(
        self, 
        available_players: List[CustomRankingPlayer], 
        scoring_type: str
    ) -> CustomRankingPlayer:
        """Pick the best available player regardless of position"""
        
        if not available_players:
            raise ValueError("No available players")
        
        # Add some randomness to prevent always picking #1 ranked player
        top_players = available_players[:min(3, len(available_players))]
        weights = [3, 2, 1][:len(top_players)]
        
        return random.choices(top_players, weights=weights)[0]
    
    def _pick_positional_need(
        self, 
        available_players: List[CustomRankingPlayer], 
        team: DraftTeam, 
        draft_session: DraftSession
    ) -> CustomRankingPlayer:
        """Pick based on positional need"""
        
        # Analyze current roster
        current_roster = team.current_roster or {}
        draft_engine = DraftEngine(draft_session)
        current_round = draft_session.current_round
        
        # Determine position priority based on draft stage
        if current_round <= 3:
            position_priority = self.position_priority_early
        elif current_round <= 8:
            position_priority = self.position_priority_mid
        else:
            position_priority = self.position_priority_late
        
        # Find the most needed position that has available players
        for position in position_priority:
            position_lower = position.lower()
            current_count = current_roster.get(position_lower, 0)
            target_count = self.roster_targets.get(position_lower, 1)
            
            # Check if we need this position
            if current_count < target_count:
                # Find best available player at this position
                position_players = [p for p in available_players if p.position == position]
                if position_players:
                    # Pick from top 2 at position with some randomness
                    top_at_position = position_players[:min(2, len(position_players))]
                    return random.choice(top_at_position)
        
        # Fallback to BPA if no positional need
        return self._pick_best_available(available_players, draft_session.scoring_type)
    
    def _pick_value_based(
        self, 
        available_players: List[CustomRankingPlayer], 
        draft_session: DraftSession, 
        team: DraftTeam
    ) -> CustomRankingPlayer:
        """Pick based on value (ECR vs ADP difference)"""
        
        value_players = []
        
        for player in available_players[:50]:  # Look at top 50 available
            ecr_rank = self._get_ecr_rank(player, draft_session.scoring_type)
            adp = self._get_adp(player, draft_session.scoring_type)
            
            if ecr_rank and adp:
                # Value = how much better ECR is than ADP (lower ECR = better)
                value_score = adp - ecr_rank
                if value_score > 10:  # Good value if ADP is 10+ picks later than ECR
                    value_players.append((player, value_score))
        
        if value_players:
            # Sort by value score and add randomness
            value_players.sort(key=lambda x: x[1], reverse=True)
            top_value = value_players[:min(3, len(value_players))]
            return random.choice(top_value)[0]
        
        # Fallback to BPA
        return self._pick_best_available(available_players, draft_session.scoring_type)
    
    def _pick_balanced(
        self, 
        available_players: List[CustomRankingPlayer], 
        team: DraftTeam, 
        draft_session: DraftSession
    ) -> CustomRankingPlayer:
        """Balanced strategy combining BPA and positional need"""
        
        current_round = draft_session.current_round
        
        # Early rounds: Favor BPA with some positional awareness
        if current_round <= 4:
            # 70% BPA, 30% positional need
            if random.random() < 0.7:
                return self._pick_best_available(available_players, draft_session.scoring_type)
            else:
                return self._pick_positional_need(available_players, team, draft_session)
        
        # Mid rounds: More balanced
        elif current_round <= 10:
            # 40% BPA, 60% positional need
            if random.random() < 0.4:
                return self._pick_best_available(available_players, draft_session.scoring_type)
            else:
                return self._pick_positional_need(available_players, team, draft_session)
        
        # Late rounds: Mostly positional need
        else:
            # 20% BPA, 80% positional need
            if random.random() < 0.2:
                return self._pick_best_available(available_players, draft_session.scoring_type)
            else:
                return self._pick_positional_need(available_players, team, draft_session)
    
    def _get_ecr_rank(self, player: CustomRankingPlayer, scoring_type: str) -> Optional[int]:
        """Get ECR rank for player based on scoring type"""
        if scoring_type == 'standard':
            return player.ecr_rank_standard
        elif scoring_type == 'half_ppr':
            return player.ecr_rank_half_ppr
        else:
            return player.ecr_rank_ppr
    
    def _get_adp(self, player: CustomRankingPlayer, scoring_type: str) -> Optional[float]:
        """Get ADP for player based on scoring type"""
        if scoring_type == 'standard':
            return player.adp_standard
        elif scoring_type == 'half_ppr':
            return player.adp_half_ppr
        else:
            return player.adp_ppr
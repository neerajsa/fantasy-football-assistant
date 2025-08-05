from typing import List, Tuple, Optional
from ..database.models import DraftSession, DraftTeam, DraftPick
from ..schemas.draft import DraftType


class DraftTurnLogic:
    """Handles turn calculation logic for different draft types"""
    
    @staticmethod
    def calculate_total_rounds(roster_positions: dict) -> int:
        """Calculate total rounds needed based on roster positions"""
        return sum(roster_positions.values())
    
    @staticmethod
    def calculate_draft_order(draft_type: DraftType, num_teams: int, total_rounds: int) -> List[List[int]]:
        """
        Calculate the complete draft order for all rounds
        
        Returns:
            List of lists where each inner list represents team indices for that round
            Example for 4 teams, snake draft:
            [[0,1,2,3], [3,2,1,0], [0,1,2,3], [3,2,1,0], ...]
        """
        draft_order = []
        
        if draft_type == DraftType.SNAKE:
            for round_num in range(1, total_rounds + 1):
                if round_num % 2 == 1:  # Odd rounds: normal order
                    draft_order.append(list(range(num_teams)))
                else:  # Even rounds: reverse order
                    draft_order.append(list(range(num_teams - 1, -1, -1)))
        
        elif draft_type == DraftType.LINEAR:
            # Linear draft: same order every round
            round_order = list(range(num_teams))
            for _ in range(total_rounds):
                draft_order.append(round_order.copy())
        
        return draft_order
    
    @staticmethod
    def get_current_team_index(
        draft_type: DraftType, 
        num_teams: int, 
        current_round: int, 
        current_pick: int
    ) -> int:
        """
        Get the team index that should be picking for the current pick
        
        Args:
            draft_type: Snake or linear
            num_teams: Number of teams in draft
            current_round: Current round (1-based)
            current_pick: Current overall pick number (1-based)
            
        Returns:
            Team index (0-based) that should be picking
        """
        # Convert to 0-based for calculations
        round_zero_based = current_round - 1
        
        # Calculate position within the round (0-based)
        pick_in_round = (current_pick - 1) % num_teams
        
        if draft_type == DraftType.SNAKE:
            if round_zero_based % 2 == 0:  # Odd rounds (0, 2, 4...): normal order
                return pick_in_round
            else:  # Even rounds (1, 3, 5...): reverse order
                return num_teams - 1 - pick_in_round
        
        elif draft_type == DraftType.LINEAR:
            # Linear draft: always same order
            return pick_in_round
        
        raise ValueError(f"Unknown draft type: {draft_type}")
    
    @staticmethod
    def get_next_pick_info(
        draft_type: DraftType,
        num_teams: int,
        total_rounds: int,
        current_round: int,
        current_pick: int
    ) -> Tuple[int, int, int]:
        """
        Calculate the next pick information
        
        Returns:
            Tuple of (next_round, next_pick, next_team_index)
        """
        next_pick = current_pick + 1
        
        # Check if draft is complete
        max_picks = num_teams * total_rounds
        if next_pick > max_picks:
            raise ValueError("Draft is already complete")
        
        # Calculate next round
        next_round = ((next_pick - 1) // num_teams) + 1
        
        # Get next team index
        next_team_index = DraftTurnLogic.get_current_team_index(
            draft_type, num_teams, next_round, next_pick
        )
        
        return next_round, next_pick, next_team_index
    
    @staticmethod
    def is_draft_complete(current_pick: int, num_teams: int, total_rounds: int) -> bool:
        """Check if the draft is complete"""
        max_picks = num_teams * total_rounds
        return current_pick > max_picks
    
    @staticmethod
    def validate_pick_order(
        draft_session: DraftSession,
        team_making_pick: DraftTeam
    ) -> bool:
        """
        Validate that it's the correct team's turn to pick
        
        Returns:
            True if it's the team's turn, False otherwise
        """
        expected_team_index = DraftTurnLogic.get_current_team_index(
            draft_session.draft_type,
            draft_session.num_teams,
            draft_session.current_round,
            draft_session.current_pick
        )
        
        return team_making_pick.team_index == expected_team_index
    
    @staticmethod
    def get_pick_position_info(
        pick_number: int,
        num_teams: int,
        draft_type: DraftType
    ) -> dict:
        """
        Get detailed information about a specific pick position
        
        Returns:
            Dictionary with round, position_in_round, and team_index
        """
        round_number = ((pick_number - 1) // num_teams) + 1
        team_index = DraftTurnLogic.get_current_team_index(
            draft_type, num_teams, round_number, pick_number
        )
        position_in_round = ((pick_number - 1) % num_teams) + 1
        
        return {
            "pick_number": pick_number,
            "round_number": round_number,
            "position_in_round": position_in_round,
            "team_index": team_index
        }


class DraftEngine:
    """Main draft engine that orchestrates draft logic"""
    
    def __init__(self, draft_session: DraftSession):
        self.draft_session = draft_session
        self.turn_logic = DraftTurnLogic()
    
    def initialize_draft_picks(self) -> List[DraftPick]:
        """
        Initialize all draft pick slots for the entire draft
        
        Returns:
            List of DraftPick objects (unpopulated, ready to be filled)
        """
        picks = []
        total_picks = self.draft_session.num_teams * self.draft_session.total_rounds
        
        for pick_num in range(1, total_picks + 1):
            pick_info = self.turn_logic.get_pick_position_info(
                pick_num,
                self.draft_session.num_teams,
                self.draft_session.draft_type
            )
            
            # Find the team for this pick
            team = next(
                team for team in self.draft_session.teams 
                if team.team_index == pick_info["team_index"]
            )
            
            pick = DraftPick(
                draft_session_id=self.draft_session.id,
                team_id=team.id,
                player_id=None,  # Will be filled when pick is made
                round_number=pick_info["round_number"],
                pick_number=pick_num,
                team_pick_number=sum(1 for p in picks if p.team_id == team.id) + 1
            )
            picks.append(pick)
        
        return picks
    
    def can_make_pick(self, team: DraftTeam) -> bool:
        """Check if a team can make a pick right now"""
        return self.turn_logic.validate_pick_order(self.draft_session, team)
    
    def advance_to_next_pick(self) -> bool:
        """
        Advance draft state to the next pick
        
        Returns:
            True if advanced successfully, False if draft is complete
        """
        try:
            next_round, next_pick, next_team_index = self.turn_logic.get_next_pick_info(
                self.draft_session.draft_type,
                self.draft_session.num_teams,
                self.draft_session.total_rounds,
                self.draft_session.current_round,
                self.draft_session.current_pick
            )
            
            self.draft_session.current_round = next_round
            self.draft_session.current_pick = next_pick
            self.draft_session.current_team_index = next_team_index
            
            return True
            
        except ValueError:
            # Draft is complete
            return False
    
    def get_current_team(self) -> Optional[DraftTeam]:
        """Get the team that should be picking now"""
        for team in self.draft_session.teams:
            if team.team_index == self.draft_session.current_team_index:
                return team
        return None
    
    def get_draft_board_state(self) -> dict:
        """
        Get current draft board state for UI display
        
        Returns:
            Dictionary with draft board information
        """
        # Calculate draft order for all rounds
        draft_order = self.turn_logic.calculate_draft_order(
            self.draft_session.draft_type,
            self.draft_session.num_teams,
            self.draft_session.total_rounds
        )
        
        # Get team names in order
        team_names = []
        for i in range(self.draft_session.num_teams):
            team = next(team for team in self.draft_session.teams if team.team_index == i)
            team_names.append(team.team_name)
        
        return {
            "draft_order": draft_order,
            "team_names": team_names,
            "current_round": self.draft_session.current_round,
            "current_pick": self.draft_session.current_pick,
            "current_team_index": self.draft_session.current_team_index,
            "total_rounds": self.draft_session.total_rounds,
            "draft_type": self.draft_session.draft_type.value,
            "is_complete": self.turn_logic.is_draft_complete(
                self.draft_session.current_pick,
                self.draft_session.num_teams,
                self.draft_session.total_rounds
            )
        }
from pydantic import BaseModel, Field
from typing import Optional, Dict, List
from datetime import datetime
from enum import Enum
import uuid


class DraftStatus(str, Enum):
    CREATED = "created"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    ABANDONED = "abandoned"


class DraftType(str, Enum):
    SNAKE = "snake"
    LINEAR = "linear"


class ScoringType(str, Enum):
    STANDARD = "standard"
    PPR = "ppr"
    HALF_PPR = "half_ppr"


class DraftTeamBase(BaseModel):
    team_index: int = Field(..., ge=0, description="0-based position in draft order")
    team_name: str = Field(..., min_length=1, max_length=100)
    is_user: bool = Field(default=False, description="True if human user, False if AI bot")


class DraftTeamCreate(DraftTeamBase):
    pass


class DraftTeam(DraftTeamBase):
    id: uuid.UUID
    draft_session_id: uuid.UUID
    current_roster: Dict[str, int] = Field(default_factory=dict, description="Current roster composition")
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class DraftPickBase(BaseModel):
    round_number: int = Field(..., ge=1)
    pick_number: int = Field(..., ge=1, description="Overall pick number")
    team_pick_number: int = Field(..., ge=1, description="Pick number within the team")


class DraftPickCreate(DraftPickBase):
    team_id: uuid.UUID
    player_id: Optional[uuid.UUID] = None


class DraftPick(DraftPickBase):
    id: uuid.UUID
    draft_session_id: uuid.UUID
    team_id: uuid.UUID
    player_id: Optional[uuid.UUID] = None
    picked_at: Optional[datetime] = None
    pick_time_seconds: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class DraftSessionBase(BaseModel):
    num_teams: int = Field(..., ge=4, le=32, description="Number of teams in the draft")
    draft_type: DraftType
    scoring_type: ScoringType
    roster_positions: Dict[str, int] = Field(..., description="Roster position requirements")


class DraftSessionCreate(DraftSessionBase):
    teams: List[DraftTeamCreate] = Field(..., description="Teams participating in the draft")
    
    class Config:
        json_schema_extra = {
            "example": {
                "num_teams": 12,
                "draft_type": "snake",
                "scoring_type": "ppr",
                "roster_positions": {
                    "qb": 1,
                    "rb": 2,
                    "wr": 2,
                    "te": 1,
                    "flex": 1,
                    "k": 1,
                    "dst": 1,
                    "bench": 6
                },
                "teams": [
                    {"team_index": 0, "team_name": "User Team", "is_user": True},
                    {"team_index": 1, "team_name": "AI Team 1", "is_user": False}
                ]
            }
        }


class DraftSession(DraftSessionBase):
    id: uuid.UUID
    status: DraftStatus
    current_round: int = Field(default=1, ge=1)
    current_pick: int = Field(default=1, ge=1)
    current_team_index: int = Field(default=0, ge=0)
    total_rounds: int = Field(..., ge=1)
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    # Optional relationships
    teams: Optional[List[DraftTeam]] = None
    picks: Optional[List[DraftPick]] = None
    
    class Config:
        from_attributes = True


class DraftSessionSummary(BaseModel):
    """Lightweight version of DraftSession for listing purposes"""
    id: uuid.UUID
    num_teams: int
    draft_type: DraftType
    scoring_type: ScoringType
    status: DraftStatus
    current_round: int
    current_pick: int
    total_rounds: int
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class MakePickRequest(BaseModel):
    player_id: uuid.UUID
    
    class Config:
        json_schema_extra = {
            "example": {
                "player_id": "123e4567-e89b-12d3-a456-426614174000"
            }
        }


class DraftStateResponse(BaseModel):
    """Response containing current draft state"""
    draft_session: DraftSession
    current_team: DraftTeam
    available_players: List[Dict] = Field(default_factory=list, description="Players available to draft")
    recent_picks: List[DraftPick] = Field(default_factory=list, description="Recent draft picks")
    
    class Config:
        json_schema_extra = {
            "example": {
                "draft_session": {
                    "id": "123e4567-e89b-12d3-a456-426614174000",
                    "status": "in_progress",
                    "current_round": 2,
                    "current_pick": 13,
                    "current_team_index": 0
                },
                "current_team": {
                    "team_name": "User Team",
                    "is_user": True
                },
                "available_players": [],
                "recent_picks": []
            }
        }
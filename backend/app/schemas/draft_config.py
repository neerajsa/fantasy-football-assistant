from pydantic import BaseModel, Field
from typing import Optional, Dict
from enum import Enum

class ScoringType(str, Enum):
    STANDARD = "standard"
    PPR = "ppr"
    HALF_PPR = "half_ppr"

class DraftType(str, Enum):
    SNAKE = "snake"
    LINEAR = "linear"

class RosterPositions(BaseModel):
    qb: int = Field(ge=0, le=5, description="Number of QB positions")
    rb: int = Field(ge=0, le=10, description="Number of RB positions")
    wr: int = Field(ge=0, le=10, description="Number of WR positions")
    te: int = Field(ge=0, le=5, description="Number of TE positions")
    flex: int = Field(ge=0, le=5, description="Number of FLEX positions")
    superflex: int = Field(ge=0, le=3, description="Number of SUPERFLEX positions")
    k: int = Field(ge=0, le=3, description="Number of K positions")
    dst: int = Field(ge=0, le=3, description="Number of D/ST positions")
    bench: int = Field(ge=0, le=15, description="Number of bench positions")

class DraftConfigurationCreate(BaseModel):
    scoring_type: ScoringType
    draft_type: DraftType
    draft_position: Optional[int] = Field(None, ge=1, le=32, description="User's draft position (None for random)")
    num_teams: int = Field(ge=4, le=32, description="Number of teams in the league")
    roster_positions: RosterPositions

class DraftConfiguration(DraftConfigurationCreate):
    id: str
    created_at: str

class DraftConfigurationResponse(BaseModel):
    success: bool
    data: Optional[DraftConfiguration] = None
    message: str
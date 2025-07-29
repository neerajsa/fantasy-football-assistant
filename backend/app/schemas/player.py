from pydantic import BaseModel, Field, validator
from typing import Optional
from datetime import datetime
from enum import Enum
import uuid

class PlayerPosition(str, Enum):
    QB = "QB"
    RB = "RB"
    WR = "WR"
    TE = "TE"
    K = "K"
    DST = "DST"

class NFLTeam(str, Enum):
    ARI = "ARI"
    ATL = "ATL"
    BAL = "BAL"
    BUF = "BUF"
    CAR = "CAR"
    CHI = "CHI"
    CIN = "CIN"
    CLE = "CLE"
    DAL = "DAL"
    DEN = "DEN"
    DET = "DET"
    GB = "GB"
    HOU = "HOU"
    IND = "IND"
    JAX = "JAX"
    KC = "KC"
    LV = "LV"
    LAC = "LAC"
    LAR = "LAR"
    MIA = "MIA"
    MIN = "MIN"
    NE = "NE"
    NO = "NO"
    NYG = "NYG"
    NYJ = "NYJ"
    PHI = "PHI"
    PIT = "PIT"
    SF = "SF"
    SEA = "SEA"
    TB = "TB"
    TEN = "TEN"
    WAS = "WAS"

class PlayerBase(BaseModel):
    player_name: str = Field(..., max_length=100, min_length=2)
    position: PlayerPosition
    team: NFLTeam
    bye_week: Optional[int] = Field(None, ge=1, le=18)
    
    @validator('player_name')
    def name_must_be_clean(cls, v):
        return ' '.join(v.split()).title()

class PlayerCreate(PlayerBase):
    # Cross-platform ID mapping
    nfl_id: Optional[str] = None
    sleeper_id: Optional[str] = None
    yahoo_id: Optional[str] = None
    espn_id: Optional[str] = None
    fantasypros_id: Optional[str] = None
    
    # Initial consensus data (will be calculated)
    consensus_rank_standard: Optional[int] = None
    consensus_rank_ppr: Optional[int] = None
    consensus_rank_half_ppr: Optional[int] = None
    
    # ADP by scoring type
    avg_adp_standard: Optional[float] = None
    avg_adp_ppr: Optional[float] = None
    avg_adp_half_ppr: Optional[float] = None
    
    # Projected points by scoring type
    projected_points_standard: Optional[float] = None
    projected_points_ppr: Optional[float] = None
    projected_points_half_ppr: Optional[float] = None
    
    # Previous year points by scoring type
    previous_year_points_standard: Optional[float] = None
    previous_year_points_ppr: Optional[float] = None
    previous_year_points_half_ppr: Optional[float] = None

class Player(PlayerCreate):
    id: str
    source_count: int = 0
    is_active: bool = True
    created_at: datetime
    updated_at: datetime
    last_consensus_update: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class FantasyProPlayerBase(BaseModel):
    player_name: str = Field(..., max_length=100, min_length=2)
    position: str = Field(..., max_length=10)  # String for flexibility
    team: str = Field(..., max_length=10)
    
    # ECR rankings by scoring type
    ecr_rank_standard: Optional[int] = None
    ecr_rank_ppr: Optional[int] = None
    ecr_rank_half_ppr: Optional[int] = None
    
    # ADP by scoring type
    adp_standard: Optional[float] = None
    adp_ppr: Optional[float] = None
    adp_half_ppr: Optional[float] = None
    
    # Previous year points by scoring type
    previous_year_points_standard: Optional[float] = None
    previous_year_points_ppr: Optional[float] = None
    previous_year_points_half_ppr: Optional[float] = None

class FantasyProPlayerCreate(FantasyProPlayerBase):
    pass

class FantasyProPlayer(FantasyProPlayerCreate):
    id: str
    last_updated: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# Response models
class PlayerResponse(BaseModel):
    success: bool
    data: Optional[Player] = None
    message: str

class PlayersListResponse(BaseModel):
    success: bool
    data: Optional[list[Player]] = None
    count: int = 0
    message: str
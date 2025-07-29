from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class CustomRankingPlayerBase(BaseModel):
    player_name: str
    position: str
    team: str
    ecr_rank_standard: Optional[int] = None
    ecr_rank_ppr: Optional[int] = None
    ecr_rank_half_ppr: Optional[int] = None
    adp_standard: Optional[float] = None
    adp_ppr: Optional[float] = None
    adp_half_ppr: Optional[float] = None
    previous_year_points_standard: Optional[float] = None
    previous_year_points_ppr: Optional[float] = None
    previous_year_points_half_ppr: Optional[float] = None

class CustomRankingPlayer(CustomRankingPlayerBase):
    id: str
    last_updated: datetime
    
    class Config:
        from_attributes = True

class CustomRankingPlayerResponse(BaseModel):
    players: list[CustomRankingPlayer]
    total_count: int
    scoring_type: str
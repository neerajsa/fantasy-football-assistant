from sqlalchemy import Column, String, Integer, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.types import Numeric
from sqlalchemy.dialects.postgresql import UUID, ENUM
from sqlalchemy.sql import func
import uuid
from .connection import Base

# Define enums to match database enums
player_position_enum = ENUM('QB', 'RB', 'WR', 'TE', 'K', 'DST', name='player_position')
nfl_team_enum = ENUM(
    'ARI', 'ATL', 'BAL', 'BUF', 'CAR', 'CHI', 'CIN', 'CLE',
    'DAL', 'DEN', 'DET', 'GB', 'HOU', 'IND', 'JAX', 'KC',
    'LV', 'LAC', 'LAR', 'MIA', 'MIN', 'NE', 'NO', 'NYG',
    'NYJ', 'PHI', 'PIT', 'SF', 'SEA', 'TB', 'TEN', 'WAS',
    name='nfl_team'
)

class BaseModel(Base):
    __abstract__ = True
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class Player(BaseModel):
    """Master player table with consensus data across all sources"""
    __tablename__ = "players"
    
    # Primary key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Basic player information
    player_name = Column(String(100), nullable=False)
    position = Column(player_position_enum, nullable=False)
    team = Column(nfl_team_enum, nullable=False)
    bye_week = Column(Integer)
    
    # Cross-platform ID mapping for data correlation
    nfl_id = Column(String(50))
    sleeper_id = Column(String(50))
    yahoo_id = Column(String(50))
    espn_id = Column(String(50))
    fantasypros_id = Column(String(50))
    
    # Consensus rankings by scoring type (aggregated from all sources)
    consensus_rank_standard = Column(Integer)
    consensus_rank_ppr = Column(Integer)
    consensus_rank_half_ppr = Column(Integer)
    
    # Average Draft Position by scoring type
    avg_adp_standard = Column(Numeric(5,2))
    avg_adp_ppr = Column(Numeric(5,2))
    avg_adp_half_ppr = Column(Numeric(5,2))
    
    # Projected points by scoring type
    projected_points_standard = Column(Numeric(6,2))
    projected_points_ppr = Column(Numeric(6,2))
    projected_points_half_ppr = Column(Numeric(6,2))
    
    # Previous year performance by scoring type
    previous_year_points_standard = Column(Numeric(6,2))
    previous_year_points_ppr = Column(Numeric(6,2))
    previous_year_points_half_ppr = Column(Numeric(6,2))
    
    # Metadata
    source_count = Column(Integer, default=0)  # How many sources have this player
    is_active = Column(Boolean, default=True)
    last_consensus_update = Column(DateTime(timezone=True))

class FantasyProPlayer(BaseModel):
    """FantasyPros-specific player rankings and data"""
    __tablename__ = "fantasypros_players"
    
    # Primary key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Basic player information
    player_name = Column(String(100), nullable=False)
    position = Column(String(10), nullable=False)  # Store as string for flexibility
    team = Column(String(10), nullable=False)
    
    # Expert Consensus Rankings by scoring type
    ecr_rank_standard = Column(Integer)
    ecr_rank_ppr = Column(Integer)
    ecr_rank_half_ppr = Column(Integer)
    
    # Average Draft Position by scoring type from FantasyPros
    adp_standard = Column(Numeric(5,2))
    adp_ppr = Column(Numeric(5,2))
    adp_half_ppr = Column(Numeric(5,2))
    
    # Previous year points by scoring type
    previous_year_points_standard = Column(Numeric(6,2))
    previous_year_points_ppr = Column(Numeric(6,2))
    previous_year_points_half_ppr = Column(Numeric(6,2))
    
    # Data quality and freshness
    last_updated = Column(DateTime(timezone=True), server_default=func.now())


class CustomRankingPlayer(BaseModel):
    """Custom first-party player rankings with same structure as FantasyPros"""
    __tablename__ = "custom_rankings_players"
    
    # Primary key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Basic player information (exact same as FantasyPros)
    player_name = Column(String(100), nullable=False)
    position = Column(String(10), nullable=False)
    team = Column(String(10), nullable=False)
    
    # Expert Consensus Rankings by scoring type (our custom calculations)
    ecr_rank_standard = Column(Integer)
    ecr_rank_ppr = Column(Integer)
    ecr_rank_half_ppr = Column(Integer)
    
    # Average Draft Position by scoring type (our custom calculations)
    adp_standard = Column(Numeric(5,2))
    adp_ppr = Column(Numeric(5,2))
    adp_half_ppr = Column(Numeric(5,2))
    
    # Previous year points by scoring type (copied from FantasyPros)
    previous_year_points_standard = Column(Numeric(6,2))
    previous_year_points_ppr = Column(Numeric(6,2))
    previous_year_points_half_ppr = Column(Numeric(6,2))
    
    # Data quality and freshness
    last_updated = Column(DateTime(timezone=True), server_default=func.now())
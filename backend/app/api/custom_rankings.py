from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List
import psycopg2
from ..schemas.custom_rankings import CustomRankingPlayerResponse, CustomRankingPlayer as CustomRankingPlayerSchema
import logging
from datetime import datetime

router = APIRouter(prefix="/custom-rankings", tags=["custom-rankings"])
logger = logging.getLogger(__name__)

def get_db_connection():
    """Get database connection"""
    return psycopg.connect("postgresql://fantasy_user:fantasy_password@localhost:5432/fantasy_football")

@router.get("/")
async def get_custom_rankings(
    scoring_type: str = Query("half_ppr", description="Scoring type: standard, ppr, or half_ppr"),
    position: Optional[str] = Query(None, description="Filter by position (QB, RB, WR, TE, K, DST)"),
    team: Optional[str] = Query(None, description="Filter by team"),
    limit: int = Query(100, ge=1, le=500, description="Number of players to return"),
    offset: int = Query(0, ge=0, description="Number of players to skip")
):
    """Get custom player rankings with filtering and pagination"""
    
    # Validate scoring type
    valid_scoring_types = ["standard", "ppr", "half_ppr"]
    if scoring_type not in valid_scoring_types:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid scoring_type. Must be one of: {valid_scoring_types}"
        )
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        # Build base query
        where_conditions = [f"ecr_rank_{scoring_type} IS NOT NULL"]
        params = []
        
        # Apply filters
        if position:
            where_conditions.append("position = %s")
            params.append(position.upper())
        
        if team:
            where_conditions.append("team = %s")
            params.append(team.upper())
        
        where_clause = " AND ".join(where_conditions)
        
        # Get total count
        count_query = f"""
            SELECT COUNT(*) FROM custom_rankings_players 
            WHERE {where_clause}
        """
        cur.execute(count_query, params)
        total_count = cur.fetchone()[0]
        
        # Get players with pagination
        query = f"""
            SELECT id, player_name, position, team,
                   ecr_rank_standard, ecr_rank_ppr, ecr_rank_half_ppr,
                   adp_standard, adp_ppr, adp_half_ppr,
                   previous_year_points_standard, previous_year_points_ppr, previous_year_points_half_ppr,
                   last_updated
            FROM custom_rankings_players 
            WHERE {where_clause}
            ORDER BY ecr_rank_{scoring_type}
            LIMIT %s OFFSET %s
        """
        params.extend([limit, offset])
        cur.execute(query, params)
        
        players = []
        for row in cur.fetchall():
            players.append({
                "id": str(row[0]),
                "player_name": row[1],
                "position": row[2],
                "team": row[3],
                "ecr_rank_standard": row[4],
                "ecr_rank_ppr": row[5],
                "ecr_rank_half_ppr": row[6],
                "adp_standard": float(row[7]) if row[7] else None,
                "adp_ppr": float(row[8]) if row[8] else None,
                "adp_half_ppr": float(row[9]) if row[9] else None,
                "previous_year_points_standard": float(row[10]) if row[10] else None,
                "previous_year_points_ppr": float(row[11]) if row[11] else None,
                "previous_year_points_half_ppr": float(row[12]) if row[12] else None,
                "last_updated": row[13]
            })
        
        return {
            "players": players,
            "total_count": total_count,
            "scoring_type": scoring_type
        }
        
    finally:
        conn.close()

@router.get("/player/{player_name}")
async def get_custom_ranking_by_name(player_name: str):
    """Get custom ranking for a specific player by name"""
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        query = """
            SELECT id, player_name, position, team,
                   ecr_rank_standard, ecr_rank_ppr, ecr_rank_half_ppr,
                   adp_standard, adp_ppr, adp_half_ppr,
                   previous_year_points_standard, previous_year_points_ppr, previous_year_points_half_ppr,
                   last_updated
            FROM custom_rankings_players 
            WHERE player_name ILIKE %s
            LIMIT 1
        """
        cur.execute(query, [f"%{player_name}%"])
        row = cur.fetchone()
        
        if not row:
            raise HTTPException(
                status_code=404,
                detail=f"Player '{player_name}' not found in custom rankings"
            )
        
        return {
            "id": str(row[0]),
            "player_name": row[1],
            "position": row[2],
            "team": row[3],
            "ecr_rank_standard": row[4],
            "ecr_rank_ppr": row[5],
            "ecr_rank_half_ppr": row[6],
            "adp_standard": float(row[7]) if row[7] else None,
            "adp_ppr": float(row[8]) if row[8] else None,
            "adp_half_ppr": float(row[9]) if row[9] else None,
            "previous_year_points_standard": float(row[10]) if row[10] else None,
            "previous_year_points_ppr": float(row[11]) if row[11] else None,
            "previous_year_points_half_ppr": float(row[12]) if row[12] else None,
            "last_updated": row[13]
        }
        
    finally:
        conn.close()

@router.get("/compare")
async def compare_custom_vs_fantasypros(
    scoring_type: str = Query("half_ppr", description="Scoring type: standard, ppr, or half_ppr"),
    limit: int = Query(50, ge=1, le=200, description="Number of players to compare")
):
    """Compare custom rankings vs FantasyPros rankings"""
    
    # Validate scoring type
    valid_scoring_types = ["standard", "ppr", "half_ppr"]
    if scoring_type not in valid_scoring_types:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid scoring_type. Must be one of: {valid_scoring_types}"
        )
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        # Raw SQL query to join custom rankings with FantasyPros data
        query = f"""
        SELECT 
            c.player_name,
            c.position,
            c.team,
            c.ecr_rank_{scoring_type} as custom_rank,
            c.adp_{scoring_type} as custom_adp,
            f.ecr_rank_{scoring_type} as fantasypros_rank,
            f.adp_{scoring_type} as fantasypros_adp,
            (c.ecr_rank_{scoring_type} - f.ecr_rank_{scoring_type}) as rank_difference
        FROM custom_rankings_players c
        LEFT JOIN fantasypros_players f ON c.player_name = f.player_name 
            AND c.position = f.position 
            AND c.team = f.team
        WHERE c.ecr_rank_{scoring_type} IS NOT NULL 
            AND f.ecr_rank_{scoring_type} IS NOT NULL
        ORDER BY c.ecr_rank_{scoring_type}
        LIMIT %s
        """
        
        cur.execute(query, [limit])
        comparisons = []
        
        for row in cur.fetchall():
            comparisons.append({
                "player_name": row[0],
                "position": row[1],
                "team": row[2],
                "custom_rank": row[3],
                "custom_adp": float(row[4]) if row[4] else None,
                "fantasypros_rank": row[5],
                "fantasypros_adp": float(row[6]) if row[6] else None,
                "rank_difference": row[7],
                "custom_higher": row[7] < 0  # True if custom rank is better (lower number)
            })
        
        return {
            "scoring_type": scoring_type,
            "comparisons": comparisons,
            "total_compared": len(comparisons)
        }
        
    finally:
        conn.close()

@router.get("/positions/{position}")
async def get_custom_rankings_by_position(
    position: str,
    scoring_type: str = Query("half_ppr", description="Scoring type: standard, ppr, or half_ppr"),
    limit: int = Query(50, ge=1, le=200, description="Number of players to return")
):
    """Get custom rankings for a specific position"""
    
    # Validate position
    valid_positions = ["QB", "RB", "WR", "TE", "K", "DST"]
    position_upper = position.upper()
    if position_upper not in valid_positions:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid position. Must be one of: {valid_positions}"
        )
    
    # Validate scoring type
    valid_scoring_types = ["standard", "ppr", "half_ppr"]
    if scoring_type not in valid_scoring_types:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid scoring_type. Must be one of: {valid_scoring_types}"
        )
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        query = f"""
            SELECT id, player_name, position, team,
                   ecr_rank_standard, ecr_rank_ppr, ecr_rank_half_ppr,
                   adp_standard, adp_ppr, adp_half_ppr,
                   previous_year_points_standard, previous_year_points_ppr, previous_year_points_half_ppr,
                   last_updated
            FROM custom_rankings_players 
            WHERE position = %s AND ecr_rank_{scoring_type} IS NOT NULL
            ORDER BY ecr_rank_{scoring_type}
            LIMIT %s
        """
        cur.execute(query, [position_upper, limit])
        
        players = []
        for row in cur.fetchall():
            players.append({
                "id": str(row[0]),
                "player_name": row[1],
                "position": row[2],
                "team": row[3],
                "ecr_rank_standard": row[4],
                "ecr_rank_ppr": row[5],
                "ecr_rank_half_ppr": row[6],
                "adp_standard": float(row[7]) if row[7] else None,
                "adp_ppr": float(row[8]) if row[8] else None,
                "adp_half_ppr": float(row[9]) if row[9] else None,
                "previous_year_points_standard": float(row[10]) if row[10] else None,
                "previous_year_points_ppr": float(row[11]) if row[11] else None,
                "previous_year_points_half_ppr": float(row[12]) if row[12] else None,
                "last_updated": row[13]
            })
        
        return {
            "position": position_upper,
            "scoring_type": scoring_type,
            "players": players,
            "count": len(players)
        }
        
    finally:
        conn.close()

@router.get("/stats")
async def get_custom_rankings_stats():
    """Get statistics about the custom rankings database"""
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        # Get total players
        cur.execute("SELECT COUNT(*) FROM custom_rankings_players")
        total_players = cur.fetchone()[0]
        
        # Count by position
        cur.execute("""
            SELECT position, COUNT(*) as count
            FROM custom_rankings_players 
            GROUP BY position 
            ORDER BY count DESC
        """)
        position_counts = dict(cur.fetchall())
        
        # Count players with rankings in each scoring type
        scoring_stats = {}
        for scoring_type in ["standard", "ppr", "half_ppr"]:
            cur.execute(f"""
                SELECT COUNT(*) FROM custom_rankings_players 
                WHERE ecr_rank_{scoring_type} IS NOT NULL
            """)
            scoring_stats[scoring_type] = cur.fetchone()[0]
        
        # Get last updated
        cur.execute("SELECT MAX(last_updated) FROM custom_rankings_players")
        last_updated = cur.fetchone()[0]
        
        return {
            "total_players": total_players,
            "position_breakdown": position_counts,
            "scoring_type_coverage": scoring_stats,
            "last_updated": last_updated
        }
        
    finally:
        conn.close()
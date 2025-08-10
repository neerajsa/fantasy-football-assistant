from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid

from ..database.connection import get_db
from ..services.draft_service import DraftService
from ..schemas.draft import (
    DraftSessionCreate, DraftSession, DraftSessionSummary,
    MakePickRequest, DraftStateResponse, DraftPick
)

router = APIRouter(prefix="/api/draft", tags=["draft"])


def get_draft_service(db: Session = Depends(get_db)) -> DraftService:
    """Dependency to get draft service"""
    return DraftService(db)


@router.post("/", response_model=DraftSession, summary="Create a new draft session")
async def create_draft_session(
    draft_data: DraftSessionCreate,
    draft_service: DraftService = Depends(get_draft_service)
):
    """
    Create a new draft session with teams and initialize all pick slots.
    
    The draft will be created in 'created' status and must be started separately.
    """
    try:
        draft_session = draft_service.create_draft_session(draft_data)
        return draft_session
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/", response_model=List[DraftSessionSummary], summary="List draft sessions")
async def list_draft_sessions(
    limit: int = Query(50, ge=1, le=100, description="Maximum number of sessions to return"),
    draft_service: DraftService = Depends(get_draft_service)
):
    """List recent draft sessions"""
    try:
        sessions = draft_service.list_draft_sessions(limit=limit)
        return sessions
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{draft_id}", response_model=DraftSession, summary="Get draft session details")
async def get_draft_session(
    draft_id: uuid.UUID,
    draft_service: DraftService = Depends(get_draft_service)
):
    """Get detailed information about a specific draft session"""
    try:
        draft_session = draft_service.get_draft_session(draft_id)
        if not draft_session:
            raise HTTPException(status_code=404, detail="Draft session not found")
        return draft_session
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{draft_id}/start", response_model=DraftSession, summary="Start a draft session")
async def start_draft_session(
    draft_id: uuid.UUID,
    draft_service: DraftService = Depends(get_draft_service)
):
    """
    Start a draft session, changing its status from 'created' to 'in_progress'.
    Once started, teams can begin making picks.
    """
    try:
        draft_session = draft_service.start_draft(draft_id)
        return draft_session
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{draft_id}/state", response_model=DraftStateResponse, summary="Get current draft state")
async def get_draft_state(
    draft_id: uuid.UUID,
    draft_service: DraftService = Depends(get_draft_service)
):
    """
    Get the complete current state of a draft including:
    - Draft session details
    - Current team to pick
    - Available players
    - Recent picks
    """
    try:
        draft_state = draft_service.get_draft_state(draft_id)
        return draft_state
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{draft_id}/teams/{team_id}/pick", response_model=DraftPick, summary="Make a draft pick")
async def make_draft_pick(
    draft_id: uuid.UUID,
    team_id: uuid.UUID,
    pick_request: MakePickRequest,
    draft_service: DraftService = Depends(get_draft_service)
):
    """
    Make a draft pick for a specific team.
    
    Validates:
    - Draft is in progress
    - It's the team's turn to pick
    - Player exists and is available
    - Pick slot is empty
    """
    try:
        pick = draft_service.make_pick(draft_id, team_id, pick_request)
        return pick
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{draft_id}/player/{player_id}", summary="Get player from player id")
async def get_player_from_player_id(
    draft_id: uuid.UUID,
    player_id: uuid.UUID,
    draft_service: DraftService = Depends(get_draft_service)
):
    """Get player from player id"""
    try:
        player = draft_service.get_player_from_player_id(draft_id, player_id)
        return player
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{draft_id}/available-players", summary="Get available players")
async def get_available_players(
    draft_id: uuid.UUID,
    position: Optional[str] = Query(None, description="Filter by position (QB, RB, WR, TE, K, DST)"),  
    limit: int = Query(100, ge=1, le=500, description="Maximum number of players to return"),
    draft_service: DraftService = Depends(get_draft_service)
):
    """Get players available for drafting, optionally filtered by position and ordered by appropriate ECR ranking based on draft's scoring type"""
    try:
        # Get the draft session to determine scoring type
        draft_session = draft_service.get_draft_session(draft_id)
        if not draft_session:
            raise HTTPException(status_code=404, detail="Draft session not found")
        
        # Get available players with scoring type-aware ordering
        players = draft_service.get_available_players(draft_id, position, limit, draft_session.scoring_type)
        
        # Convert to dict format for response
        players_dict = []
        for player in players:
            players_dict.append({
                "id": str(player.id),
                "player_name": player.player_name,
                "position": player.position,
                "team": player.team,
                "ecr_rank_ppr": player.ecr_rank_ppr,
                "ecr_rank_standard": player.ecr_rank_standard,
                "ecr_rank_half_ppr": player.ecr_rank_half_ppr,
                "adp_ppr": float(player.adp_ppr) if player.adp_ppr else None,
                "adp_standard": float(player.adp_standard) if player.adp_standard else None,
                "adp_half_ppr": float(player.adp_half_ppr) if player.adp_half_ppr else None,
                "previous_year_points_standard": float(player.previous_year_points_standard) if player.previous_year_points_standard else None,
                "previous_year_points_ppr": float(player.previous_year_points_ppr) if player.previous_year_points_ppr else None,
                "previous_year_points_half_ppr": float(player.previous_year_points_half_ppr) if player.previous_year_points_half_ppr else None
            })
        
        return {
            "players": players_dict,
            "total": len(players_dict),
            "position_filter": position,
            "scoring_type": draft_session.scoring_type
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{draft_id}/recent-picks", response_model=List[DraftPick], summary="Get recent draft picks")
async def get_recent_picks(
    draft_id: uuid.UUID,
    limit: int = Query(10, ge=1, le=50, description="Number of recent picks to return"),
    draft_service: DraftService = Depends(get_draft_service)
):
    """Get recent picks made in the draft"""
    try:
        picks = draft_service.get_recent_picks(draft_id, limit)
        return picks
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{draft_id}", summary="Delete a draft session")
async def delete_draft_session(
    draft_id: uuid.UUID,
    draft_service: DraftService = Depends(get_draft_service)
):
    """Delete a draft session and all related data"""
    try:
        deleted = draft_service.delete_draft_session(draft_id)
        if not deleted:
            raise HTTPException(status_code=404, detail="Draft session not found")
        return {"message": "Draft session deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{draft_id}/validation", summary="Get draft validation report")
async def get_draft_validation_report(
    draft_id: uuid.UUID,
    draft_service: DraftService = Depends(get_draft_service)
):
    """Get comprehensive validation and integrity report for a draft session"""
    try:
        report = draft_service.get_draft_validation_report(draft_id)
        return report
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{draft_id}/ai-pick", summary="Make AI pick for current team")
async def make_ai_pick(
    draft_id: uuid.UUID,
    draft_service: DraftService = Depends(get_draft_service)
):
    """Make an AI pick for the current team on the clock (for testing/manual AI advancement)"""
    try:
        pick = draft_service.make_ai_pick(draft_id)
        
        # Convert to dict format for response
        return {
            "id": str(pick.id),
            "draft_session_id": str(pick.draft_session_id),
            "team_id": str(pick.team_id),
            "player_id": str(pick.player_id) if pick.player_id else None,
            "round_number": pick.round_number,
            "pick_number": pick.pick_number,
            "team_pick_number": pick.team_pick_number,
            "picked_at": pick.picked_at.isoformat() if pick.picked_at else None,
            "pick_time_seconds": pick.pick_time_seconds
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{draft_id}/undo-to-user-pick", response_model=DraftStateResponse, summary="Undo all picks back to user's previous pick")
async def undo_to_user_pick(
    draft_id: uuid.UUID,
    draft_service: DraftService = Depends(get_draft_service)
):
    """Undo all draft picks back to and including the user's most recent pick"""
    try:
        draft_state = draft_service.undo_to_user_pick(draft_id)
        return draft_state
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{draft_id}/auto-draft-pick", response_model=DraftPick, summary="Make an auto-draft pick for user team")
async def make_auto_draft_pick(
    draft_id: uuid.UUID,
    draft_service: DraftService = Depends(get_draft_service)
):
    """Make an automatic pick for the user team using AI recommendations"""
    try:
        pick = draft_service.make_auto_draft_pick(draft_id)
        return pick
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{draft_id}/teams/{team_id}/recommendations", summary="Get pick recommendations for team")
async def get_pick_recommendations(
    draft_id: uuid.UUID,
    team_id: uuid.UUID,
    num_recommendations: int = Query(5, ge=1, le=10, description="Number of recommendations to return"),
    draft_service: DraftService = Depends(get_draft_service)
):
    """Get AI-powered pick recommendations for a specific team"""
    try:
        recommendations = draft_service.get_pick_recommendations(draft_id, team_id, num_recommendations)
        
        return {
            "recommendations": recommendations,
            "total": len(recommendations),
            "draft_id": str(draft_id),
            "team_id": str(team_id)
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
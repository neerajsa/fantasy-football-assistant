from fastapi import APIRouter, HTTPException
from datetime import datetime
import uuid
import random
from typing import Dict, Any

from ..schemas.draft_config import (
    DraftConfigurationCreate,
    DraftConfiguration,
    DraftConfigurationResponse
)

router = APIRouter(prefix="/api/draft-config", tags=["draft-configuration"])

draft_configs: Dict[str, Dict[str, Any]] = {}

@router.post("/", response_model=DraftConfigurationResponse)
async def create_draft_configuration(config: DraftConfigurationCreate):
    try:
        config_id = str(uuid.uuid4())
        
        draft_position = config.draft_position
        if draft_position is None:
            draft_position = random.randint(1, config.num_teams)
        
        draft_config_data = {
            "id": config_id,
            "scoring_type": config.scoring_type,
            "draft_type": config.draft_type,
            "draft_position": draft_position,
            "num_teams": config.num_teams,
            "roster_positions": config.roster_positions.model_dump(),
            "created_at": datetime.now().isoformat()
        }
        
        draft_configs[config_id] = draft_config_data
        
        return DraftConfigurationResponse(
            success=True,
            data=DraftConfiguration(**draft_config_data),
            message="Draft configuration created successfully"
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create draft configuration: {str(e)}")

@router.get("/{config_id}", response_model=DraftConfigurationResponse)
async def get_draft_configuration(config_id: str):
    if config_id not in draft_configs:
        raise HTTPException(status_code=404, detail="Draft configuration not found")
    
    config_data = draft_configs[config_id]
    return DraftConfigurationResponse(
        success=True,
        data=DraftConfiguration(**config_data),
        message="Draft configuration retrieved successfully"
    )

@router.get("/", response_model=Dict[str, Any])
async def list_draft_configurations():
    return {
        "success": True,
        "data": list(draft_configs.values()),
        "message": f"Retrieved {len(draft_configs)} draft configurations"
    }
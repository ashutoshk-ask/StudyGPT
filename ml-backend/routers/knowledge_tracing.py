from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict
from models.dkt_model import DKTPredictor
from models.bkt_model import MultiskillBKT
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

# Initialize models
dkt_predictor = DKTPredictor(num_skills=100)
bkt_tracker = MultiskillBKT()

class InteractionInput(BaseModel):
    skill_id: int
    correct: bool

class UserInteractionsInput(BaseModel):
    user_id: str
    interactions: List[Dict]

class PredictMasteryRequest(BaseModel):
    user_id: str
    interactions: List[Dict]
    skill_id: int

@router.post("/dkt/predict-mastery")
async def predict_mastery_dkt(request: PredictMasteryRequest):
    """
    Predict mastery using Deep Knowledge Tracing
    """
    try:
        mastery = dkt_predictor.predict_mastery(
            user_interactions=request.interactions,
            skill_id=request.skill_id
        )

        return {
            "user_id": request.user_id,
            "skill_id": request.skill_id,
            "mastery_probability": mastery,
            "model": "DKT"
        }
    except Exception as e:
        logger.error(f"DKT prediction error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/dkt/predict-all")
async def predict_all_skills_dkt(request: UserInteractionsInput):
    """
    Predict mastery for all skills using DKT
    """
    try:
        predictions = dkt_predictor.predict_all_skills(request.interactions)

        return {
            "user_id": request.user_id,
            "predictions": predictions,
            "model": "DKT"
        }
    except Exception as e:
        logger.error(f"DKT all skills prediction error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/dkt/weak-skills")
async def get_weak_skills_dkt(request: UserInteractionsInput, threshold: float = 0.6):
    """
    Get weak skills identified by DKT
    """
    try:
        weak_skills = dkt_predictor.get_weak_skills(
            request.interactions,
            threshold=threshold
        )

        return {
            "user_id": request.user_id,
            "weak_skills": weak_skills,
            "threshold": threshold,
            "model": "DKT"
        }
    except Exception as e:
        logger.error(f"DKT weak skills error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/bkt/update")
async def update_bkt(interaction: InteractionInput, user_id: str):
    """
    Update BKT model with new interaction
    """
    try:
        updated_state = bkt_tracker.update_skill(
            interaction.skill_id,
            interaction.correct
        )

        return {
            "user_id": user_id,
            "skill_id": interaction.skill_id,
            "knowledge_state": updated_state,
            "model": "BKT"
        }
    except Exception as e:
        logger.error(f"BKT update error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/bkt/process-history")
async def process_interaction_history(request: UserInteractionsInput):
    """
    Process entire interaction history with BKT
    """
    try:
        skill_states = bkt_tracker.process_interaction_history(request.interactions)

        return {
            "user_id": request.user_id,
            "skill_states": skill_states,
            "model": "BKT"
        }
    except Exception as e:
        logger.error(f"BKT history processing error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/bkt/weak-skills/{user_id}")
async def get_weak_skills_bkt(user_id: str, threshold: float = 0.6):
    """
    Get weak skills from BKT
    """
    try:
        weak_skills = bkt_tracker.get_weak_skills(threshold=threshold)

        return {
            "user_id": user_id,
            "weak_skills": weak_skills,
            "threshold": threshold,
            "model": "BKT"
        }
    except Exception as e:
        logger.error(f"BKT weak skills error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/bkt/mastered-skills/{user_id}")
async def get_mastered_skills(user_id: str, threshold: float = 0.95):
    """
    Get mastered skills from BKT
    """
    try:
        mastered_skills = bkt_tracker.get_mastered_skills(threshold=threshold)

        return {
            "user_id": user_id,
            "mastered_skills": mastered_skills,
            "threshold": threshold,
            "model": "BKT"
        }
    except Exception as e:
        logger.error(f"BKT mastered skills error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/bkt/all-states/{user_id}")
async def get_all_skill_states(user_id: str):
    """
    Get knowledge states for all skills
    """
    try:
        all_states = bkt_tracker.get_all_states()

        return {
            "user_id": user_id,
            "skill_states": all_states,
            "total_skills_tracked": len(all_states),
            "model": "BKT"
        }
    except Exception as e:
        logger.error(f"BKT all states error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

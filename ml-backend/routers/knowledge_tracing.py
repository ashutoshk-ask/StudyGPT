from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from models.dkt_model import DKTPredictor
from models.bkt_model import AdvancedKnowledgeTracing
import logging
from datetime import datetime

router = APIRouter()
logger = logging.getLogger(__name__)

# Initialize enhanced models
dkt_predictor = DKTPredictor(num_skills=100)
advanced_kt = AdvancedKnowledgeTracing()

class EnhancedInteractionInput(BaseModel):
    user_id: str
    skill: str
    correct: bool
    time_taken: Optional[float] = 60.0
    expected_time: Optional[float] = 60.0
    difficulty: Optional[float] = 0.5
    question_type: Optional[str] = "standard"
    hints_used: Optional[int] = 0
    attempts: Optional[int] = 1
    context_transfer: Optional[bool] = False
    steps_shown: Optional[List[str]] = []

class MasteryQueryRequest(BaseModel):
    user_id: str
    skill: str

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

@router.post("/update-knowledge")
async def update_knowledge_state(interaction: EnhancedInteractionInput):
    """
    Update knowledge state using Enhanced Knowledge Tracing (0.01-10.0 scale)
    """
    try:
        # Prepare interaction data
        interaction_data = {
            'correct': interaction.correct,
            'time_taken': interaction.time_taken,
            'expected_time': interaction.expected_time,
            'difficulty': interaction.difficulty,
            'type': interaction.question_type,
            'hints_used': interaction.hints_used,
            'attempts': interaction.attempts,
            'context_transfer': interaction.context_transfer,
            'steps_shown': interaction.steps_shown
        }
        
        # Update knowledge state
        knowledge_state = advanced_kt.calculate_complex_mastery(
            interaction.user_id,
            interaction.skill,
            interaction_data
        )
        
        # Get interpretation
        interpretation = advanced_kt.get_mastery_interpretation(knowledge_state.mastery_level)
        
        return {
            "user_id": interaction.user_id,
            "skill": interaction.skill,
            "knowledge_state": {
                "mastery_level": knowledge_state.mastery_level,
                "confidence": knowledge_state.confidence,
                "understanding_depth": knowledge_state.understanding_depth,
                "application_skill": knowledge_state.application_skill,
                "retention_strength": knowledge_state.retention_strength,
                "learning_velocity": knowledge_state.learning_velocity,
                "cognitive_load": knowledge_state.cognitive_load,
                "last_updated": knowledge_state.last_updated.isoformat()
            },
            "interpretation": interpretation,
            "model": "Enhanced_KT"
        }
    except Exception as e:
        logger.error(f"Enhanced KT update error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/mastery-level/{user_id}/{skill}")
async def get_mastery_level(user_id: str, skill: str):
    """
    Get current mastery level for a specific skill
    """
    try:
        knowledge_state = advanced_kt.knowledge_states.get(f"{user_id}_{skill}")
        
        if not knowledge_state:
            return {
                "user_id": user_id,
                "skill": skill,
                "mastery_level": 0.01,
                "status": "not_started",
                "message": "No interaction data found for this skill"
            }
        
        interpretation = advanced_kt.get_mastery_interpretation(knowledge_state.mastery_level)
        
        return {
            "user_id": user_id,
            "skill": skill,
            "mastery_level": knowledge_state.mastery_level,
            "confidence": knowledge_state.confidence,
            "interpretation": interpretation,
            "last_updated": knowledge_state.last_updated.isoformat(),
            "model": "Enhanced_KT"
        }
    except Exception as e:
        logger.error(f"Mastery level retrieval error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/skill-profile/{user_id}")
async def get_user_skill_profile(user_id: str):
    """
    Get comprehensive skill profile for a user
    """
    try:
        user_skills = {}
        
        for key, state in advanced_kt.knowledge_states.items():
            if key.startswith(f"{user_id}_"):
                skill = key.split(f"{user_id}_")[1]
                interpretation = advanced_kt.get_mastery_interpretation(state.mastery_level)
                
                user_skills[skill] = {
                    "mastery_level": state.mastery_level,
                    "level_name": interpretation["level"],
                    "ready_for_exam": interpretation["ready_for_exam"],
                    "confidence_score": interpretation["confidence_score"],
                    "recommendations": interpretation["recommendations"],
                    "understanding_depth": state.understanding_depth,
                    "application_skill": state.application_skill,
                    "learning_velocity": state.learning_velocity,
                    "last_updated": state.last_updated.isoformat()
                }
        
        # Categorize skills
        novice_skills = [s for s, d in user_skills.items() if d["mastery_level"] < 1.0]
        developing_skills = [s for s, d in user_skills.items() if 1.0 <= d["mastery_level"] < 3.0]
        competent_skills = [s for s, d in user_skills.items() if 3.0 <= d["mastery_level"] < 5.0]
        proficient_skills = [s for s, d in user_skills.items() if 5.0 <= d["mastery_level"] < 7.0]
        advanced_skills = [s for s, d in user_skills.items() if 7.0 <= d["mastery_level"] < 8.5]
        expert_skills = [s for s, d in user_skills.items() if d["mastery_level"] >= 8.5]
        
        return {
            "user_id": user_id,
            "skill_profile": user_skills,
            "skill_distribution": {
                "novice": {"count": len(novice_skills), "skills": novice_skills},
                "developing": {"count": len(developing_skills), "skills": developing_skills},
                "competent": {"count": len(competent_skills), "skills": competent_skills},
                "proficient": {"count": len(proficient_skills), "skills": proficient_skills},
                "advanced": {"count": len(advanced_skills), "skills": advanced_skills},
                "expert": {"count": len(expert_skills), "skills": expert_skills}
            },
            "exam_readiness": {
                "ready_skills": len(competent_skills) + len(proficient_skills) + len(advanced_skills) + len(expert_skills),
                "total_skills": len(user_skills),
                "readiness_percentage": ((len(competent_skills) + len(proficient_skills) + len(advanced_skills) + len(expert_skills)) / len(user_skills) * 100) if user_skills else 0
            },
            "model": "Enhanced_KT"
        }
    except Exception as e:
        logger.error(f"Skill profile error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

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

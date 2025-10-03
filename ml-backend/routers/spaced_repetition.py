from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional, Any
from datetime import datetime
from models.spaced_repetition import AdvancedSpacedRepetition, ResponseQuality
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

advanced_sr = AdvancedSpacedRepetition()

class EnhancedPerformanceData(BaseModel):
    accuracy: float = 0.5
    speed_score: float = 0.5
    retention_rate: float = 0.5
    max_difficulty: float = 0.3
    exam_weight: float = 1.0

class AdvancedScheduleRequest(BaseModel):
    user_id: str
    topic: str
    mastery_level: float
    performance_data: EnhancedPerformanceData

class ReviewStateInput(BaseModel):
    repetition: int = 0
    interval: int = 1
    ease_factor: float = 2.5
    was_on_time: bool = True

class ScheduleReviewRequest(BaseModel):
    user_id: str
    topic_id: str
    current_state: ReviewStateInput
    quality: int  # 0-5

class ReviewItemInput(BaseModel):
    topic_id: str
    last_review_date: datetime
    next_review_date: datetime
    ease_factor: float = 2.5
    importance: float = 1.0
    repetition: int = 0
    interval: int = 1

class OptimizeSessionRequest(BaseModel):
    available_minutes: int
    review_items: List[ReviewItemInput]

@router.post("/advanced-schedule")
async def schedule_advanced_review(request: AdvancedScheduleRequest):
    """
    Schedule review using Advanced Spaced Repetition with mastery-based customization
    """
    try:
        performance_data = request.performance_data.dict()
        
        schedule = advanced_sr.calculate_review_schedule(
            user_id=request.user_id,
            topic=request.topic,
            mastery_level=request.mastery_level,
            performance_data=performance_data
        )

        return {
            "user_id": request.user_id,
            "topic": request.topic,
            "mastery_level": request.mastery_level,
            "review_schedule": {
                "next_review": schedule.next_review.isoformat(),
                "ease_factor": schedule.ease_factor,
                "interval_days": schedule.interval_days,
                "review_count": schedule.review_count,
                "mastery_threshold": schedule.mastery_threshold,
                "priority_score": schedule.priority_score
            },
            "algorithm": "Advanced SR with Mastery Integration"
        }
    except Exception as e:
        logger.error(f"Advanced schedule error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/due-reviews/{user_id}")
async def get_user_due_reviews(user_id: str):
    """
    Get all topics due for review for a specific user, sorted by priority
    """
    try:
        due_reviews = advanced_sr.get_due_reviews(user_id)
        
        return {
            "user_id": user_id,
            "due_reviews": due_reviews,
            "count": len(due_reviews),
            "urgent_reviews": [r for r in due_reviews if r["overdue_hours"] > 24],
            "algorithm": "Advanced SR Priority Sorting"
        }
    except Exception as e:
        logger.error(f"Due reviews error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/schedule-review")
async def schedule_review(request: ScheduleReviewRequest):
    """
    Schedule next review using adaptive SM-2+
    """
    try:
        current_state_dict = request.current_state.dict()
        next_state = adaptive_sr.schedule_review(
            user_id=request.user_id,
            topic_id=request.topic_id,
            current_state=current_state_dict,
            quality=request.quality
        )

        return {
            "user_id": request.user_id,
            "topic_id": request.topic_id,
            "next_state": next_state,
            "algorithm": "Adaptive SM-2+"
        }
    except Exception as e:
        logger.error(f"Schedule review error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/due-reviews")
async def get_due_reviews(
    review_items: List[ReviewItemInput],
    max_items: int = 50
):
    """
    Get prioritized list of due reviews
    """
    try:
        items_dict = [item.dict() for item in review_items]
        due_items = adaptive_sr.get_due_reviews(items_dict, max_items)

        return {
            "due_reviews": due_items,
            "count": len(due_items),
            "max_items": max_items
        }
    except Exception as e:
        logger.error(f"Due reviews error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/optimize-session")
async def optimize_study_session(request: OptimizeSessionRequest):
    """
    Optimize review session for available time
    """
    try:
        items_dict = [item.dict() for item in request.review_items]
        optimized = adaptive_sr.optimize_study_session(
            request.available_minutes,
            items_dict
        )

        return {
            "optimized_items": optimized,
            "total_items": len(optimized),
            "estimated_duration": len(optimized) * 5  # 5 min per item
        }
    except Exception as e:
        logger.error(f"Optimize session error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/user-profile/{user_id}")
async def get_user_learning_profile(user_id: str):
    """
    Get user's personalized learning profile
    """
    try:
        profile = adaptive_sr.get_user_profile(user_id)

        return {
            "user_id": user_id,
            "profile": profile
        }
    except Exception as e:
        logger.error(f"User profile error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

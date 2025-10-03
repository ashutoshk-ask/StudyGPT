"""
API Router for Multi-modal Learning Features
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any, Optional
import logging
from pydantic import BaseModel

from models.multimodal_learning import (
    multimodal_engine,
    LearningModalityType,
    ContentType
)

logger = logging.getLogger(__name__)
router = APIRouter()

# Pydantic models for request/response
class InteractionData(BaseModel):
    content_type: str
    engagement_score: float
    accuracy: float
    time_spent: int  # in seconds
    repeat_count: Optional[int] = 0

class ModalityDetectionRequest(BaseModel):
    user_id: str
    interaction_data: List[InteractionData]

class ContentRecommendationRequest(BaseModel):
    user_id: str
    topic: str
    difficulty: str = "intermediate"

class StudyPlanRequest(BaseModel):
    user_id: str
    topics: List[str]
    study_duration_minutes: int = 60

class ModalityTrackingRequest(BaseModel):
    user_id: str
    content_type: str
    modality: str
    performance_metrics: Dict[str, float]

@router.post("/detect-modality")
async def detect_learning_modality(request: ModalityDetectionRequest):
    """Detect user's preferred learning modality from interaction patterns"""
    
    try:
        # Convert Pydantic models to dict for processing
        interaction_data = []
        for interaction in request.interaction_data:
            interaction_data.append({
                'content_type': interaction.content_type,
                'engagement_score': interaction.engagement_score,
                'accuracy': interaction.accuracy,
                'time_spent': interaction.time_spent,
                'repeat_count': interaction.repeat_count
            })
        
        modality_profile = multimodal_engine.detect_learning_modality(
            user_id=request.user_id,
            interaction_data=interaction_data
        )
        
        if not modality_profile:
            raise HTTPException(status_code=500, detail="Failed to detect learning modality")
        
        return {
            'user_id': request.user_id,
            'modality_profile': modality_profile,
            'recommendations': {
                'primary_focus': f"Focus on {modality_profile['primary_modality']} learning materials",
                'secondary_support': f"Supplement with {modality_profile.get('secondary_modality', 'mixed')} content",
                'confidence_level': modality_profile.get('confidence', 0)
            }
        }
        
    except Exception as e:
        logger.error(f"Error detecting learning modality: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/content-recommendations")
async def get_adaptive_content_recommendations(request: ContentRecommendationRequest):
    """Get content recommendations adapted to user's learning modality"""
    
    try:
        recommendations = multimodal_engine.get_adaptive_content_recommendations(
            user_id=request.user_id,
            topic=request.topic,
            difficulty=request.difficulty
        )
        
        return {
            'user_id': request.user_id,
            'topic': request.topic,
            'difficulty': request.difficulty,
            'total_recommendations': len(recommendations),
            'recommendations': recommendations,
            'usage_instructions': {
                'primary_recommendations': 'Start with high modality_match content',
                'study_sequence': 'Follow recommendations in order for optimal learning',
                'time_management': 'Use estimated_time for planning study sessions'
            }
        }
        
    except Exception as e:
        logger.error(f"Error getting content recommendations: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/create-study-plan")
async def create_multimodal_study_plan(request: StudyPlanRequest):
    """Create a study plan that incorporates multiple learning modalities"""
    
    try:
        study_plan = multimodal_engine.create_multimodal_study_plan(
            user_id=request.user_id,
            topics=request.topics,
            study_duration_minutes=request.study_duration_minutes
        )
        
        if 'error' in study_plan:
            raise HTTPException(status_code=404, detail=study_plan['error'])
        
        return {
            'study_plan': study_plan,
            'optimization_tips': {
                'modality_balance': 'Plan balances primary and secondary learning modalities',
                'time_distribution': 'Each topic gets proportional time based on your preferences',
                'activity_sequence': 'Activities are ordered for maximum retention'
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating multimodal study plan: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/track-effectiveness")
async def track_modality_effectiveness(request: ModalityTrackingRequest):
    """Track how effective different modalities are for the user"""
    
    try:
        multimodal_engine.track_modality_effectiveness(
            user_id=request.user_id,
            content_type=request.content_type,
            modality=request.modality,
            performance_metrics=request.performance_metrics
        )
        
        return {
            'status': 'success',
            'message': 'Modality effectiveness tracked successfully',
            'user_id': request.user_id,
            'tracked_data': {
                'content_type': request.content_type,
                'modality': request.modality,
                'metrics': request.performance_metrics
            }
        }
        
    except Exception as e:
        logger.error(f"Error tracking modality effectiveness: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/user/{user_id}/modality-analytics")
async def get_modality_analytics(user_id: str):
    """Get analytics on user's modality effectiveness"""
    
    try:
        analytics = multimodal_engine.get_modality_analytics(user_id)
        
        if 'message' in analytics:
            raise HTTPException(status_code=404, detail=analytics['message'])
        
        return {
            'user_id': user_id,
            'modality_analytics': analytics,
            'insights': _generate_modality_insights(analytics)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting modality analytics: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/user/{user_id}/profile")
async def get_user_modality_profile(user_id: str):
    """Get user's current modality profile"""
    
    try:
        if user_id not in multimodal_engine.user_modality_profiles:
            raise HTTPException(status_code=404, detail="User modality profile not found")
        
        profile = multimodal_engine.user_modality_profiles[user_id]
        
        return {
            'user_id': user_id,
            'profile': profile,
            'recommendations': _generate_profile_recommendations(profile)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting user modality profile: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/modality-types")
async def get_available_modality_types():
    """Get available learning modality types and content types"""
    
    return {
        'learning_modalities': [modality.value for modality in LearningModalityType],
        'content_types': [content.value for content in ContentType],
        'descriptions': {
            'learning_modalities': {
                'visual': 'Learn best through seeing - images, diagrams, charts',
                'auditory': 'Learn best through hearing - audio explanations, lectures',
                'kinesthetic': 'Learn best through doing - interactive exercises, hands-on practice',
                'reading_writing': 'Learn best through reading and writing - text, notes, written exercises'
            },
            'content_types': {
                'text': 'Written content, notes, explanations',
                'image': 'Static images, photographs, illustrations',
                'diagram': 'Interactive diagrams, flowcharts, mind maps',
                'video': 'Video lessons, animations, demonstrations',
                'audio': 'Audio explanations, lectures, discussions',
                'interactive': 'Interactive exercises, simulations, games',
                'animation': 'Animated explanations and demonstrations'
            }
        }
    }

@router.get("/content-library/{topic}")
async def get_topic_content_library(topic: str, modality: Optional[str] = None):
    """Get available content for a specific topic, optionally filtered by modality"""
    
    try:
        # This would typically query a content database
        # For now, return mock content structure
        
        all_content = {
            'visual': [
                {
                    'id': f'{topic}_visual_1',
                    'title': f'{topic} - Concept Diagram',
                    'content_type': 'diagram',
                    'difficulty': 'intermediate',
                    'estimated_time': 5,
                    'description': f'Interactive diagram explaining {topic} concepts'
                },
                {
                    'id': f'{topic}_visual_2',
                    'title': f'{topic} - Visual Examples',
                    'content_type': 'image',
                    'difficulty': 'beginner',
                    'estimated_time': 3,
                    'description': f'Visual examples and illustrations for {topic}'
                }
            ],
            'auditory': [
                {
                    'id': f'{topic}_audio_1',
                    'title': f'{topic} - Audio Lesson',
                    'content_type': 'audio',
                    'difficulty': 'intermediate',
                    'estimated_time': 10,
                    'description': f'Detailed audio explanation of {topic}'
                }
            ],
            'kinesthetic': [
                {
                    'id': f'{topic}_interactive_1',
                    'title': f'{topic} - Interactive Practice',
                    'content_type': 'interactive',
                    'difficulty': 'intermediate',
                    'estimated_time': 8,
                    'description': f'Hands-on exercises for {topic}'
                }
            ],
            'reading_writing': [
                {
                    'id': f'{topic}_text_1',
                    'title': f'{topic} - Comprehensive Notes',
                    'content_type': 'text',
                    'difficulty': 'intermediate',
                    'estimated_time': 12,
                    'description': f'Detailed written material on {topic}'
                }
            ]
        }
        
        if modality and modality in all_content:
            filtered_content = all_content[modality]
        else:
            filtered_content = []
            for mod_content in all_content.values():
                filtered_content.extend(mod_content)
        
        return {
            'topic': topic,
            'modality_filter': modality,
            'total_content_items': len(filtered_content),
            'content_library': filtered_content,
            'available_modalities': list(all_content.keys())
        }
        
    except Exception as e:
        logger.error(f"Error getting content library: {e}")
        raise HTTPException(status_code=500, detail=str(e))

def _generate_modality_insights(analytics: Dict[str, Any]) -> Dict[str, Any]:
    """Generate insights from modality analytics"""
    
    insights = {
        'strengths': [],
        'recommendations': [],
        'optimization_tips': []
    }
    
    if '_summary' in analytics:
        summary = analytics['_summary']
        
        if summary.get('most_effective_modality'):
            insights['strengths'].append(
                f"Most effective learning modality: {summary['most_effective_modality']}"
            )
            insights['recommendations'].append(
                f"Focus 70% of study time on {summary['most_effective_modality']} content"
            )
        
        if summary.get('least_effective_modality'):
            insights['optimization_tips'].append(
                f"Consider reducing {summary['least_effective_modality']} content or trying different approaches"
            )
    
    # Analyze individual modality performance
    for modality, data in analytics.items():
        if modality != '_summary' and isinstance(data, dict):
            effectiveness = data.get('effectiveness_score', 0)
            
            if effectiveness > 0.8:
                insights['strengths'].append(f"Excellent performance with {modality} content")
            elif effectiveness < 0.5:
                insights['optimization_tips'].append(f"Improve {modality} learning strategies")
    
    return insights

def _generate_profile_recommendations(profile: Dict[str, Any]) -> Dict[str, Any]:
    """Generate recommendations based on user's modality profile"""
    
    primary = profile.get('primary_modality')
    secondary = profile.get('secondary_modality')
    confidence = profile.get('confidence', 0)
    
    recommendations = {
        'study_strategy': [],
        'content_selection': [],
        'time_allocation': {}
    }
    
    if primary:
        recommendations['study_strategy'].append(
            f"Prioritize {primary} learning materials for new concepts"
        )
        recommendations['content_selection'].append(
            f"Look for {primary} content types when available"
        )
        recommendations['time_allocation']['primary_modality'] = 70
    
    if secondary:
        recommendations['study_strategy'].append(
            f"Use {secondary} content to reinforce learning"
        )
        recommendations['time_allocation']['secondary_modality'] = 30
    
    if confidence < 0.6:
        recommendations['study_strategy'].append(
            "Try mixed-modality approaches to find your optimal learning style"
        )
    
    return recommendations
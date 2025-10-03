"""
API Router for Collaborative Learning Features
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any, Optional
import logging
from pydantic import BaseModel

from models.collaborative_learning import (
    collaborative_engine,
    LeaderboardType,
    ComparisonMetric
)

logger = logging.getLogger(__name__)
router = APIRouter()

# Pydantic models for request/response
class UserSessionData(BaseModel):
    user_id: str
    username: str
    answers: List[Dict[str, Any]]
    session_metadata: Optional[Dict[str, Any]] = {}

class LeaderboardRequest(BaseModel):
    leaderboard_type: str = "weekly"  # daily, weekly, monthly, all_time, subject_wise
    metric: str = "accuracy"  # accuracy, speed, consistency, improvement, streak
    limit: int = 50

class PeerComparisonRequest(BaseModel):
    user_id: str
    comparison_group: str = "similar_level"  # similar_level, same_activity, all_active

class StudyGroupCreate(BaseModel):
    group_name: str
    admin_id: str
    description: str
    target_exam_date: Optional[str] = None

class StudyGroupJoin(BaseModel):
    group_id: str
    user_id: str

@router.post("/update-performance")
async def update_user_performance(session_data: UserSessionData):
    """Update user performance metrics from a study session"""
    
    try:
        performance = collaborative_engine.update_user_performance(
            user_id=session_data.user_id,
            username=session_data.username,
            session_data={
                'answers': session_data.answers,
                'metadata': session_data.session_metadata
            }
        )
        
        if performance:
            return {
                'status': 'success',
                'user_id': performance.user_id,
                'updated_metrics': {
                    'accuracy': round(performance.accuracy * 100, 2),
                    'questions_attempted': performance.questions_attempted,
                    'study_streak': performance.study_streak,
                    'avg_response_time': round(performance.avg_response_time, 1)
                }
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to update performance")
            
    except Exception as e:
        logger.error(f"Error updating user performance: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/leaderboard")
async def get_leaderboard(request: LeaderboardRequest):
    """Generate leaderboard based on specified criteria"""
    
    try:
        # Validate enum values
        try:
            leaderboard_type = LeaderboardType(request.leaderboard_type)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid leaderboard type")
        
        try:
            metric = ComparisonMetric(request.metric)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid metric")
        
        leaderboard = collaborative_engine.generate_leaderboard(
            leaderboard_type=leaderboard_type,
            metric=metric,
            limit=request.limit
        )
        
        return {
            'leaderboard_type': request.leaderboard_type,
            'metric': request.metric,
            'total_entries': len(leaderboard),
            'leaderboard': leaderboard,
            'generated_at': collaborative_engine._get_current_timestamp()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating leaderboard: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/peer-comparison")
async def compare_with_peers(request: PeerComparisonRequest):
    """Compare user performance with peers"""
    
    try:
        comparison = collaborative_engine.compare_with_peers(
            user_id=request.user_id,
            comparison_group=request.comparison_group
        )
        
        if 'error' in comparison:
            raise HTTPException(status_code=404, detail=comparison['error'])
        
        return comparison
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error comparing with peers: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/study-groups/create")
async def create_study_group(group_data: StudyGroupCreate):
    """Create a new study group"""
    
    try:
        result = collaborative_engine.create_study_group(
            group_name=group_data.group_name,
            admin_id=group_data.admin_id,
            description=group_data.description,
            target_exam_date=group_data.target_exam_date
        )
        
        if 'error' in result:
            raise HTTPException(status_code=400, detail=result['error'])
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating study group: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/study-groups/join")
async def join_study_group(join_data: StudyGroupJoin):
    """Join an existing study group"""
    
    try:
        result = collaborative_engine.join_study_group(
            group_id=join_data.group_id,
            user_id=join_data.user_id
        )
        
        if 'error' in result:
            raise HTTPException(status_code=400, detail=result['error'])
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error joining study group: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/study-groups/{group_id}/leaderboard")
async def get_group_leaderboard(group_id: str):
    """Get leaderboard for specific study group"""
    
    try:
        leaderboard = collaborative_engine.get_group_leaderboard(group_id)
        
        return {
            'group_id': group_id,
            'leaderboard': leaderboard,
            'member_count': len(leaderboard)
        }
        
    except Exception as e:
        logger.error(f"Error getting group leaderboard: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/user/{user_id}/performance")
async def get_user_performance(user_id: str):
    """Get detailed performance metrics for a user"""
    
    try:
        if user_id not in collaborative_engine.user_performances:
            raise HTTPException(status_code=404, detail="User performance not found")
        
        performance = collaborative_engine.user_performances[user_id]
        
        return {
            'user_id': performance.user_id,
            'username': performance.username,
            'overall_metrics': {
                'accuracy': round(performance.accuracy * 100, 2),
                'avg_response_time': round(performance.avg_response_time, 1),
                'questions_attempted': performance.questions_attempted,
                'correct_answers': performance.correct_answers,
                'study_streak': performance.study_streak,
                'last_active': performance.last_active.isoformat()
            },
            'subject_scores': {
                subject: round(score * 100, 2) 
                for subject, score in performance.subject_scores.items()
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting user performance: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/leaderboard-types")
async def get_leaderboard_types():
    """Get available leaderboard types and metrics"""
    
    return {
        'leaderboard_types': [lb_type.value for lb_type in LeaderboardType],
        'comparison_metrics': [metric.value for metric in ComparisonMetric],
        'descriptions': {
            'leaderboard_types': {
                'daily': 'Rankings based on last 24 hours activity',
                'weekly': 'Rankings based on last 7 days activity',
                'monthly': 'Rankings based on last 30 days activity',
                'all_time': 'All-time rankings since registration',
                'subject_wise': 'Rankings by individual subjects'
            },
            'metrics': {
                'accuracy': 'Percentage of correct answers',
                'speed': 'Average time per question (lower is better)',
                'consistency': 'Accuracy weighted by activity level',
                'improvement': 'Rate of improvement over time',
                'streak': 'Consecutive days of study activity'
            }
        }
    }

@router.get("/stats/overview")
async def get_collaborative_stats():
    """Get overview statistics for collaborative features"""
    
    try:
        total_users = len(collaborative_engine.user_performances)
        total_groups = len(collaborative_engine.study_groups)
        
        # Active users (last 7 days)
        from datetime import datetime, timedelta
        cutoff = datetime.now() - timedelta(days=7)
        active_users = sum(
            1 for perf in collaborative_engine.user_performances.values()
            if perf.last_active >= cutoff
        )
        
        # Average metrics
        if total_users > 0:
            avg_accuracy = np.mean([
                perf.accuracy for perf in collaborative_engine.user_performances.values()
            ])
            avg_questions = np.mean([
                perf.questions_attempted for perf in collaborative_engine.user_performances.values()
            ])
        else:
            avg_accuracy = 0
            avg_questions = 0
        
        return {
            'total_users': total_users,
            'active_users_7d': active_users,
            'total_study_groups': total_groups,
            'average_accuracy': round(avg_accuracy * 100, 1),
            'average_questions_attempted': int(avg_questions),
            'engagement_rate': round((active_users / total_users) * 100, 1) if total_users > 0 else 0
        }
        
    except Exception as e:
        logger.error(f"Error getting collaborative stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))
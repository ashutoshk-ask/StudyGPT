"""
Collaborative Learning and Social Features
Implements peer comparison, leaderboards, and group study functionality
"""

from typing import Dict, List, Any, Optional, Tuple
import numpy as np
from datetime import datetime, timedelta
import logging
from dataclasses import dataclass
from enum import Enum

logger = logging.getLogger(__name__)

class LeaderboardType(Enum):
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    ALL_TIME = "all_time"
    SUBJECT_WISE = "subject_wise"

class ComparisonMetric(Enum):
    ACCURACY = "accuracy"
    SPEED = "speed"
    CONSISTENCY = "consistency"
    IMPROVEMENT = "improvement"
    STREAK = "streak"

@dataclass
class UserPerformance:
    user_id: str
    username: str
    accuracy: float
    avg_response_time: float
    questions_attempted: int
    correct_answers: int
    study_streak: int
    last_active: datetime
    subject_scores: Dict[str, float]
    rank_change: int = 0

@dataclass
class StudyGroup:
    group_id: str
    group_name: str
    members: List[str]
    admin_id: str
    created_at: datetime
    description: str
    target_exam_date: Optional[datetime]
    study_plan_id: Optional[str]

class CollaborativeLearningEngine:
    """Manages collaborative learning features and social interactions"""
    
    def __init__(self):
        self.user_performances = {}
        self.study_groups = {}
        self.leaderboards = {}
        self.peer_comparisons = {}
        
    def update_user_performance(
        self,
        user_id: str,
        username: str,
        session_data: Dict[str, Any]
    ) -> UserPerformance:
        """Update user performance metrics from a study session"""
        
        try:
            # Calculate session metrics
            correct_answers = sum(1 for answer in session_data.get('answers', []) if answer.get('is_correct'))
            total_questions = len(session_data.get('answers', []))
            session_accuracy = correct_answers / total_questions if total_questions > 0 else 0
            
            avg_time = np.mean([ans.get('time_taken', 60) for ans in session_data.get('answers', [])])
            
            # Get or create user performance
            if user_id not in self.user_performances:
                self.user_performances[user_id] = UserPerformance(
                    user_id=user_id,
                    username=username,
                    accuracy=session_accuracy,
                    avg_response_time=avg_time,
                    questions_attempted=total_questions,
                    correct_answers=correct_answers,
                    study_streak=1,
                    last_active=datetime.now(),
                    subject_scores={}
                )
            else:
                # Update existing performance
                perf = self.user_performances[user_id]
                
                # Exponential moving average for accuracy
                alpha = 0.7  # Weight for new data
                perf.accuracy = alpha * session_accuracy + (1 - alpha) * perf.accuracy
                
                # Update response time (exponential moving average)
                perf.avg_response_time = alpha * avg_time + (1 - alpha) * perf.avg_response_time
                
                # Update totals
                perf.questions_attempted += total_questions
                perf.correct_answers += correct_answers
                
                # Update study streak
                time_since_last = datetime.now() - perf.last_active
                if time_since_last <= timedelta(days=2):  # Within 2 days = streak continues
                    perf.study_streak += 1
                else:
                    perf.study_streak = 1  # Reset streak
                
                perf.last_active = datetime.now()
            
            # Update subject-wise scores
            self._update_subject_scores(user_id, session_data)
            
            return self.user_performances[user_id]
            
        except Exception as e:
            logger.error(f"Error updating user performance: {e}")
            return None
    
    def _update_subject_scores(self, user_id: str, session_data: Dict[str, Any]):
        """Update subject-wise performance scores"""
        
        subject_stats = {}
        
        for answer in session_data.get('answers', []):
            subject = answer.get('subject', 'unknown')
            if subject not in subject_stats:
                subject_stats[subject] = {'correct': 0, 'total': 0}
            
            subject_stats[subject]['total'] += 1
            if answer.get('is_correct'):
                subject_stats[subject]['correct'] += 1
        
        # Update user's subject scores
        perf = self.user_performances[user_id]
        for subject, stats in subject_stats.items():
            session_accuracy = stats['correct'] / stats['total']
            
            if subject not in perf.subject_scores:
                perf.subject_scores[subject] = session_accuracy
            else:
                # Exponential moving average
                alpha = 0.7
                perf.subject_scores[subject] = (
                    alpha * session_accuracy + (1 - alpha) * perf.subject_scores[subject]
                )
    
    def generate_leaderboard(
        self,
        leaderboard_type: LeaderboardType,
        metric: ComparisonMetric,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """Generate leaderboard based on specified criteria"""
        
        try:
            # Filter users based on time period
            eligible_users = self._filter_users_by_time_period(leaderboard_type)
            
            # Sort by specified metric
            sorted_users = self._sort_users_by_metric(eligible_users, metric)
            
            # Create leaderboard entries
            leaderboard = []
            for rank, user_perf in enumerate(sorted_users[:limit], 1):
                entry = {
                    'rank': rank,
                    'user_id': user_perf.user_id,
                    'username': user_perf.username,
                    'metric_value': self._get_metric_value(user_perf, metric),
                    'accuracy': round(user_perf.accuracy * 100, 1),
                    'questions_attempted': user_perf.questions_attempted,
                    'study_streak': user_perf.study_streak,
                    'rank_change': user_perf.rank_change,
                    'last_active': user_perf.last_active.isoformat()
                }
                
                if leaderboard_type == LeaderboardType.SUBJECT_WISE:
                    entry['subject_scores'] = user_perf.subject_scores
                
                leaderboard.append(entry)
            
            return leaderboard
            
        except Exception as e:
            logger.error(f"Error generating leaderboard: {e}")
            return []
    
    def _filter_users_by_time_period(self, leaderboard_type: LeaderboardType) -> List[UserPerformance]:
        """Filter users based on leaderboard time period"""
        
        now = datetime.now()
        cutoff_date = None
        
        if leaderboard_type == LeaderboardType.DAILY:
            cutoff_date = now - timedelta(days=1)
        elif leaderboard_type == LeaderboardType.WEEKLY:
            cutoff_date = now - timedelta(days=7)
        elif leaderboard_type == LeaderboardType.MONTHLY:
            cutoff_date = now - timedelta(days=30)
        # ALL_TIME and SUBJECT_WISE don't need filtering
        
        if cutoff_date:
            return [perf for perf in self.user_performances.values() 
                   if perf.last_active >= cutoff_date]
        else:
            return list(self.user_performances.values())
    
    def _sort_users_by_metric(self, users: List[UserPerformance], metric: ComparisonMetric) -> List[UserPerformance]:
        """Sort users by the specified metric"""
        
        if metric == ComparisonMetric.ACCURACY:
            return sorted(users, key=lambda u: u.accuracy, reverse=True)
        elif metric == ComparisonMetric.SPEED:
            return sorted(users, key=lambda u: u.avg_response_time)  # Lower is better
        elif metric == ComparisonMetric.CONSISTENCY:
            # Consistency = accuracy * (questions_attempted / max_attempts)
            max_attempts = max([u.questions_attempted for u in users]) if users else 1
            return sorted(users, key=lambda u: u.accuracy * (u.questions_attempted / max_attempts), reverse=True)
        elif metric == ComparisonMetric.IMPROVEMENT:
            # This would require historical data - simplified for now
            return sorted(users, key=lambda u: u.accuracy * u.questions_attempted, reverse=True)
        elif metric == ComparisonMetric.STREAK:
            return sorted(users, key=lambda u: u.study_streak, reverse=True)
        else:
            return users
    
    def _get_metric_value(self, user_perf: UserPerformance, metric: ComparisonMetric) -> float:
        """Get the metric value for display"""
        
        if metric == ComparisonMetric.ACCURACY:
            return round(user_perf.accuracy * 100, 1)
        elif metric == ComparisonMetric.SPEED:
            return round(user_perf.avg_response_time, 1)
        elif metric == ComparisonMetric.STREAK:
            return user_perf.study_streak
        elif metric == ComparisonMetric.CONSISTENCY:
            return round(user_perf.accuracy * 100, 1)  # Simplified
        elif metric == ComparisonMetric.IMPROVEMENT:
            return round(user_perf.accuracy * 100, 1)  # Simplified
        else:
            return 0.0
    
    def compare_with_peers(
        self,
        user_id: str,
        comparison_group: str = "similar_level"
    ) -> Dict[str, Any]:
        """Compare user performance with peers"""
        
        try:
            if user_id not in self.user_performances:
                return {'error': 'User not found'}
            
            user_perf = self.user_performances[user_id]
            
            # Find peer group
            peers = self._find_peer_group(user_perf, comparison_group)
            
            if not peers:
                return {'message': 'No peers found for comparison'}
            
            # Calculate percentiles
            peer_accuracies = [p.accuracy for p in peers]
            peer_speeds = [p.avg_response_time for p in peers]
            peer_streaks = [p.study_streak for p in peers]
            
            user_accuracy_percentile = self._calculate_percentile(user_perf.accuracy, peer_accuracies)
            user_speed_percentile = 100 - self._calculate_percentile(user_perf.avg_response_time, peer_speeds)  # Reverse for speed
            user_streak_percentile = self._calculate_percentile(user_perf.study_streak, peer_streaks)
            
            # Subject-wise comparison
            subject_comparisons = {}
            for subject, score in user_perf.subject_scores.items():
                peer_subject_scores = [p.subject_scores.get(subject, 0) for p in peers if subject in p.subject_scores]
                if peer_subject_scores:
                    percentile = self._calculate_percentile(score, peer_subject_scores)
                    subject_comparisons[subject] = {
                        'user_score': round(score * 100, 1),
                        'peer_average': round(np.mean(peer_subject_scores) * 100, 1),
                        'percentile': percentile
                    }
            
            return {
                'user_id': user_id,
                'comparison_group': comparison_group,
                'peer_count': len(peers),
                'overall_comparison': {
                    'accuracy_percentile': user_accuracy_percentile,
                    'speed_percentile': user_speed_percentile,
                    'streak_percentile': user_streak_percentile,
                    'user_accuracy': round(user_perf.accuracy * 100, 1),
                    'peer_avg_accuracy': round(np.mean(peer_accuracies) * 100, 1),
                    'user_avg_speed': round(user_perf.avg_response_time, 1),
                    'peer_avg_speed': round(np.mean(peer_speeds), 1)
                },
                'subject_wise_comparison': subject_comparisons,
                'strengths': self._identify_strengths(subject_comparisons),
                'improvement_areas': self._identify_improvement_areas(subject_comparisons)
            }
            
        except Exception as e:
            logger.error(f"Error comparing with peers: {e}")
            return {'error': 'Comparison failed'}
    
    def _find_peer_group(self, user_perf: UserPerformance, group_type: str) -> List[UserPerformance]:
        """Find appropriate peer group for comparison"""
        
        all_users = list(self.user_performances.values())
        
        if group_type == "similar_level":
            # Users with similar accuracy (±10%)
            accuracy_range = 0.1
            return [
                u for u in all_users 
                if (abs(u.accuracy - user_perf.accuracy) <= accuracy_range and 
                    u.user_id != user_perf.user_id)
            ]
        
        elif group_type == "same_activity":
            # Users with similar activity level (questions attempted ±20%)
            activity_range = 0.2
            return [
                u for u in all_users
                if (abs(u.questions_attempted - user_perf.questions_attempted) <= 
                    user_perf.questions_attempted * activity_range and
                    u.user_id != user_perf.user_id)
            ]
        
        elif group_type == "all_active":
            # All users active in last 7 days
            cutoff = datetime.now() - timedelta(days=7)
            return [
                u for u in all_users 
                if (u.last_active >= cutoff and u.user_id != user_perf.user_id)
            ]
        
        else:
            return all_users[:50]  # Default to top 50 users
    
    def _calculate_percentile(self, value: float, peer_values: List[float]) -> int:
        """Calculate percentile rank of value among peers"""
        
        if not peer_values:
            return 50  # Default to 50th percentile if no peers
        
        peer_values_sorted = sorted(peer_values)
        
        # Count how many peers have lower values
        count_lower = sum(1 for v in peer_values_sorted if v < value)
        
        percentile = (count_lower / len(peer_values_sorted)) * 100
        return int(percentile)
    
    def _identify_strengths(self, subject_comparisons: Dict[str, Any]) -> List[str]:
        """Identify user's strongest subjects"""
        
        strengths = []
        for subject, comparison in subject_comparisons.items():
            if comparison['percentile'] >= 75:  # Top 25%
                strengths.append(subject)
        
        return strengths
    
    def _identify_improvement_areas(self, subject_comparisons: Dict[str, Any]) -> List[str]:
        """Identify areas needing improvement"""
        
        improvement_areas = []
        for subject, comparison in subject_comparisons.items():
            if comparison['percentile'] <= 25:  # Bottom 25%
                improvement_areas.append(subject)
        
        return improvement_areas
    
    def create_study_group(
        self,
        group_name: str,
        admin_id: str,
        description: str,
        target_exam_date: Optional[str] = None
    ) -> Dict[str, Any]:
        """Create a new study group"""
        
        try:
            group_id = f"sg_{len(self.study_groups) + 1}_{int(datetime.now().timestamp())}"
            
            exam_date = None
            if target_exam_date:
                exam_date = datetime.fromisoformat(target_exam_date)
            
            study_group = StudyGroup(
                group_id=group_id,
                group_name=group_name,
                members=[admin_id],
                admin_id=admin_id,
                created_at=datetime.now(),
                description=description,
                target_exam_date=exam_date,
                study_plan_id=None
            )
            
            self.study_groups[group_id] = study_group
            
            return {
                'group_id': group_id,
                'group_name': group_name,
                'admin_id': admin_id,
                'member_count': 1,
                'created_at': study_group.created_at.isoformat(),
                'status': 'created'
            }
            
        except Exception as e:
            logger.error(f"Error creating study group: {e}")
            return {'error': 'Failed to create study group'}
    
    def join_study_group(self, group_id: str, user_id: str) -> Dict[str, Any]:
        """Add user to study group"""
        
        try:
            if group_id not in self.study_groups:
                return {'error': 'Study group not found'}
            
            group = self.study_groups[group_id]
            
            if user_id in group.members:
                return {'error': 'User already in group'}
            
            group.members.append(user_id)
            
            return {
                'group_id': group_id,
                'group_name': group.group_name,
                'member_count': len(group.members),
                'status': 'joined'
            }
            
        except Exception as e:
            logger.error(f"Error joining study group: {e}")
            return {'error': 'Failed to join study group'}
    
    def get_group_leaderboard(self, group_id: str) -> List[Dict[str, Any]]:
        """Get leaderboard for specific study group"""
        
        try:
            if group_id not in self.study_groups:
                return []
            
            group = self.study_groups[group_id]
            group_members = [
                self.user_performances[member_id] 
                for member_id in group.members 
                if member_id in self.user_performances
            ]
            
            # Sort by accuracy
            group_members.sort(key=lambda u: u.accuracy, reverse=True)
            
            leaderboard = []
            for rank, member in enumerate(group_members, 1):
                leaderboard.append({
                    'rank': rank,
                    'user_id': member.user_id,
                    'username': member.username,
                    'accuracy': round(member.accuracy * 100, 1),
                    'questions_attempted': member.questions_attempted,
                    'study_streak': member.study_streak,
                    'last_active': member.last_active.isoformat()
                })
            
            return leaderboard
            
        except Exception as e:
            logger.error(f"Error getting group leaderboard: {e}")
            return []

# Global collaborative learning engine
collaborative_engine = CollaborativeLearningEngine()
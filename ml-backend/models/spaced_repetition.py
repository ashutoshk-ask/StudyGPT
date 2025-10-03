from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from enum import Enum
import math
from dataclasses import dataclass

@dataclass
class ReviewSchedule:
    next_review: datetime
    ease_factor: float
    interval_days: float
    review_count: int
    mastery_threshold: float
    priority_score: float

class ResponseQuality(Enum):
    """Quality of student response"""
    BLACKOUT = 0      # Complete blackout
    INCORRECT = 1     # Incorrect response with correct answer seeming familiar
    INCORRECT_EASY = 2  # Incorrect but correct answer remembered
    CORRECT_HARD = 3  # Correct after hesitation
    CORRECT = 4       # Correct with some difficulty
    PERFECT = 5       # Perfect response

class AdvancedSpacedRepetition:
    """
    Advanced Spaced Repetition System
    Customized based on mastery level and performance
    """

    def __init__(self):
        self.user_schedules = {}
        
    def calculate_review_schedule(
        self, 
        user_id: str, 
        topic: str, 
        mastery_level: float,
        performance_data: Dict[str, Any]
    ) -> ReviewSchedule:
        """
        Advanced spaced repetition based on mastery level and performance
        """
        
        current_schedule = self.user_schedules.get(f"{user_id}_{topic}")
        
        # Performance metrics
        accuracy = performance_data.get('accuracy', 0.5)
        speed_score = performance_data.get('speed_score', 0.5)
        retention_rate = performance_data.get('retention_rate', 0.5)
        difficulty_handled = performance_data.get('max_difficulty', 0.3)
        
        # Calculate base interval based on mastery level
        base_interval = self._calculate_base_interval(mastery_level)
        
        # Adjust interval based on performance
        performance_multiplier = self._calculate_performance_multiplier(
            accuracy, speed_score, retention_rate, difficulty_handled
        )
        
        # Calculate ease factor
        ease_factor = self._calculate_ease_factor(mastery_level, accuracy, retention_rate)
        
        # Determine priority based on exam relevance and weakness
        priority_score = self._calculate_priority_score(
            mastery_level, performance_data.get('exam_weight', 1.0)
        )
        
        # Calculate final interval
        if current_schedule:
            # Existing topic - adjust based on performance
            if accuracy >= 0.8 and retention_rate >= 0.7:
                # Good performance - increase interval
                new_interval = current_schedule.interval_days * ease_factor * performance_multiplier
            else:
                # Poor performance - reduce interval
                new_interval = max(0.1, current_schedule.interval_days * 0.6 * performance_multiplier)
        else:
            # New topic - start with base interval
            new_interval = base_interval * performance_multiplier
        
        # Mastery-based adjustments
        if mastery_level < 2.0:
            # Low mastery - frequent reviews
            new_interval = min(new_interval, 0.5)  # Max 12 hours
        elif mastery_level < 5.0:
            # Moderate mastery - regular reviews
            new_interval = min(new_interval, 2.0)   # Max 2 days
        elif mastery_level < 7.0:
            # Good mastery - spaced reviews
            new_interval = min(new_interval, 7.0)   # Max 1 week
        else:
            # High mastery - long intervals
            new_interval = min(new_interval, 30.0)  # Max 1 month
        
        next_review = datetime.now() + timedelta(days=new_interval)
        review_count = (current_schedule.review_count + 1) if current_schedule else 1
        
        schedule = ReviewSchedule(
            next_review=next_review,
            ease_factor=ease_factor,
            interval_days=new_interval,
            review_count=review_count,
            mastery_threshold=self._get_mastery_threshold(mastery_level),
            priority_score=priority_score
        )
        
        self.user_schedules[f"{user_id}_{topic}"] = schedule
        return schedule

    def _calculate_base_interval(self, mastery_level: float) -> float:
        """Base interval in days based on mastery level"""
        if mastery_level < 1.0:
            return 0.25  # 6 hours
        elif mastery_level < 2.0:
            return 0.5   # 12 hours
        elif mastery_level < 3.0:
            return 1.0   # 1 day
        elif mastery_level < 5.0:
            return 2.0   # 2 days
        elif mastery_level < 7.0:
            return 4.0   # 4 days
        else:
            return 7.0   # 1 week
    
    def _calculate_performance_multiplier(self, accuracy: float, speed_score: float, 
                                        retention_rate: float, difficulty_handled: float) -> float:
        """Calculate performance multiplier for interval adjustment"""
        performance_score = (
            accuracy * 0.4 + 
            speed_score * 0.2 + 
            retention_rate * 0.3 + 
            difficulty_handled * 0.1
        )
        
        # Convert to multiplier (0.5 to 2.0)
        return 0.5 + performance_score * 1.5
    
    def _calculate_ease_factor(self, mastery_level: float, accuracy: float, retention_rate: float) -> float:
        """Calculate ease factor based on mastery and performance"""
        base_ease = 1.3 + (mastery_level / 10) * 1.7  # 1.3 to 3.0
        
        # Adjust based on performance
        if accuracy >= 0.9 and retention_rate >= 0.8:
            return min(3.0, base_ease * 1.2)
        elif accuracy <= 0.6 or retention_rate <= 0.5:
            return max(1.3, base_ease * 0.8)
        
        return base_ease
    
    def _calculate_priority_score(self, mastery_level: float, exam_weight: float) -> float:
        """Calculate priority score for review scheduling"""
        # Lower mastery = higher priority
        mastery_urgency = (10 - mastery_level) / 10
        
        # Higher exam weight = higher priority
        exam_importance = exam_weight
        
        # Combine factors
        priority = mastery_urgency * 0.7 + exam_importance * 0.3
        
        return priority * 100  # Scale to 0-100
    
    def _get_mastery_threshold(self, current_mastery: float) -> float:
        """Get mastery threshold for next review"""
        if current_mastery < 3.0:
            return current_mastery + 0.5
        elif current_mastery < 7.0:
            return current_mastery + 0.3
        else:
            return min(10.0, current_mastery + 0.1)

    def get_due_reviews(self, user_id: str) -> List[Dict[str, Any]]:
        """Get all topics due for review, sorted by priority"""
        due_reviews = []
        current_time = datetime.now()
        
        for key, schedule in self.user_schedules.items():
            if key.startswith(f"{user_id}_"):
                topic = key.split(f"{user_id}_")[1]
                
                if schedule.next_review <= current_time:
                    due_reviews.append({
                        'topic': topic,
                        'priority_score': schedule.priority_score,
                        'overdue_hours': (current_time - schedule.next_review).total_seconds() / 3600,
                        'mastery_threshold': schedule.mastery_threshold,
                        'review_count': schedule.review_count
                    })
        
        # Sort by priority score (higher = more urgent)
        due_reviews.sort(key=lambda x: x['priority_score'], reverse=True)
        return due_reviews

    def get_review_priority(
        self,
        last_review_date: datetime,
        next_review_date: datetime,
        ease_factor: float,
        importance: float = 1.0
    ) -> float:
        """
        Calculate review priority score (higher = more urgent)
        Args:
            last_review_date: When item was last reviewed
            next_review_date: When item should be reviewed
            ease_factor: Current ease factor
            importance: Topic importance multiplier (0-1)
        Returns:
            Priority score
        """
        now = datetime.now()

        # Days overdue (negative if not yet due)
        days_overdue = (now - next_review_date).days

        # Estimated retention
        days_since_review = (now - last_review_date).days
        retention = self.calculate_retention_probability(days_since_review, ease_factor)

        # Priority formula: combines urgency and retention
        urgency_score = max(0, days_overdue) * 2
        retention_score = (1 - retention) * 10
        importance_score = importance * 5

        priority = urgency_score + retention_score + importance_score

        return priority


class AdaptiveSM2Plus:
    """
    Adaptive SM-2+ with personalization and performance tracking
    """

    def __init__(self):
        self.sm2 = SM2SpacedRepetition()
        self.user_profiles: Dict[str, Dict] = {}

    def get_user_profile(self, user_id: str) -> Dict:
        """Get or create user learning profile"""
        if user_id not in self.user_profiles:
            self.user_profiles[user_id] = {
                "average_ease_factor": 2.5,
                "learning_rate": 1.0,
                "consistency_score": 1.0,
                "total_reviews": 0
            }
        return self.user_profiles[user_id]

    def update_user_profile(
        self,
        user_id: str,
        quality: int,
        was_on_time: bool
    ):
        """Update user learning profile based on performance"""
        profile = self.get_user_profile(user_id)

        profile["total_reviews"] += 1

        # Update consistency score
        if was_on_time:
            profile["consistency_score"] = min(1.5, profile["consistency_score"] + 0.01)
        else:
            profile["consistency_score"] = max(0.5, profile["consistency_score"] - 0.02)

        # Adjust learning rate based on performance
        if quality >= 4:
            profile["learning_rate"] = min(1.5, profile["learning_rate"] + 0.02)
        elif quality <= 2:
            profile["learning_rate"] = max(0.5, profile["learning_rate"] - 0.02)

    def calculate_personalized_interval(
        self,
        user_id: str,
        base_interval: int,
        ease_factor: float
    ) -> int:
        """
        Calculate interval adjusted for user's learning profile
        """
        profile = self.get_user_profile(user_id)

        # Adjust interval based on user's learning rate
        adjusted_interval = base_interval * profile["learning_rate"]

        # Adjust based on consistency
        adjusted_interval *= profile["consistency_score"]

        return max(1, math.ceil(adjusted_interval))

    def schedule_review(
        self,
        user_id: str,
        topic_id: str,
        current_state: Dict,
        quality: int
    ) -> Dict:
        """
        Schedule next review with personalization
        Args:
            user_id: User identifier
            topic_id: Topic identifier
            current_state: Current review state (repetition, interval, ease_factor)
            quality: Response quality (0-5)
        Returns:
            Updated state with next review details
        """
        # Calculate base schedule using SM-2
        next_state = self.sm2.calculate_next_review(
            repetition_count=current_state.get("repetition", 0),
            ease_factor=current_state.get("ease_factor", 2.5),
            interval=current_state.get("interval", 1),
            quality=quality
        )

        # Personalize interval
        personalized_interval = self.calculate_personalized_interval(
            user_id,
            next_state["next_interval"],
            next_state["next_ease_factor"]
        )

        next_state["next_interval"] = personalized_interval
        next_state["next_review_date"] = datetime.now() + timedelta(days=personalized_interval)

        # Update user profile
        was_on_time = current_state.get("was_on_time", True)
        self.update_user_profile(user_id, quality, was_on_time)

        return next_state

    def get_due_reviews(
        self,
        review_items: List[Dict],
        max_items: int = 50
    ) -> List[Dict]:
        """
        Get prioritized list of items due for review
        Args:
            review_items: List of items with review state
            max_items: Maximum number of items to return
        Returns:
            Sorted list of items by priority
        """
        now = datetime.now()

        # Calculate priority for each item
        prioritized = []
        for item in review_items:
            last_review = item.get("last_review_date", now)
            next_review = item.get("next_review_date", now)
            ease_factor = item.get("ease_factor", 2.5)
            importance = item.get("importance", 1.0)

            priority = self.sm2.get_review_priority(
                last_review,
                next_review,
                ease_factor,
                importance
            )

            prioritized.append({
                **item,
                "priority": priority
            })

        # Sort by priority (highest first)
        prioritized.sort(key=lambda x: x["priority"], reverse=True)

        return prioritized[:max_items]

    def optimize_study_session(
        self,
        available_minutes: int,
        review_items: List[Dict]
    ) -> List[Dict]:
        """
        Optimize review session to fit time constraint
        Returns best items to review in available time
        """
        avg_time_per_item = 5  # minutes

        max_items = available_minutes // avg_time_per_item

        due_items = self.get_due_reviews(review_items, max_items)

        return due_items

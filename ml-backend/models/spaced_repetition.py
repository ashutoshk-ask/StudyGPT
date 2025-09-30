from datetime import datetime, timedelta
from typing import Dict, List, Optional
from enum import Enum
import math

class ResponseQuality(Enum):
    """Quality of student response"""
    BLACKOUT = 0      # Complete blackout
    INCORRECT = 1     # Incorrect response with correct answer seeming familiar
    INCORRECT_EASY = 2  # Incorrect but correct answer remembered
    CORRECT_HARD = 3  # Correct after hesitation
    CORRECT = 4       # Correct with some difficulty
    PERFECT = 5       # Perfect response

class SM2SpacedRepetition:
    """
    Enhanced SM-2 Spaced Repetition Algorithm
    Optimizes review scheduling based on memory retention
    """

    def __init__(
        self,
        initial_interval: int = 1,
        ease_factor: float = 2.5,
        min_ease_factor: float = 1.3,
        max_interval: int = 365
    ):
        self.initial_interval = initial_interval
        self.ease_factor = ease_factor
        self.min_ease_factor = min_ease_factor
        self.max_interval = max_interval

    def calculate_next_review(
        self,
        repetition_count: int,
        ease_factor: float,
        interval: int,
        quality: int
    ) -> Dict[str, any]:
        """
        Calculate next review date and updated parameters
        Args:
            repetition_count: Number of successful repetitions
            ease_factor: Current ease factor
            interval: Current interval in days
            quality: Response quality (0-5)
        Returns:
            Dictionary with next_interval, next_repetition, next_ease_factor
        """
        # Quality < 3 means review again
        if quality < 3:
            next_repetition = 0
            next_interval = 1
            next_ease_factor = ease_factor
        else:
            # Update ease factor
            next_ease_factor = ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
            next_ease_factor = max(next_ease_factor, self.min_ease_factor)

            # Calculate next interval
            if repetition_count == 0:
                next_interval = 1
            elif repetition_count == 1:
                next_interval = 6
            else:
                next_interval = math.ceil(interval * next_ease_factor)

            next_interval = min(next_interval, self.max_interval)
            next_repetition = repetition_count + 1

        return {
            "next_interval": next_interval,
            "next_repetition": next_repetition,
            "next_ease_factor": round(next_ease_factor, 2),
            "next_review_date": datetime.now() + timedelta(days=next_interval)
        }

    def calculate_retention_probability(
        self,
        days_since_review: int,
        ease_factor: float
    ) -> float:
        """
        Estimate probability of remembering based on forgetting curve
        Uses Ebbinghaus forgetting curve
        """
        # R = e^(-t/S) where S is strength related to ease factor
        strength = ease_factor * 10  # Scale ease factor to strength
        retention = math.exp(-days_since_review / strength)
        return retention

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

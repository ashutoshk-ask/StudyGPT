import numpy as np
from typing import Dict, List, Optional
from dataclasses import dataclass
from enum import Enum

class BanditAlgorithm(Enum):
    """Types of bandit algorithms"""
    EPSILON_GREEDY = "epsilon_greedy"
    UCB = "upper_confidence_bound"
    THOMPSON_SAMPLING = "thompson_sampling"

@dataclass
class Arm:
    """Represents a bandit arm (content option)"""
    id: str
    name: str
    total_pulls: int = 0
    total_reward: float = 0.0
    average_reward: float = 0.0

    # For Thompson Sampling (Beta distribution)
    successes: int = 0
    failures: int = 0

class MultiArmedBandit:
    """
    Multi-Armed Bandit for content recommendation
    Balances exploration and exploitation
    """

    def __init__(
        self,
        arms: List[str],
        algorithm: BanditAlgorithm = BanditAlgorithm.EPSILON_GREEDY,
        epsilon: float = 0.1,
        decay_rate: float = 0.995
    ):
        self.arms = {arm_id: Arm(id=arm_id, name=arm_id) for arm_id in arms}
        self.algorithm = algorithm
        self.epsilon = epsilon
        self.initial_epsilon = epsilon
        self.decay_rate = decay_rate
        self.total_rounds = 0

    def select_arm(self) -> str:
        """
        Select arm based on current algorithm
        Returns arm ID
        """
        if self.algorithm == BanditAlgorithm.EPSILON_GREEDY:
            return self._epsilon_greedy()
        elif self.algorithm == BanditAlgorithm.UCB:
            return self._ucb()
        elif self.algorithm == BanditAlgorithm.THOMPSON_SAMPLING:
            return self._thompson_sampling()
        else:
            return self._epsilon_greedy()

    def _epsilon_greedy(self) -> str:
        """Epsilon-greedy algorithm"""
        if np.random.random() < self.epsilon:
            # Explore: random selection
            return np.random.choice(list(self.arms.keys()))
        else:
            # Exploit: select best arm
            return self._get_best_arm()

    def _ucb(self) -> str:
        """Upper Confidence Bound algorithm"""
        if self.total_rounds == 0:
            return np.random.choice(list(self.arms.keys()))

        ucb_values = {}
        for arm_id, arm in self.arms.items():
            if arm.total_pulls == 0:
                ucb_values[arm_id] = float('inf')
            else:
                exploration_bonus = np.sqrt(2 * np.log(self.total_rounds) / arm.total_pulls)
                ucb_values[arm_id] = arm.average_reward + exploration_bonus

        return max(ucb_values, key=ucb_values.get)

    def _thompson_sampling(self) -> str:
        """Thompson Sampling using Beta distribution"""
        sampled_values = {}

        for arm_id, arm in self.arms.items():
            # Beta(successes + 1, failures + 1)
            alpha = arm.successes + 1
            beta = arm.failures + 1
            sampled_values[arm_id] = np.random.beta(alpha, beta)

        return max(sampled_values, key=sampled_values.get)

    def update_arm(self, arm_id: str, reward: float):
        """
        Update arm statistics after observing reward
        Args:
            arm_id: Selected arm ID
            reward: Observed reward (typically 0-1)
        """
        if arm_id not in self.arms:
            return

        arm = self.arms[arm_id]

        # Update statistics
        arm.total_pulls += 1
        arm.total_reward += reward
        arm.average_reward = arm.total_reward / arm.total_pulls

        # Update for Thompson Sampling
        if reward > 0.5:  # Consider success if reward > 0.5
            arm.successes += 1
        else:
            arm.failures += 1

        self.total_rounds += 1

        # Decay epsilon for epsilon-greedy
        if self.algorithm == BanditAlgorithm.EPSILON_GREEDY:
            self.epsilon = max(0.01, self.epsilon * self.decay_rate)

    def _get_best_arm(self) -> str:
        """Get arm with highest average reward"""
        best_arm = max(self.arms.values(), key=lambda x: x.average_reward)
        return best_arm.id

    def get_arm_statistics(self) -> Dict:
        """Get statistics for all arms"""
        return {
            arm_id: {
                "average_reward": arm.average_reward,
                "total_pulls": arm.total_pulls,
                "total_reward": arm.total_reward,
                "pull_rate": arm.total_pulls / self.total_rounds if self.total_rounds > 0 else 0
            }
            for arm_id, arm in self.arms.items()
        }

    def get_recommendations(self, n: int = 5) -> List[str]:
        """
        Get top N recommended arms
        """
        sorted_arms = sorted(
            self.arms.values(),
            key=lambda x: x.average_reward,
            reverse=True
        )
        return [arm.id for arm in sorted_arms[:n]]


class ContextualBandit:
    """
    Contextual Multi-Armed Bandit
    Considers user context for better recommendations
    """

    def __init__(self, arms: List[str]):
        self.arms = arms
        self.context_bandits: Dict[str, MultiArmedBandit] = {}

    def _get_context_key(self, context: Dict) -> str:
        """
        Generate context key from context features
        Args:
            context: Dict with features like difficulty_preference, subject, etc.
        """
        difficulty = context.get("difficulty_preference", "medium")
        subject = context.get("subject", "general")
        time_of_day = context.get("time_of_day", "any")

        return f"{difficulty}_{subject}_{time_of_day}"

    def select_arm(self, context: Dict) -> str:
        """
        Select arm based on context
        """
        context_key = self._get_context_key(context)

        # Get or create bandit for this context
        if context_key not in self.context_bandits:
            self.context_bandits[context_key] = MultiArmedBandit(
                arms=self.arms,
                algorithm=BanditAlgorithm.THOMPSON_SAMPLING
            )

        return self.context_bandits[context_key].select_arm()

    def update(self, context: Dict, arm_id: str, reward: float):
        """Update with observed reward"""
        context_key = self._get_context_key(context)

        if context_key in self.context_bandits:
            self.context_bandits[context_key].update_arm(arm_id, reward)

    def get_best_for_context(self, context: Dict) -> str:
        """Get best arm for given context"""
        context_key = self._get_context_key(context)

        if context_key in self.context_bandits:
            return self.context_bandits[context_key]._get_best_arm()

        # Default: return random arm
        return np.random.choice(self.arms)


class ContentRecommendationSystem:
    """
    Complete recommendation system using contextual bandits
    """

    def __init__(self, content_items: List[Dict]):
        """
        Args:
            content_items: List of content items with 'id', 'type', 'difficulty' etc.
        """
        self.content_items = {item['id']: item for item in content_items}
        self.arm_ids = [item['id'] for item in content_items]

        # Separate bandits for different recommendation types
        self.topic_bandit = ContextualBandit(self.arm_ids)
        self.difficulty_bandit = ContextualBandit(self.arm_ids)
        self.learning_style_bandit = ContextualBandit(self.arm_ids)

    def recommend_content(
        self,
        user_profile: Dict,
        recommendation_type: str = "topic",
        n: int = 5
    ) -> List[Dict]:
        """
        Recommend content based on user profile
        Args:
            user_profile: User's learning profile and preferences
            recommendation_type: Type of recommendation (topic, difficulty, learning_style)
            n: Number of recommendations
        Returns:
            List of recommended content items
        """
        context = self._build_context(user_profile, recommendation_type)

        # Select bandit based on type
        if recommendation_type == "difficulty":
            bandit = self.difficulty_bandit
        elif recommendation_type == "learning_style":
            bandit = self.learning_style_bandit
        else:
            bandit = self.topic_bandit

        # Get recommendations
        recommended_ids = []
        for _ in range(n):
            arm_id = bandit.select_arm(context)
            if arm_id not in recommended_ids:
                recommended_ids.append(arm_id)

        # Return content items
        return [self.content_items[item_id] for item_id in recommended_ids if item_id in self.content_items]

    def update_recommendation_feedback(
        self,
        user_profile: Dict,
        content_id: str,
        engagement_score: float,
        recommendation_type: str = "topic"
    ):
        """
        Update recommendation system with user feedback
        Args:
            user_profile: User profile
            content_id: Content that was recommended
            engagement_score: User engagement (0-1)
            recommendation_type: Type of recommendation
        """
        context = self._build_context(user_profile, recommendation_type)

        if recommendation_type == "difficulty":
            self.difficulty_bandit.update(context, content_id, engagement_score)
        elif recommendation_type == "learning_style":
            self.learning_style_bandit.update(context, content_id, engagement_score)
        else:
            self.topic_bandit.update(context, content_id, engagement_score)

    def _build_context(self, user_profile: Dict, rec_type: str) -> Dict:
        """Build context from user profile"""
        context = {
            "difficulty_preference": user_profile.get("current_level", "medium"),
            "subject": user_profile.get("focus_subject", "general"),
            "time_of_day": user_profile.get("time_of_day", "any"),
            "learning_style": user_profile.get("learning_style", "visual")
        }
        return context

    def get_performance_metrics(self) -> Dict:
        """Get performance metrics for all bandits"""
        return {
            "topic_bandit": self._get_bandit_metrics(self.topic_bandit),
            "difficulty_bandit": self._get_bandit_metrics(self.difficulty_bandit),
            "learning_style_bandit": self._get_bandit_metrics(self.learning_style_bandit)
        }

    def _get_bandit_metrics(self, bandit: ContextualBandit) -> Dict:
        """Get metrics for a contextual bandit"""
        total_contexts = len(bandit.context_bandits)
        total_pulls = sum(
            cb.total_rounds for cb in bandit.context_bandits.values()
        )

        return {
            "total_contexts": total_contexts,
            "total_pulls": total_pulls,
            "average_pulls_per_context": total_pulls / total_contexts if total_contexts > 0 else 0
        }

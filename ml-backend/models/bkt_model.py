import numpy as np
from typing import Dict, List, Optional, Tuple

class BayesianKnowledgeTracing:
    """
    Bayesian Knowledge Tracing Model
    Tracks student knowledge state probabilistically
    """

    def __init__(
        self,
        p_init: float = 0.5,    # Initial probability of knowing skill
        p_learn: float = 0.3,    # Probability of learning from practice
        p_slip: float = 0.1,     # Probability of slipping (know but answer incorrectly)
        p_guess: float = 0.2     # Probability of guessing correctly
    ):
        self.p_init = p_init
        self.p_learn = p_learn
        self.p_slip = p_slip
        self.p_guess = p_guess

    def update_knowledge(
        self,
        p_know_prev: float,
        is_correct: bool
    ) -> float:
        """
        Update knowledge probability after observing an answer
        Args:
            p_know_prev: Previous probability of knowing the skill
            is_correct: Whether the answer was correct
        Returns:
            Updated probability of knowing the skill
        """
        if is_correct:
            # P(correct | know) = 1 - p_slip
            # P(correct | not know) = p_guess
            p_correct_given_know = 1 - self.p_slip
            p_correct_given_not_know = self.p_guess
        else:
            # P(incorrect | know) = p_slip
            # P(incorrect | not know) = 1 - p_guess
            p_correct_given_know = self.p_slip
            p_correct_given_not_know = 1 - self.p_guess

        # Bayes' theorem
        numerator = p_correct_given_know * p_know_prev
        denominator = (
            p_correct_given_know * p_know_prev +
            p_correct_given_not_know * (1 - p_know_prev)
        )

        p_know_current = numerator / denominator if denominator > 0 else p_know_prev

        # Learning opportunity - update for next step
        p_know_next = p_know_current + (1 - p_know_current) * self.p_learn

        return p_know_next

    def predict_next(self, p_know: float) -> float:
        """
        Predict probability of correct answer on next question
        """
        return p_know * (1 - self.p_slip) + (1 - p_know) * self.p_guess

    def process_sequence(
        self,
        responses: List[bool],
        p_init: Optional[float] = None
    ) -> Tuple[List[float], float]:
        """
        Process a sequence of responses
        Args:
            responses: List of boolean responses
            p_init: Optional initial probability (uses model default if None)
        Returns:
            List of knowledge probabilities after each response
            Final knowledge probability
        """
        p_know = p_init if p_init is not None else self.p_init
        probabilities = []

        for response in responses:
            p_know = self.update_knowledge(p_know, response)
            probabilities.append(p_know)

        return probabilities, p_know

    def estimate_mastery(
        self,
        responses: List[bool],
        mastery_threshold: float = 0.95
    ) -> Dict[str, any]:
        """
        Estimate if student has achieved mastery
        """
        probabilities, final_p_know = self.process_sequence(responses)

        return {
            "final_knowledge_probability": final_p_know,
            "has_mastery": final_p_know >= mastery_threshold,
            "knowledge_trajectory": probabilities,
            "predicted_next_correct": self.predict_next(final_p_know)
        }


class MultiskillBKT:
    """
    Multi-skill BKT tracker for managing multiple skills
    """

    def __init__(self):
        self.skill_trackers: Dict[int, BayesianKnowledgeTracing] = {}
        self.skill_states: Dict[int, float] = {}

    def get_or_create_tracker(self, skill_id: int) -> BayesianKnowledgeTracing:
        """Get or create BKT tracker for a skill"""
        if skill_id not in self.skill_trackers:
            self.skill_trackers[skill_id] = BayesianKnowledgeTracing()
            self.skill_states[skill_id] = 0.5

        return self.skill_trackers[skill_id]

    def update_skill(
        self,
        skill_id: int,
        is_correct: bool
    ) -> float:
        """
        Update knowledge state for a skill
        Returns updated probability
        """
        tracker = self.get_or_create_tracker(skill_id)
        current_state = self.skill_states.get(skill_id, 0.5)

        updated_state = tracker.update_knowledge(current_state, is_correct)
        self.skill_states[skill_id] = updated_state

        return updated_state

    def get_skill_state(self, skill_id: int) -> float:
        """Get current knowledge state for a skill"""
        return self.skill_states.get(skill_id, 0.5)

    def predict_skill_performance(self, skill_id: int) -> float:
        """Predict probability of correct answer for skill"""
        tracker = self.get_or_create_tracker(skill_id)
        current_state = self.skill_states.get(skill_id, 0.5)
        return tracker.predict_next(current_state)

    def get_weak_skills(self, threshold: float = 0.6) -> List[int]:
        """Get list of skills below mastery threshold"""
        return [
            skill_id for skill_id, state in self.skill_states.items()
            if state < threshold
        ]

    def get_mastered_skills(self, threshold: float = 0.95) -> List[int]:
        """Get list of mastered skills"""
        return [
            skill_id for skill_id, state in self.skill_states.items()
            if state >= threshold
        ]

    def get_all_states(self) -> Dict[int, float]:
        """Get all skill states"""
        return dict(self.skill_states)

    def process_interaction_history(
        self,
        interactions: List[Dict]
    ) -> Dict[int, float]:
        """
        Process a history of interactions
        Args:
            interactions: List of dicts with 'skill_id' and 'correct' keys
        Returns:
            Dictionary of final skill states
        """
        for interaction in interactions:
            skill_id = interaction.get('skill_id')
            is_correct = interaction.get('correct', False)

            if skill_id is not None:
                self.update_skill(int(skill_id), bool(is_correct))

        return self.get_all_states()

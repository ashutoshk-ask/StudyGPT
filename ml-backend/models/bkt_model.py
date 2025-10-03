import numpy as np
import math
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass
from datetime import datetime, timedelta

@dataclass
class KnowledgeState:
    mastery_level: float  # 0.01 to 10.0
    confidence: float     # How sure we are about mastery
    understanding_depth: float  # Surface vs deep understanding
    application_skill: float    # Can apply in different contexts
    retention_strength: float   # How well knowledge is retained
    learning_velocity: float    # How fast student learns this topic
    cognitive_load: float       # Mental effort required
    last_updated: datetime

class AdvancedKnowledgeTracing:
    """
    Advanced Knowledge Tracing with 0.01-10.0 mastery scale
    Tracks complex multi-dimensional learning states
    """

    def __init__(self):
        self.knowledge_states = {}
        self.learning_factors = {
            'conceptual_understanding': 0.25,
            'procedural_fluency': 0.20,
            'application_ability': 0.20,
            'problem_solving': 0.15,
            'speed_accuracy': 0.10,
            'retention_decay': 0.10
        }

    def calculate_complex_mastery(
        self, 
        user_id: str, 
        skill: str, 
        interaction_data: Dict[str, Any]
    ) -> KnowledgeState:
        """
        Complex mastery calculation considering multiple dimensions
        
        Scale: 0.01 to 10.0
        0.01-1.0: Novice (needs basic concept building)
        1.0-3.0:  Developing (understands basics, needs practice)
        3.0-5.0:  Competent (can solve standard problems)
        5.0-7.0:  Proficient (handles complex variations)
        7.0-8.5:  Advanced (masters difficult problems)
        8.5-10.0: Expert (can teach others, creative solutions)
        """
        
        # Get current state or initialize
        current_state = self.knowledge_states.get(f"{user_id}_{skill}", 
            KnowledgeState(
                mastery_level=0.01,
                confidence=0.1,
                understanding_depth=0.01,
                application_skill=0.01,
                retention_strength=0.01,
                learning_velocity=1.0,
                cognitive_load=1.0,
                last_updated=datetime.now()
            )
        )
        
        # Extract interaction metrics
        is_correct = interaction_data.get('correct', False)
        time_taken = interaction_data.get('time_taken', 0)
        expected_time = interaction_data.get('expected_time', 60)
        difficulty = interaction_data.get('difficulty', 0.5)
        question_type = interaction_data.get('type', 'standard')
        hint_usage = interaction_data.get('hints_used', 0)
        attempts = interaction_data.get('attempts', 1)
        
        # Calculate component scores
        conceptual_score = self._calculate_conceptual_understanding(
            is_correct, difficulty, question_type, hint_usage
        )
        
        procedural_score = self._calculate_procedural_fluency(
            is_correct, time_taken, expected_time, attempts
        )
        
        application_score = self._calculate_application_ability(
            is_correct, difficulty, question_type, interaction_data.get('context_transfer', False)
        )
        
        problem_solving_score = self._calculate_problem_solving(
            is_correct, difficulty, interaction_data.get('steps_shown', [])
        )
        
        speed_accuracy_score = self._calculate_speed_accuracy(
            is_correct, time_taken, expected_time
        )
        
        # Time decay factor
        time_since_last = (datetime.now() - current_state.last_updated).total_seconds() / 3600  # hours
        retention_decay = self._calculate_retention_decay(time_since_last, current_state.retention_strength)
        
        # Weighted combination
        new_mastery = (
            conceptual_score * self.learning_factors['conceptual_understanding'] +
            procedural_score * self.learning_factors['procedural_fluency'] +
            application_score * self.learning_factors['application_ability'] +
            problem_solving_score * self.learning_factors['problem_solving'] +
            speed_accuracy_score * self.learning_factors['speed_accuracy']
        ) * (1 - retention_decay * self.learning_factors['retention_decay'])
        
        # Learning velocity adjustment
        learning_rate = self._calculate_learning_velocity(current_state.mastery_level, new_mastery)
        
        # Bayesian update with confidence
        confidence_factor = min(0.95, current_state.confidence + 0.05)
        updated_mastery = (
            current_state.mastery_level * current_state.confidence +
            new_mastery * (1 - current_state.confidence) * learning_rate
        )
        
        # Ensure bounds and smooth progression
        updated_mastery = max(0.01, min(10.0, updated_mastery))
        
        # Update state
        new_state = KnowledgeState(
            mastery_level=updated_mastery,
            confidence=confidence_factor,
            understanding_depth=self._calculate_understanding_depth(conceptual_score, application_score),
            application_skill=application_score,
            retention_strength=self._update_retention_strength(current_state.retention_strength, is_correct),
            learning_velocity=learning_rate,
            cognitive_load=self._calculate_cognitive_load(difficulty, time_taken, expected_time),
            last_updated=datetime.now()
        )
        
        self.knowledge_states[f"{user_id}_{skill}"] = new_state
        return new_state

    def _calculate_conceptual_understanding(self, is_correct: bool, difficulty: float, 
                                         question_type: str, hint_usage: int) -> float:
        base_score = 5.0 if is_correct else 1.0
        
        # Adjust for question type
        if question_type == 'conceptual':
            base_score *= 1.2
        elif question_type == 'application':
            base_score *= 1.1
        
        # Penalty for hint usage
        base_score *= (1 - hint_usage * 0.1)
        
        # Difficulty adjustment
        base_score *= (0.5 + difficulty * 0.5)
        
        return max(0.01, min(10.0, base_score))
    
    def _calculate_procedural_fluency(self, is_correct: bool, time_taken: float, 
                                    expected_time: float, attempts: int) -> float:
        if not is_correct:
            return max(0.01, 2.0 / attempts)
        
        time_efficiency = expected_time / max(time_taken, 1)
        attempt_penalty = 1.0 / attempts
        
        score = 5.0 * time_efficiency * attempt_penalty
        return max(0.01, min(10.0, score))
    
    def _calculate_application_ability(self, is_correct: bool, difficulty: float, 
                                     question_type: str, context_transfer: bool) -> float:
        base_score = 3.0 if is_correct else 0.5
        
        if question_type == 'application':
            base_score *= 1.5
        
        if context_transfer:
            base_score *= 1.3
        
        base_score *= (0.7 + difficulty * 0.6)
        
        return max(0.01, min(10.0, base_score))
    
    def _calculate_problem_solving(self, is_correct: bool, difficulty: float, steps_shown: List[str]) -> float:
        base_score = 4.0 if is_correct else 1.0
        
        # Bonus for showing steps
        if steps_shown:
            base_score *= (1 + len(steps_shown) * 0.1)
        
        base_score *= (0.6 + difficulty * 0.8)
        
        return max(0.01, min(10.0, base_score))
    
    def _calculate_speed_accuracy(self, is_correct: bool, time_taken: float, expected_time: float) -> float:
        if not is_correct:
            return 1.0
        
        time_ratio = expected_time / max(time_taken, 1)
        speed_score = 3.0 + 2.0 * min(time_ratio, 2.0)
        
        return max(0.01, min(10.0, speed_score))
    
    def _calculate_retention_decay(self, hours_elapsed: float, current_strength: float) -> float:
        # Exponential decay based on forgetting curve
        decay_rate = 0.1 / (1 + current_strength)
        decay = 1 - math.exp(-decay_rate * hours_elapsed / 24)
        return min(0.8, decay)
    
    def _calculate_learning_velocity(self, old_mastery: float, new_mastery: float) -> float:
        improvement = new_mastery - old_mastery
        velocity = 1.0 + improvement * 0.1
        return max(0.5, min(2.0, velocity))
    
    def _calculate_understanding_depth(self, conceptual_score: float, application_score: float) -> float:
        depth = (conceptual_score + application_score) / 2
        return max(0.01, min(10.0, depth))
    
    def _update_retention_strength(self, current_strength: float, is_correct: bool) -> float:
        if is_correct:
            return min(10.0, current_strength * 1.1)
        else:
            return max(0.01, current_strength * 0.9)
    
    def _calculate_cognitive_load(self, difficulty: float, time_taken: float, expected_time: float) -> float:
        time_pressure = time_taken / expected_time
        load = difficulty * time_pressure
        return max(0.1, min(2.0, load))

    def get_mastery_interpretation(self, mastery_level: float) -> Dict[str, Any]:
        """Interpret mastery level for different purposes"""
        if mastery_level < 1.0:
            return {
                'level': 'Novice',
                'description': 'Needs fundamental concept building',
                'recommendations': ['Basic concept videos', 'Simple examples', 'Guided practice'],
                'ready_for_exam': False,
                'confidence_score': 'Very Low'
            }
        elif mastery_level < 3.0:
            return {
                'level': 'Developing',
                'description': 'Understands basics, needs more practice',
                'recommendations': ['Practice problems', 'Step-by-step solutions', 'Pattern recognition'],
                'ready_for_exam': False,
                'confidence_score': 'Low'
            }
        elif mastery_level < 5.0:
            return {
                'level': 'Competent',
                'description': 'Can solve standard SSC problems',
                'recommendations': ['Timed practice', 'Mixed problem sets', 'Speed building'],
                'ready_for_exam': True,
                'confidence_score': 'Moderate'
            }
        elif mastery_level < 7.0:
            return {
                'level': 'Proficient',
                'description': 'Handles complex variations well',
                'recommendations': ['Advanced problems', 'Tricky questions', 'Mock tests'],
                'ready_for_exam': True,
                'confidence_score': 'High'
            }
        elif mastery_level < 8.5:
            return {
                'level': 'Advanced',
                'description': 'Masters difficult problems',
                'recommendations': ['Exam-level challenges', 'Time optimization', 'Teaching others'],
                'ready_for_exam': True,
                'confidence_score': 'Very High'
            }
        else:
            return {
                'level': 'Expert',
                'description': 'Can solve any SSC problem creatively',
                'recommendations': ['Help others', 'Focus on weaker topics', 'Maintain sharpness'],
                'ready_for_exam': True,
                'confidence_score': 'Expert'
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

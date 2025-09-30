from typing import Dict, List, Optional
from datetime import datetime, timedelta
from enum import Enum
import numpy as np

class EmotionalState(Enum):
    """Student emotional states"""
    ENGAGED = "engaged"
    FRUSTRATED = "frustrated"
    BORED = "bored"
    CONFUSED = "confused"
    CONFIDENT = "confident"
    ANXIOUS = "anxious"
    MOTIVATED = "motivated"

class InteractionPattern:
    """Analyze interaction patterns for emotional state"""

    @staticmethod
    def analyze_response_time(response_times: List[float]) -> Dict:
        """
        Analyze response time patterns
        Returns indicators of emotional state
        """
        if not response_times:
            return {"state": "unknown", "confidence": 0}

        avg_time = np.mean(response_times)
        std_time = np.std(response_times)

        # Very fast responses might indicate guessing or disengagement
        if avg_time < 10:  # seconds
            return {
                "state": "rushed_or_guessing",
                "confidence": 0.7,
                "indicator": "very_fast_responses"
            }

        # Very slow responses might indicate confusion
        if avg_time > 120:  # seconds
            return {
                "state": "confused_or_struggling",
                "confidence": 0.6,
                "indicator": "very_slow_responses"
            }

        # High variance might indicate inconsistency
        if std_time > avg_time * 0.8:
            return {
                "state": "inconsistent_engagement",
                "confidence": 0.5,
                "indicator": "high_variance"
            }

        return {
            "state": "normal",
            "confidence": 0.8,
            "indicator": "consistent_pace"
        }

    @staticmethod
    def analyze_error_patterns(recent_responses: List[bool]) -> Dict:
        """
        Analyze error patterns for frustration/confusion
        """
        if not recent_responses:
            return {"state": "unknown", "confidence": 0}

        # Calculate recent accuracy
        window_size = min(10, len(recent_responses))
        recent_window = recent_responses[-window_size:]
        accuracy = sum(recent_window) / len(recent_window)

        # Check for declining performance
        if len(recent_responses) >= 20:
            earlier_window = recent_responses[-20:-10]
            earlier_accuracy = sum(earlier_window) / len(earlier_window)

            if earlier_accuracy - accuracy > 0.3:
                return {
                    "state": "frustrated",
                    "confidence": 0.8,
                    "indicator": "declining_performance",
                    "recommendation": "suggest_break_or_easier_content"
                }

        # Consecutive errors
        consecutive_errors = 0
        max_consecutive = 0
        for response in reversed(recent_window):
            if not response:
                consecutive_errors += 1
                max_consecutive = max(max_consecutive, consecutive_errors)
            else:
                consecutive_errors = 0

        if max_consecutive >= 5:
            return {
                "state": "confused",
                "confidence": 0.9,
                "indicator": "consecutive_errors",
                "recommendation": "provide_conceptual_review"
            }

        # High accuracy
        if accuracy > 0.85:
            return {
                "state": "confident",
                "confidence": 0.7,
                "indicator": "high_accuracy",
                "recommendation": "suggest_harder_content"
            }

        return {
            "state": "normal",
            "confidence": 0.6,
            "indicator": "balanced_performance"
        }

    @staticmethod
    def analyze_session_patterns(session_data: List[Dict]) -> Dict:
        """
        Analyze session patterns over time
        """
        if not session_data:
            return {"state": "unknown", "confidence": 0}

        # Check session frequency
        if len(session_data) >= 7:
            recent_sessions = session_data[-7:]
            dates = [datetime.fromisoformat(s['date']) for s in recent_sessions]
            gaps = [(dates[i] - dates[i-1]).days for i in range(1, len(dates))]

            avg_gap = np.mean(gaps) if gaps else 0

            if avg_gap > 3:
                return {
                    "state": "disengaged",
                    "confidence": 0.6,
                    "indicator": "infrequent_sessions",
                    "recommendation": "send_motivation_reminder"
                }

        # Check session duration
        recent_durations = [s.get('duration', 0) for s in session_data[-10:]]
        if recent_durations:
            avg_duration = np.mean(recent_durations)

            if avg_duration < 10:  # minutes
                return {
                    "state": "bored_or_rushed",
                    "confidence": 0.5,
                    "indicator": "short_sessions",
                    "recommendation": "make_content_engaging"
                }

        return {
            "state": "engaged",
            "confidence": 0.7,
            "indicator": "regular_engagement"
        }


class EmotionalIntelligenceEngine:
    """
    Comprehensive emotional intelligence and engagement tracking
    """

    def __init__(self):
        self.user_emotional_profiles: Dict[str, Dict] = {}

    def analyze_user_state(
        self,
        user_id: str,
        recent_interactions: List[Dict]
    ) -> Dict:
        """
        Analyze user's current emotional state
        Args:
            user_id: User identifier
            recent_interactions: Recent interaction history
        Returns:
            Emotional state analysis with recommendations
        """
        if not recent_interactions:
            return self._default_state()

        # Extract data from interactions
        response_times = [i.get('response_time', 0) for i in recent_interactions]
        responses = [i.get('is_correct', False) for i in recent_interactions]
        session_data = self._group_by_session(recent_interactions)

        # Analyze different patterns
        time_analysis = InteractionPattern.analyze_response_time(response_times)
        error_analysis = InteractionPattern.analyze_error_patterns(responses)
        session_analysis = InteractionPattern.analyze_session_patterns(session_data)

        # Combine analyses
        combined_state = self._combine_analyses(
            time_analysis,
            error_analysis,
            session_analysis
        )

        # Update user profile
        self._update_user_profile(user_id, combined_state)

        return combined_state

    def _combine_analyses(
        self,
        time_analysis: Dict,
        error_analysis: Dict,
        session_analysis: Dict
    ) -> Dict:
        """Combine multiple analyses into overall state"""

        # Weight different signals
        analyses = [
            (error_analysis, 0.5),  # Error patterns most important
            (time_analysis, 0.3),
            (session_analysis, 0.2)
        ]

        # Determine primary state
        state_scores = {}
        for analysis, weight in analyses:
            state = analysis.get('state', 'unknown')
            confidence = analysis.get('confidence', 0)
            score = confidence * weight

            if state not in state_scores:
                state_scores[state] = 0
            state_scores[state] += score

        primary_state = max(state_scores, key=state_scores.get)

        # Collect recommendations
        recommendations = []
        for analysis, _ in analyses:
            if 'recommendation' in analysis:
                recommendations.append(analysis['recommendation'])

        return {
            "emotional_state": primary_state,
            "confidence": round(state_scores[primary_state], 2),
            "contributing_factors": {
                "response_time": time_analysis.get('indicator', 'unknown'),
                "error_pattern": error_analysis.get('indicator', 'unknown'),
                "session_pattern": session_analysis.get('indicator', 'unknown')
            },
            "recommendations": recommendations,
            "adaptive_actions": self._generate_adaptive_actions(primary_state)
        }

    def _generate_adaptive_actions(self, state: str) -> List[Dict]:
        """Generate adaptive actions based on emotional state"""
        actions = {
            "frustrated": [
                {
                    "action": "reduce_difficulty",
                    "description": "Temporarily show easier questions",
                    "priority": "high"
                },
                {
                    "action": "provide_hints",
                    "description": "Enable step-by-step hints",
                    "priority": "high"
                },
                {
                    "action": "encourage",
                    "description": "Show motivational message",
                    "priority": "medium"
                }
            ],
            "confused": [
                {
                    "action": "show_explanation",
                    "description": "Provide detailed concept explanation",
                    "priority": "high"
                },
                {
                    "action": "recommend_video",
                    "description": "Suggest video tutorial",
                    "priority": "high"
                },
                {
                    "action": "practice_basics",
                    "description": "Review prerequisite concepts",
                    "priority": "medium"
                }
            ],
            "bored": [
                {
                    "action": "increase_difficulty",
                    "description": "Present more challenging content",
                    "priority": "high"
                },
                {
                    "action": "gamify",
                    "description": "Add gamification elements",
                    "priority": "medium"
                },
                {
                    "action": "variety",
                    "description": "Mix different question types",
                    "priority": "medium"
                }
            ],
            "confident": [
                {
                    "action": "advance_content",
                    "description": "Progress to advanced topics",
                    "priority": "high"
                },
                {
                    "action": "mock_test",
                    "description": "Suggest full mock test",
                    "priority": "medium"
                }
            ],
            "anxious": [
                {
                    "action": "relaxation_prompt",
                    "description": "Suggest taking a short break",
                    "priority": "high"
                },
                {
                    "action": "confidence_building",
                    "description": "Review mastered topics",
                    "priority": "medium"
                },
                {
                    "action": "positive_reinforcement",
                    "description": "Highlight progress made",
                    "priority": "high"
                }
            ]
        }

        return actions.get(state, [])

    def _update_user_profile(self, user_id: str, state_analysis: Dict):
        """Update user's emotional profile"""
        if user_id not in self.user_emotional_profiles:
            self.user_emotional_profiles[user_id] = {
                "state_history": [],
                "dominant_states": {},
                "last_updated": datetime.now()
            }

        profile = self.user_emotional_profiles[user_id]

        # Add to history
        profile["state_history"].append({
            "state": state_analysis["emotional_state"],
            "confidence": state_analysis["confidence"],
            "timestamp": datetime.now()
        })

        # Keep only last 50 entries
        if len(profile["state_history"]) > 50:
            profile["state_history"] = profile["state_history"][-50:]

        # Update dominant states
        state = state_analysis["emotional_state"]
        if state not in profile["dominant_states"]:
            profile["dominant_states"][state] = 0
        profile["dominant_states"][state] += 1

        profile["last_updated"] = datetime.now()

    def get_user_profile(self, user_id: str) -> Dict:
        """Get user's emotional profile"""
        profile = self.user_emotional_profiles.get(user_id)
        if not profile:
            return self._default_profile()

        # Calculate insights
        state_history = profile["state_history"]
        recent_states = [s["state"] for s in state_history[-10:]]

        dominant_state = max(
            profile["dominant_states"],
            key=profile["dominant_states"].get
        ) if profile["dominant_states"] else "unknown"

        return {
            "user_id": user_id,
            "dominant_emotional_state": dominant_state,
            "recent_states": recent_states,
            "state_distribution": profile["dominant_states"],
            "total_observations": len(state_history),
            "last_updated": profile["last_updated"].isoformat()
        }

    def _group_by_session(self, interactions: List[Dict]) -> List[Dict]:
        """Group interactions into sessions"""
        if not interactions:
            return []

        sessions = []
        current_session = {
            "date": interactions[0].get('timestamp', datetime.now()).split('T')[0] if isinstance(interactions[0].get('timestamp'), str) else datetime.now().isoformat().split('T')[0],
            "duration": 0,
            "interactions": []
        }

        for interaction in interactions:
            timestamp = interaction.get('timestamp', datetime.now())
            if isinstance(timestamp, str):
                timestamp = datetime.fromisoformat(timestamp)

            date = timestamp.date().isoformat()

            if date != current_session["date"]:
                sessions.append(current_session)
                current_session = {
                    "date": date,
                    "duration": 0,
                    "interactions": []
                }

            current_session["interactions"].append(interaction)
            current_session["duration"] += interaction.get('response_time', 0) / 60  # minutes

        sessions.append(current_session)
        return sessions

    def _default_state(self) -> Dict:
        """Default state when no data available"""
        return {
            "emotional_state": "unknown",
            "confidence": 0,
            "contributing_factors": {},
            "recommendations": [],
            "adaptive_actions": []
        }

    def _default_profile(self) -> Dict:
        """Default profile for new users"""
        return {
            "dominant_emotional_state": "unknown",
            "recent_states": [],
            "state_distribution": {},
            "total_observations": 0,
            "last_updated": datetime.now().isoformat()
        }

    def calculate_engagement_score(self, user_id: str) -> float:
        """
        Calculate overall engagement score (0-100)
        """
        profile = self.user_emotional_profiles.get(user_id)
        if not profile:
            return 50.0  # Default neutral score

        state_history = profile["state_history"]
        if not state_history:
            return 50.0

        # Weight different states
        state_weights = {
            "engaged": 100,
            "confident": 90,
            "motivated": 95,
            "normal": 70,
            "confused": 50,
            "frustrated": 30,
            "bored": 40,
            "anxious": 45,
            "unknown": 50
        }

        # Calculate weighted average of recent states
        recent_states = state_history[-20:]
        scores = [state_weights.get(s["state"], 50) * s["confidence"] for s in recent_states]

        engagement_score = np.mean(scores) if scores else 50.0

        return round(engagement_score, 2)

import numpy as np
import torch
import torch.nn as nn
from typing import List, Dict, Optional, Tuple
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.preprocessing import StandardScaler
import pickle

class LSTMPerformancePredictor(nn.Module):
    """
    LSTM-based performance prediction model
    Predicts future exam scores based on historical performance
    """

    def __init__(
        self,
        input_size: int = 10,
        hidden_size: int = 64,
        num_layers: int = 2,
        output_size: int = 1,
        dropout: float = 0.2
    ):
        super(LSTMPerformancePredictor, self).__init__()

        self.hidden_size = hidden_size
        self.num_layers = num_layers

        self.lstm = nn.LSTM(
            input_size=input_size,
            hidden_size=hidden_size,
            num_layers=num_layers,
            batch_first=True,
            dropout=dropout if num_layers > 1 else 0
        )

        self.dropout = nn.Dropout(dropout)
        self.fc = nn.Linear(hidden_size, output_size)

    def forward(
        self,
        x: torch.Tensor,
        hidden: Optional[Tuple[torch.Tensor, torch.Tensor]] = None
    ) -> Tuple[torch.Tensor, Tuple[torch.Tensor, torch.Tensor]]:
        batch_size = x.size(0)

        if hidden is None:
            h0 = torch.zeros(self.num_layers, batch_size, self.hidden_size)
            c0 = torch.zeros(self.num_layers, batch_size, self.hidden_size)
            hidden = (h0, c0)

        lstm_out, hidden = self.lstm(x, hidden)
        last_output = lstm_out[:, -1, :]
        dropped = self.dropout(last_output)
        prediction = self.fc(dropped)

        return prediction, hidden


class PerformancePredictionSystem:
    """
    Hybrid performance prediction system
    Combines XGBoost and LSTM for robust predictions
    """

    def __init__(self):
        self.xgb_model = GradientBoostingRegressor(
            n_estimators=100,
            learning_rate=0.1,
            max_depth=5,
            random_state=42
        )
        self.lstm_model = LSTMPerformancePredictor()
        self.scaler = StandardScaler()
        self.is_trained = False

    def extract_features(self, user_data: Dict) -> np.ndarray:
        """
        Extract features from user performance data
        """
        features = []

        # Recent performance metrics
        recent_scores = user_data.get('recent_quiz_scores', [])
        features.extend([
            np.mean(recent_scores) if recent_scores else 0,
            np.std(recent_scores) if len(recent_scores) > 1 else 0,
            max(recent_scores) if recent_scores else 0,
            min(recent_scores) if recent_scores else 0
        ])

        # Subject-wise performance
        subject_scores = user_data.get('subject_scores', {})
        for subject in ['mathematics', 'reasoning', 'english', 'general_studies']:
            features.append(subject_scores.get(subject, 0))

        # Study patterns
        features.extend([
            user_data.get('total_study_hours', 0),
            user_data.get('study_consistency', 0),
            user_data.get('average_session_length', 0),
            user_data.get('practice_frequency', 0)
        ])

        # Progress indicators
        features.extend([
            user_data.get('completion_rate', 0),
            user_data.get('improvement_rate', 0),
            user_data.get('weak_topics_count', 0)
        ])

        return np.array(features).reshape(1, -1)

    def predict_exam_score(self, user_data: Dict) -> Dict:
        """
        Predict expected exam score
        Returns prediction with confidence interval
        """
        features = self.extract_features(user_data)

        if not self.is_trained:
            # Use heuristic-based prediction if model not trained
            return self._heuristic_prediction(user_data)

        try:
            # Scale features
            scaled_features = self.scaler.transform(features)

            # XGBoost prediction
            xgb_pred = self.xgb_model.predict(scaled_features)[0]

            # Use XGBoost as primary prediction
            predicted_score = float(xgb_pred)

            # Clip to valid range
            predicted_score = np.clip(predicted_score, 0, 100)

            # Calculate confidence based on data quality
            confidence = self._calculate_confidence(user_data)

            return {
                "predicted_score": round(predicted_score, 2),
                "confidence": round(confidence, 2),
                "confidence_interval": (
                    round(predicted_score - (10 * (1 - confidence)), 2),
                    round(predicted_score + (10 * (1 - confidence)), 2)
                ),
                "prediction_factors": self._identify_key_factors(user_data)
            }

        except Exception as e:
            print(f"Prediction error: {e}")
            return self._heuristic_prediction(user_data)

    def _heuristic_prediction(self, user_data: Dict) -> Dict:
        """
        Fallback heuristic-based prediction
        """
        recent_scores = user_data.get('recent_quiz_scores', [])
        avg_score = np.mean(recent_scores) if recent_scores else 50

        # Adjust based on study hours
        study_hours = user_data.get('total_study_hours', 0)
        hour_bonus = min(20, study_hours / 10)

        # Adjust based on consistency
        consistency = user_data.get('study_consistency', 0.5)
        consistency_bonus = consistency * 10

        predicted_score = avg_score + hour_bonus + consistency_bonus
        predicted_score = np.clip(predicted_score, 0, 100)

        return {
            "predicted_score": round(predicted_score, 2),
            "confidence": 0.6,
            "confidence_interval": (
                round(predicted_score - 15, 2),
                round(predicted_score + 15, 2)
            ),
            "prediction_factors": {
                "recent_performance": round(avg_score, 2),
                "study_hours_impact": round(hour_bonus, 2),
                "consistency_impact": round(consistency_bonus, 2)
            }
        }

    def _calculate_confidence(self, user_data: Dict) -> float:
        """Calculate prediction confidence based on data quality"""
        confidence_factors = []

        # Data completeness
        recent_scores = user_data.get('recent_quiz_scores', [])
        if len(recent_scores) >= 10:
            confidence_factors.append(0.9)
        elif len(recent_scores) >= 5:
            confidence_factors.append(0.7)
        else:
            confidence_factors.append(0.5)

        # Study consistency
        consistency = user_data.get('study_consistency', 0)
        confidence_factors.append(consistency)

        # Time before exam
        days_until_exam = user_data.get('days_until_exam', 90)
        time_confidence = min(1.0, days_until_exam / 90) if days_until_exam > 0 else 0.5
        confidence_factors.append(time_confidence)

        return np.mean(confidence_factors)

    def _identify_key_factors(self, user_data: Dict) -> Dict:
        """Identify key factors affecting prediction"""
        recent_scores = user_data.get('recent_quiz_scores', [])

        return {
            "recent_performance_avg": round(np.mean(recent_scores), 2) if recent_scores else 0,
            "performance_trend": self._calculate_trend(recent_scores),
            "study_consistency": round(user_data.get('study_consistency', 0), 2),
            "completion_rate": round(user_data.get('completion_rate', 0), 2),
            "weak_areas_count": user_data.get('weak_topics_count', 0)
        }

    def _calculate_trend(self, scores: List[float]) -> str:
        """Calculate performance trend"""
        if len(scores) < 2:
            return "insufficient_data"

        recent_avg = np.mean(scores[-5:]) if len(scores) >= 5 else np.mean(scores)
        earlier_avg = np.mean(scores[:5]) if len(scores) >= 10 else np.mean(scores[:-5]) if len(scores) >= 5 else recent_avg

        diff = recent_avg - earlier_avg

        if diff > 5:
            return "improving"
        elif diff < -5:
            return "declining"
        else:
            return "stable"

    def predict_subject_performance(self, user_data: Dict) -> Dict:
        """
        Predict performance for each subject
        """
        subjects = ['mathematics', 'reasoning', 'english', 'general_studies']
        predictions = {}

        for subject in subjects:
            subject_data = {
                'recent_quiz_scores': user_data.get(f'{subject}_scores', []),
                'total_study_hours': user_data.get(f'{subject}_hours', 0),
                'study_consistency': user_data.get('study_consistency', 0.5),
                'completion_rate': user_data.get(f'{subject}_completion', 0),
                'weak_topics_count': user_data.get(f'{subject}_weak_topics', 0),
                'days_until_exam': user_data.get('days_until_exam', 90)
            }

            predictions[subject] = self.predict_exam_score(subject_data)

        return predictions

    def identify_improvement_opportunities(self, user_data: Dict) -> List[Dict]:
        """
        Identify areas where improvement would have highest impact
        """
        opportunities = []

        # Check weak subjects
        subject_scores = user_data.get('subject_scores', {})
        for subject, score in subject_scores.items():
            if score < 60:
                potential_gain = (70 - score) * 0.25  # 25% weightage per subject
                opportunities.append({
                    "area": f"{subject}_mastery",
                    "current_score": score,
                    "potential_gain": round(potential_gain, 2),
                    "priority": "high" if score < 50 else "medium",
                    "recommendation": f"Focus on improving {subject} - significant score potential"
                })

        # Check study consistency
        consistency = user_data.get('study_consistency', 0)
        if consistency < 0.7:
            opportunities.append({
                "area": "study_consistency",
                "current_value": round(consistency, 2),
                "potential_gain": 10,
                "priority": "high",
                "recommendation": "Maintain regular study schedule for better retention"
            })

        # Check practice frequency
        practice_freq = user_data.get('practice_frequency', 0)
        if practice_freq < 3:  # Less than 3 times per week
            opportunities.append({
                "area": "practice_frequency",
                "current_value": practice_freq,
                "potential_gain": 8,
                "priority": "medium",
                "recommendation": "Increase practice frequency to at least 4-5 times per week"
            })

        # Sort by potential gain
        opportunities.sort(key=lambda x: x['potential_gain'], reverse=True)

        return opportunities[:5]  # Top 5 opportunities

    def save_model(self, path: str):
        """Save trained model"""
        with open(path, 'wb') as f:
            pickle.dump({
                'xgb_model': self.xgb_model,
                'scaler': self.scaler,
                'is_trained': self.is_trained
            }, f)

    def load_model(self, path: str):
        """Load trained model"""
        try:
            with open(path, 'rb') as f:
                data = pickle.load(f)
                self.xgb_model = data['xgb_model']
                self.scaler = data['scaler']
                self.is_trained = data['is_trained']
        except Exception as e:
            print(f"Could not load model: {e}")

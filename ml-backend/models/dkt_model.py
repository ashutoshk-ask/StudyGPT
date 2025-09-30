import torch
import torch.nn as nn
import numpy as np
from typing import List, Tuple, Optional

class DeepKnowledgeTracing(nn.Module):
    """
    Deep Knowledge Tracing using LSTM
    Predicts student knowledge state based on interaction history
    """

    def __init__(
        self,
        num_skills: int,
        hidden_size: int = 128,
        num_layers: int = 2,
        dropout: float = 0.2
    ):
        super(DeepKnowledgeTracing, self).__init__()

        self.num_skills = num_skills
        self.hidden_size = hidden_size
        self.num_layers = num_layers

        # Input: (question_id, correctness) -> 2 * num_skills features
        self.input_size = 2 * num_skills

        # LSTM layers
        self.lstm = nn.LSTM(
            input_size=self.input_size,
            hidden_size=hidden_size,
            num_layers=num_layers,
            batch_first=True,
            dropout=dropout if num_layers > 1 else 0
        )

        # Output layer
        self.fc = nn.Linear(hidden_size, num_skills)
        self.sigmoid = nn.Sigmoid()

        self.dropout = nn.Dropout(dropout)

    def forward(
        self,
        x: torch.Tensor,
        hidden: Optional[Tuple[torch.Tensor, torch.Tensor]] = None
    ) -> Tuple[torch.Tensor, Tuple[torch.Tensor, torch.Tensor]]:
        """
        Forward pass
        Args:
            x: Input tensor of shape (batch_size, sequence_length, input_size)
            hidden: Hidden state tuple (h, c)
        Returns:
            predictions: Tensor of shape (batch_size, sequence_length, num_skills)
            hidden: Updated hidden state
        """
        batch_size = x.size(0)

        if hidden is None:
            h0 = torch.zeros(self.num_layers, batch_size, self.hidden_size).to(x.device)
            c0 = torch.zeros(self.num_layers, batch_size, self.hidden_size).to(x.device)
            hidden = (h0, c0)

        # LSTM forward
        lstm_out, hidden = self.lstm(x, hidden)

        # Dropout
        lstm_out = self.dropout(lstm_out)

        # Fully connected layer
        output = self.fc(lstm_out)

        # Sigmoid activation for probability
        predictions = self.sigmoid(output)

        return predictions, hidden

    def predict_next(
        self,
        interaction_history: List[Tuple[int, int]],
        target_skill: int
    ) -> float:
        """
        Predict probability of correctly answering next question
        Args:
            interaction_history: List of (skill_id, correctness) tuples
            target_skill: Skill ID for which to predict
        Returns:
            Probability of correct answer
        """
        self.eval()
        with torch.no_grad():
            # Encode interaction history
            x = self._encode_sequence(interaction_history)
            x = torch.FloatTensor(x).unsqueeze(0)  # Add batch dimension

            # Forward pass
            predictions, _ = self.forward(x)

            # Get prediction for target skill
            last_prediction = predictions[0, -1, target_skill].item()

            return last_prediction

    def _encode_sequence(self, interactions: List[Tuple[int, int]]) -> np.ndarray:
        """
        Encode interaction sequence into one-hot representation
        Args:
            interactions: List of (skill_id, correctness) tuples
        Returns:
            Encoded sequence array
        """
        sequence = []
        for skill_id, correctness in interactions:
            # One-hot encoding
            encoded = np.zeros(self.input_size)

            # Set skill position
            encoded[skill_id] = 1

            # Set correctness position
            if correctness == 1:
                encoded[self.num_skills + skill_id] = 1

            sequence.append(encoded)

        return np.array(sequence)


class DKTPredictor:
    """Wrapper class for DKT predictions"""

    def __init__(self, model_path: Optional[str] = None, num_skills: int = 100):
        self.num_skills = num_skills
        self.model = DeepKnowledgeTracing(num_skills=num_skills)

        if model_path:
            try:
                self.model.load_state_dict(torch.load(model_path, map_location='cpu'))
                print(f"Loaded DKT model from {model_path}")
            except Exception as e:
                print(f"Could not load model: {e}. Using untrained model.")

        self.model.eval()

    def predict_mastery(
        self,
        user_interactions: List[dict],
        skill_id: int
    ) -> float:
        """
        Predict mastery level for a specific skill
        Args:
            user_interactions: List of interaction dicts with 'skill_id' and 'correct'
            skill_id: Target skill ID
        Returns:
            Mastery probability (0-1)
        """
        # Convert to interaction tuples
        interactions = [
            (int(interaction.get('skill_id', 0)), int(interaction.get('correct', 0)))
            for interaction in user_interactions
        ]

        if not interactions:
            return 0.5  # Default uncertainty

        return self.model.predict_next(interactions, skill_id)

    def predict_all_skills(
        self,
        user_interactions: List[dict]
    ) -> dict:
        """
        Predict mastery for all skills
        Returns:
            Dictionary mapping skill_id to mastery probability
        """
        predictions = {}
        for skill_id in range(self.num_skills):
            predictions[skill_id] = self.predict_mastery(user_interactions, skill_id)

        return predictions

    def get_weak_skills(
        self,
        user_interactions: List[dict],
        threshold: float = 0.6
    ) -> List[int]:
        """
        Identify skills below mastery threshold
        """
        all_predictions = self.predict_all_skills(user_interactions)
        weak_skills = [
            skill_id for skill_id, mastery in all_predictions.items()
            if mastery < threshold
        ]
        return weak_skills

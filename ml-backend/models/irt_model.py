import numpy as np
from typing import Dict, List, Optional, Tuple
from scipy.optimize import minimize
from scipy.special import expit

class ItemResponseTheory:
    """
    Item Response Theory (IRT) implementation
    3-Parameter Logistic (3PL) Model
    """

    def __init__(self):
        self.item_parameters: Dict[str, Dict[str, float]] = {}
        self.student_abilities: Dict[str, float] = {}

    def probability_correct_3pl(
        self,
        ability: float,
        difficulty: float,
        discrimination: float,
        guessing: float
    ) -> float:
        """
        Calculate probability of correct response using 3PL model
        P(θ) = c + (1 - c) / (1 + exp(-a(θ - b)))

        Args:
            ability: Student ability (θ)
            difficulty: Item difficulty (b)
            discrimination: Item discrimination (a)
            guessing: Pseudo-guessing parameter (c)
        Returns:
            Probability of correct answer
        """
        exponent = discrimination * (ability - difficulty)
        prob = guessing + (1 - guessing) * expit(exponent)
        return prob

    def estimate_ability(
        self,
        responses: List[Tuple[str, bool]],
        initial_ability: float = 0.0
    ) -> float:
        """
        Estimate student ability using Maximum Likelihood Estimation
        Args:
            responses: List of (item_id, is_correct) tuples
            initial_ability: Starting ability estimate
        Returns:
            Estimated ability
        """
        def negative_log_likelihood(ability):
            nll = 0
            for item_id, is_correct in responses:
                params = self.get_item_parameters(item_id)

                prob = self.probability_correct_3pl(
                    ability,
                    params["difficulty"],
                    params["discrimination"],
                    params["guessing"]
                )

                # Avoid log(0)
                prob = np.clip(prob, 1e-10, 1 - 1e-10)

                if is_correct:
                    nll -= np.log(prob)
                else:
                    nll -= np.log(1 - prob)

            return nll

        # Optimize to find ability
        result = minimize(
            negative_log_likelihood,
            x0=initial_ability,
            method='BFGS',
            options={'maxiter': 100}
        )

        return float(result.x[0])

    def get_item_parameters(self, item_id: str) -> Dict[str, float]:
        """Get or initialize item parameters"""
        if item_id not in self.item_parameters:
            self.item_parameters[item_id] = {
                "difficulty": 0.0,
                "discrimination": 1.0,
                "guessing": 0.25  # Default for 4-option MCQ
            }
        return self.item_parameters[item_id]

    def set_item_parameters(
        self,
        item_id: str,
        difficulty: float,
        discrimination: float,
        guessing: float
    ):
        """Set item parameters"""
        self.item_parameters[item_id] = {
            "difficulty": difficulty,
            "discrimination": discrimination,
            "guessing": guessing
        }

    def calibrate_items(
        self,
        response_data: List[Dict]
    ):
        """
        Calibrate item parameters from response data
        Simplified calibration using mean difficulty
        Args:
            response_data: List of dicts with 'item_id', 'student_id', 'correct'
        """
        # Group by item
        item_responses: Dict[str, List[bool]] = {}

        for response in response_data:
            item_id = response.get('item_id')
            is_correct = response.get('correct', False)

            if item_id not in item_responses:
                item_responses[item_id] = []

            item_responses[item_id].append(is_correct)

        # Calculate parameters for each item
        for item_id, responses in item_responses.items():
            p_correct = np.mean(responses)

            # Estimate difficulty from proportion correct
            # Higher p_correct -> lower difficulty
            if p_correct > 0.99:
                p_correct = 0.99
            if p_correct < 0.01:
                p_correct = 0.01

            difficulty = -np.log(p_correct / (1 - p_correct))

            # Default discrimination and guessing
            discrimination = 1.0
            guessing = 0.25

            self.set_item_parameters(item_id, difficulty, discrimination, guessing)

    def get_student_ability(self, student_id: str) -> float:
        """Get student ability"""
        return self.student_abilities.get(student_id, 0.0)

    def update_student_ability(
        self,
        student_id: str,
        responses: List[Tuple[str, bool]]
    ) -> float:
        """Update student ability based on responses"""
        current_ability = self.get_student_ability(student_id)
        new_ability = self.estimate_ability(responses, current_ability)
        self.student_abilities[student_id] = new_ability
        return new_ability

    def select_next_item(
        self,
        student_id: str,
        available_items: List[str],
        target_info: float = 2.0
    ) -> str:
        """
        Select next best item for adaptive testing
        Maximizes information at student's ability level
        Args:
            student_id: Student identifier
            available_items: List of available item IDs
            target_info: Target information level
        Returns:
            Selected item ID
        """
        ability = self.get_student_ability(student_id)

        best_item = None
        best_info = 0

        for item_id in available_items:
            params = self.get_item_parameters(item_id)

            # Calculate Fisher information
            prob = self.probability_correct_3pl(
                ability,
                params["difficulty"],
                params["discrimination"],
                params["guessing"]
            )

            q = 1 - prob
            info = (params["discrimination"] ** 2) * (q / prob) * ((prob - params["guessing"]) ** 2) / ((1 - params["guessing"]) ** 2)

            if info > best_info:
                best_info = info
                best_item = item_id

        return best_item if best_item else available_items[0]


class ComputerizedAdaptiveTesting:
    """
    Computerized Adaptive Testing (CAT) using IRT
    """

    def __init__(
        self,
        item_bank: List[str],
        irt_model: Optional[ItemResponseTheory] = None
    ):
        self.item_bank = item_bank
        self.irt = irt_model or ItemResponseTheory()
        self.test_sessions: Dict[str, Dict] = {}

    def start_test(self, student_id: str, test_id: str):
        """Initialize a new adaptive test session"""
        self.test_sessions[test_id] = {
            "student_id": student_id,
            "items_administered": [],
            "responses": [],
            "current_ability": 0.0,
            "se_ability": 1.0,
            "num_items": 0
        }

    def get_next_item(self, test_id: str) -> Optional[str]:
        """Get next item for adaptive test"""
        session = self.test_sessions.get(test_id)
        if not session:
            return None

        # Items not yet administered
        administered = set(session["items_administered"])
        available = [item for item in self.item_bank if item not in administered]

        if not available:
            return None

        # Select best item based on current ability
        student_id = session["student_id"]
        next_item = self.irt.select_next_item(student_id, available)

        return next_item

    def submit_response(
        self,
        test_id: str,
        item_id: str,
        is_correct: bool
    ) -> Dict:
        """
        Submit response and update ability estimate
        Returns updated test state
        """
        session = self.test_sessions.get(test_id)
        if not session:
            return {"error": "Test session not found"}

        # Record response
        session["items_administered"].append(item_id)
        session["responses"].append((item_id, is_correct))
        session["num_items"] += 1

        # Update ability estimate
        student_id = session["student_id"]
        new_ability = self.irt.update_student_ability(
            student_id,
            session["responses"]
        )

        session["current_ability"] = new_ability

        # Calculate standard error (simplified)
        session["se_ability"] = 1.0 / np.sqrt(session["num_items"])

        return {
            "ability_estimate": new_ability,
            "standard_error": session["se_ability"],
            "num_items": session["num_items"],
            "confidence_interval": (
                new_ability - 1.96 * session["se_ability"],
                new_ability + 1.96 * session["se_ability"]
            )
        }

    def should_terminate(
        self,
        test_id: str,
        min_items: int = 10,
        max_items: int = 50,
        target_se: float = 0.3
    ) -> bool:
        """
        Determine if test should terminate
        """
        session = self.test_sessions.get(test_id)
        if not session:
            return True

        num_items = session["num_items"]

        # Minimum items requirement
        if num_items < min_items:
            return False

        # Maximum items reached
        if num_items >= max_items:
            return True

        # Precision reached
        if session["se_ability"] <= target_se:
            return True

        return False

    def get_test_results(self, test_id: str) -> Dict:
        """Get final test results"""
        session = self.test_sessions.get(test_id)
        if not session:
            return {"error": "Test session not found"}

        return {
            "student_id": session["student_id"],
            "ability_estimate": session["current_ability"],
            "standard_error": session["se_ability"],
            "num_items_administered": session["num_items"],
            "responses": session["responses"],
            "score_percentile": self._ability_to_percentile(session["current_ability"])
        }

    def _ability_to_percentile(self, ability: float) -> float:
        """Convert ability to percentile (approximate)"""
        # Assuming ability is approximately N(0,1)
        from scipy.stats import norm
        percentile = norm.cdf(ability) * 100
        return round(percentile, 2)

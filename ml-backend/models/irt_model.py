import numpy as np
from typing import Dict, List, Optional, Tuple, Any
from scipy.optimize import minimize
from scipy.special import expit
from dataclasses import dataclass
from enum import Enum

class TestType(Enum):
    LEARNING_ADAPTIVE = "learning_adaptive"      # Adaptive for learning
    TOPIC_WISE = "topic_wise"                   # Customized topic tests
    SECTIONAL_MOCK = "sectional_mock"           # Customized sectional
    FULL_MOCK_SSC = "full_mock_ssc"            # Strict SSC pattern

@dataclass
class SSCPattern:
    """Official SSC CGL Tier-1 Pattern"""
    total_questions: int = 100
    total_time_minutes: int = 60
    sections: Dict[str, Dict] = None
    
    def __post_init__(self):
        if self.sections is None:
            self.sections = {
                "General Intelligence & Reasoning": {
                    "questions": 25,
                    "marks_per_question": 2,
                    "negative_marking": 0.5,
                    "difficulty_distribution": {"easy": 8, "medium": 12, "hard": 5},
                    "topic_weightage": {
                        "Analogies": 3, "Classification": 2, "Coding-Decoding": 3,
                        "Blood Relations": 2, "Direction Sense": 2, "Logical Reasoning": 4,
                        "Puzzles": 3, "Series": 3, "Syllogism": 3
                    }
                },
                "General Awareness": {
                    "questions": 25,
                    "marks_per_question": 2, 
                    "negative_marking": 0.5,
                    "difficulty_distribution": {"easy": 10, "medium": 10, "hard": 5},
                    "topic_weightage": {
                        "Current Affairs": 8, "History": 4, "Geography": 4,
                        "Polity": 3, "Economics": 2, "Science": 4
                    }
                },
                "Quantitative Aptitude": {
                    "questions": 25,
                    "marks_per_question": 2,
                    "negative_marking": 0.5, 
                    "difficulty_distribution": {"easy": 6, "medium": 14, "hard": 5},
                    "topic_weightage": {
                        "Arithmetic": 10, "Algebra": 3, "Geometry": 4,
                        "Trigonometry": 2, "Statistics": 3, "Data Interpretation": 3
                    }
                },
                "English Comprehension": {
                    "questions": 25,
                    "marks_per_question": 2,
                    "negative_marking": 0.5,
                    "difficulty_distribution": {"easy": 8, "medium": 12, "hard": 5},
                    "topic_weightage": {
                        "Reading Comprehension": 5, "Grammar": 8, "Vocabulary": 7,
                        "Error Detection": 3, "Fill in the Blanks": 2
                    }
                }
            }

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


class SSCAdaptiveTesting:
    """
    SSC CGL Adaptive Testing System
    Handles both learning-adaptive and strict SSC pattern tests
    """

    def __init__(self):
        self.ssc_pattern = SSCPattern()
        self.irt = ItemResponseTheory()
        self.test_sessions: Dict[str, Dict] = {}
        
    def generate_test(
        self, 
        test_type: TestType,
        user_id: str,
        user_mastery: Dict[str, float],
        customization: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Generate test based on type and user requirements"""
        
        if test_type == TestType.FULL_MOCK_SSC:
            return self._generate_full_mock_ssc(user_mastery)
        elif test_type == TestType.LEARNING_ADAPTIVE:
            return self._generate_learning_adaptive(user_id, user_mastery, customization)
        elif test_type == TestType.TOPIC_WISE:
            return self._generate_topic_wise(user_mastery, customization)
        elif test_type == TestType.SECTIONAL_MOCK:
            return self._generate_sectional_mock(user_mastery, customization)
    
    def _generate_full_mock_ssc(self, user_mastery: Dict[str, float]) -> Dict[str, Any]:
        """
        Generate STRICT SSC CGL pattern mock test
        - Exact question distribution
        - Authentic difficulty levels  
        - Real exam weightages
        - Official time allocation
        """
        
        test_structure = {
            "test_type": "SSC CGL Tier-1 Full Mock",
            "total_questions": self.ssc_pattern.total_questions,
            "total_time_minutes": self.ssc_pattern.total_time_minutes,
            "marking_scheme": {
                "correct_marks": 2,
                "negative_marks": -0.5,
                "total_marks": 200
            },
            "sections": []
        }
        
        for section_name, section_data in self.ssc_pattern.sections.items():
            section_questions = self._select_questions_for_section(
                section_name, 
                section_data,
                user_mastery,
                strict_ssc=True
            )
            
            test_structure["sections"].append({
                "name": section_name,
                "questions": section_questions,
                "question_count": section_data["questions"],
                "time_allocation": self.ssc_pattern.total_time_minutes // 4,  # Equal time per section
                "difficulty_distribution": section_data["difficulty_distribution"],
                "instructions": self._get_ssc_instructions(section_name)
            })
        
        # Add SSC-specific metadata
        test_structure["exam_info"] = {
            "pattern": "SSC CGL Tier-1",
            "negative_marking": True,
            "sectional_timing": False,
            "calculator_allowed": False,
            "rough_sheets": 3,
            "instructions": self._get_general_ssc_instructions()
        }
        
        return test_structure
    
    def _generate_learning_adaptive(
        self, 
        user_id: str, 
        user_mastery: Dict[str, float],
        customization: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Generate adaptive test for learning (not exam simulation)
        - Questions adapt based on performance
        - Focus on weak areas
        - Immediate feedback
        - Personalized difficulty
        """
        
        weak_topics = [topic for topic, mastery in user_mastery.items() if mastery < 5.0]
        focus_area = customization.get('focus_area', 'weak_topics')
        question_count = customization.get('question_count', 30)
        
        adaptive_questions = []
        
        if focus_area == 'weak_topics':
            # 70% from weak topics, 30% mixed
            weak_count = int(question_count * 0.7)
            mixed_count = question_count - weak_count
            
            for topic in weak_topics[:3]:  # Top 3 weak topics
                topic_questions = weak_count // min(3, len(weak_topics))
                questions = self._select_adaptive_questions(
                    topic, user_mastery.get(topic, 1.0), topic_questions
                )
                adaptive_questions.extend(questions)
        
        return {
            "test_type": "Adaptive Learning Test",
            "questions": adaptive_questions,
            "adaptive_features": {
                "difficulty_adjustment": True,
                "immediate_feedback": True,
                "hint_system": True,
                "step_by_step_solutions": True
            },
            "learning_objectives": weak_topics
        }

    def _select_questions_for_section(
        self, 
        section_name: str, 
        section_data: Dict,
        user_mastery: Dict[str, float],
        strict_ssc: bool = False
    ) -> List[Dict[str, Any]]:
        """Select questions maintaining SSC pattern compliance"""
        
        selected_questions = []
        topic_weightage = section_data["topic_weightage"]
        difficulty_dist = section_data["difficulty_distribution"]
        
        for topic, weight in topic_weightage.items():
            # Calculate questions needed for this topic
            questions_needed = weight
            
            # Distribute by difficulty
            if strict_ssc:
                easy_count = int(questions_needed * difficulty_dist["easy"] / sum(difficulty_dist.values()))
                medium_count = int(questions_needed * difficulty_dist["medium"] / sum(difficulty_dist.values()))
                hard_count = questions_needed - easy_count - medium_count
            else:
                # Adaptive distribution based on user mastery
                user_level = user_mastery.get(topic, 3.0)
                if user_level < 3.0:
                    easy_count = int(questions_needed * 0.6)
                    medium_count = int(questions_needed * 0.3)
                    hard_count = questions_needed - easy_count - medium_count
                elif user_level < 6.0:
                    easy_count = int(questions_needed * 0.3)
                    medium_count = int(questions_needed * 0.5)
                    hard_count = questions_needed - easy_count - medium_count
                else:
                    easy_count = int(questions_needed * 0.2)
                    medium_count = int(questions_needed * 0.4)
                    hard_count = questions_needed - easy_count - medium_count
            
            # Select questions with appropriate difficulty
            topic_questions = self._get_questions_by_difficulty(
                topic, easy_count, medium_count, hard_count, strict_ssc
            )
            
            selected_questions.extend(topic_questions)
        
        return selected_questions
    
    def _get_questions_by_difficulty(
        self, 
        topic: str, 
        easy_count: int, 
        medium_count: int, 
        hard_count: int,
        strict_ssc: bool
    ) -> List[Dict[str, Any]]:
        """Get questions by difficulty level for a topic"""
        questions = []
        
        # Easy questions (difficulty 0.2-0.4)
        for i in range(easy_count):
            questions.append({
                "topic": topic,
                "difficulty": np.random.uniform(0.2, 0.4) if not strict_ssc else 0.3,
                "type": "basic_concept",
                "marks": 2,
                "time_allocation": 45  # seconds
            })
        
        # Medium questions (difficulty 0.4-0.7)
        for i in range(medium_count):
            questions.append({
                "topic": topic,
                "difficulty": np.random.uniform(0.4, 0.7) if not strict_ssc else 0.55,
                "type": "application",
                "marks": 2,
                "time_allocation": 60  # seconds
            })
        
        # Hard questions (difficulty 0.7-0.9)
        for i in range(hard_count):
            questions.append({
                "topic": topic,
                "difficulty": np.random.uniform(0.7, 0.9) if not strict_ssc else 0.8,
                "type": "complex_problem",
                "marks": 2,
                "time_allocation": 90  # seconds
            })
        
        return questions
    
    def _get_ssc_instructions(self, section_name: str) -> List[str]:
        """Get authentic SSC CGL instructions for each section"""
        instructions = {
            "General Intelligence & Reasoning": [
                "This section contains 25 questions on logical reasoning",
                "Each question carries 2 marks",
                "0.5 marks will be deducted for each wrong answer",
                "Use logical thinking and pattern recognition"
            ],
            "General Awareness": [
                "This section tests your knowledge of current affairs and static GK",
                "Questions cover history, geography, politics, economics, and science",
                "Stay updated with recent developments",
                "Each question carries 2 marks with 0.5 negative marking"
            ],
            "Quantitative Aptitude": [
                "This section contains mathematical problems",
                "Focus on accuracy and speed",
                "Calculator is not allowed",
                "Each question carries 2 marks with 0.5 negative marking"
            ],
            "English Comprehension": [
                "This section tests English language skills",
                "Includes grammar, vocabulary, and comprehension",
                "Read questions carefully",
                "Each question carries 2 marks with 0.5 negative marking"
            ]
        }
        return instructions.get(section_name, [])
    
    def _get_general_ssc_instructions(self) -> List[str]:
        """Get general SSC CGL exam instructions"""
        return [
            "Total Duration: 60 minutes",
            "Total Questions: 100",
            "Total Marks: 200",
            "Each question carries 2 marks",
            "0.5 marks deducted for wrong answers",
            "No negative marking for unattempted questions",
            "Calculator not allowed",
            "Rough work can be done on provided sheets",
            "All questions are compulsory",
            "Choose the most appropriate answer"
        ]

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

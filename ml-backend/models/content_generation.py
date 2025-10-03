import openai
from typing import Dict, List, Any, Optional
import json
import random
import asyncio
from dataclasses import dataclass

@dataclass
class ContentRequest:
    concept: str
    user_profile: Dict[str, Any]
    performance_data: Dict[str, Any]
    content_type: str  # "explanation", "questions", "examples"

class ContentGenerationEngine:
    """
    AI-Powered Content Generation for SSC CGL
    Creates personalized explanations, questions, and examples
    """
    
    def __init__(self, openai_api_key: str):
        self.client = openai.Client(api_key=openai_api_key)
        self.ssc_context = self._load_ssc_context()
    
    def generate_personalized_explanation(
        self,
        concept: str,
        user_profile: Dict[str, Any],
        performance_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Generate personalized explanations based on user learning style and mistakes"""
        
        learning_style = user_profile.get('learning_style', 'mixed')
        mastery_level = performance_data.get('mastery_level', 1.0)
        common_mistakes = performance_data.get('common_mistakes', [])
        
        # Create personalized prompt
        prompt = self._create_explanation_prompt(
            concept, learning_style, mastery_level, common_mistakes
        )
        
        response = self.client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are an expert SSC CGL tutor who creates personalized explanations."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7
        )
        
        explanation = response.choices[0].message.content
        
        # Generate complementary content
        examples = self._generate_examples(concept, mastery_level)
        practice_questions = self._generate_practice_questions(concept, mastery_level)
        
        return {
            "explanation": explanation,
            "examples": examples,
            "practice_questions": practice_questions,
            "visual_aids": self._suggest_visual_aids(concept, learning_style),
            "memory_techniques": self._suggest_memory_techniques(concept),
            "difficulty_level": self._get_difficulty_description(mastery_level)
        }
    
    def generate_questions(
        self,
        topic: str,
        difficulty_level: float,
        question_type: str,
        count: int = 5
    ) -> List[Dict[str, Any]]:
        """Generate new SSC CGL questions for specific topics"""
        
        prompt = f"""
        Generate {count} high-quality SSC CGL {question_type} questions on {topic}.
        Difficulty level: {difficulty_level}/10
        
        Requirements:
        - Follow exact SSC CGL pattern and style
        - Ensure questions are exam-relevant
        - Provide 4 options with only one correct answer
        - Include detailed explanations
        - Match the difficulty level specified
        
        Format as JSON array with this structure:
        {{
            "question": "question text",
            "options": ["A", "B", "C", "D"],
            "correct_answer": "B",
            "explanation": "detailed solution",
            "difficulty": {difficulty_level},
            "tags": ["tag1", "tag2"],
            "time_allocation": 60
        }}
        """
        
        response = self.client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are an expert SSC CGL question creator with deep knowledge of exam patterns."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.8
        )
        
        try:
            questions = json.loads(response.choices[0].message.content)
            return self._validate_generated_questions(questions)
        except:
            return self._fallback_questions(topic, difficulty_level, count)
    
    def enhance_existing_explanation(
        self,
        existing_explanation: str,
        user_confusion_points: List[str],
        learning_preferences: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Enhance existing explanations based on user confusion"""
        
        prompt = f"""
        Improve this explanation based on user confusion:
        
        Original: {existing_explanation}
        
        User is confused about: {', '.join(user_confusion_points)}
        User prefers: {learning_preferences.get('style', 'step-by-step')}
        
        Create an enhanced explanation that:
        1. Addresses specific confusion points
        2. Uses preferred learning style
        3. Includes analogies and examples
        4. Provides step-by-step breakdown
        """
        
        response = self.client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are an expert tutor specializing in clearing conceptual confusion."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.6
        )
        
        return {
            "enhanced_explanation": response.choices[0].message.content,
            "confusion_addressed": user_confusion_points,
            "teaching_approach": learning_preferences.get('style', 'mixed')
        }
    
    def generate_adaptive_content(
        self,
        user_performance: Dict[str, Any],
        learning_goals: List[str],
        time_available: int  # minutes
    ) -> Dict[str, Any]:
        """Generate content adapted to user's current performance and goals"""
        
        weak_areas = user_performance.get('weak_areas', [])
        strong_areas = user_performance.get('strong_areas', [])
        learning_velocity = user_performance.get('learning_velocity', 1.0)
        
        content_plan = {
            "session_duration": time_available,
            "learning_objectives": learning_goals,
            "content_modules": []
        }
        
        # Allocate time based on priorities
        weak_area_time = int(time_available * 0.6)
        review_time = int(time_available * 0.3)
        challenge_time = time_available - weak_area_time - review_time
        
        # Generate content for weak areas
        for area in weak_areas[:2]:  # Focus on top 2 weak areas
            module_time = weak_area_time // len(weak_areas[:2])
            module = self._create_learning_module(area, module_time, "remedial")
            content_plan["content_modules"].append(module)
        
        # Generate review content for strong areas
        for area in strong_areas[:1]:  # Review 1 strong area
            module = self._create_learning_module(area, review_time, "review")
            content_plan["content_modules"].append(module)
        
        # Generate challenge content
        if challenge_time > 0:
            challenge_topics = self._select_challenge_topics(user_performance)
            module = self._create_learning_module(
                challenge_topics[0] if challenge_topics else weak_areas[0], 
                challenge_time, 
                "challenge"
            )
            content_plan["content_modules"].append(module)
        
        return content_plan
    
    def _create_explanation_prompt(
        self, 
        concept: str, 
        learning_style: str, 
        mastery_level: float,
        common_mistakes: List[str]
    ) -> str:
        
        style_instructions = {
            'visual': "Use diagrams, charts, and visual representations. Describe visual patterns.",
            'auditory': "Use rhythm, patterns, and verbal explanations. Include mnemonics.",
            'kinesthetic': "Use hands-on examples, real-world applications, and step-by-step actions.",
            'reading': "Provide detailed written explanations with bullet points and structured text."
        }
        
        level_instructions = {
            (0, 2): "Use very simple language, basic examples, fundamental concepts only",
            (2, 5): "Use moderate complexity, standard examples, build on basics", 
            (5, 8): "Use advanced concepts, complex examples, assume good foundation",
            (8, 10): "Use expert-level discussion, nuanced examples, advanced applications"
        }
        
        level_instruction = next(
            instruction for (low, high), instruction in level_instructions.items() 
            if low <= mastery_level < high
        )
        
        return f"""
        Explain {concept} for SSC CGL preparation.
        
        Learning Style: {style_instructions.get(learning_style, 'mixed approach')}
        Mastery Level: {level_instruction}
        Common Mistakes to Address: {', '.join(common_mistakes) if common_mistakes else 'None specified'}
        
        Requirements:
        - Make it highly relevant to SSC CGL exam
        - Address the common mistakes specifically
        - Use the preferred learning style
        - Include memory techniques
        - Provide practical exam tips
        - Keep it engaging and clear
        """
    
    def _generate_examples(self, concept: str, mastery_level: float) -> List[Dict[str, Any]]:
        """Generate examples appropriate for mastery level"""
        examples = []
        
        if mastery_level < 3.0:
            # Basic examples
            examples = [
                {"type": "basic", "complexity": "simple", "count": 3},
                {"type": "step_by_step", "complexity": "guided", "count": 2}
            ]
        elif mastery_level < 6.0:
            # Intermediate examples
            examples = [
                {"type": "application", "complexity": "moderate", "count": 3},
                {"type": "variation", "complexity": "standard", "count": 2}
            ]
        else:
            # Advanced examples
            examples = [
                {"type": "complex", "complexity": "challenging", "count": 2},
                {"type": "tricky", "complexity": "exam_level", "count": 3}
            ]
        
        return examples
    
    def _generate_practice_questions(self, concept: str, mastery_level: float) -> List[str]:
        """Generate practice question IDs based on mastery level"""
        if mastery_level < 3.0:
            return [f"{concept}_basic_{i}" for i in range(5)]
        elif mastery_level < 6.0:
            return [f"{concept}_medium_{i}" for i in range(4)]
        else:
            return [f"{concept}_advanced_{i}" for i in range(3)]
    
    def _suggest_visual_aids(self, concept: str, learning_style: str) -> List[str]:
        """Suggest appropriate visual aids"""
        if learning_style == 'visual':
            return ["concept_diagram", "flowchart", "mind_map", "infographic"]
        elif learning_style == 'kinesthetic':
            return ["interactive_demo", "hands_on_activity", "real_world_model"]
        else:
            return ["summary_chart", "key_points_diagram"]
    
    def _suggest_memory_techniques(self, concept: str) -> List[str]:
        """Suggest memory techniques for the concept"""
        techniques = [
            "acronym_method",
            "visualization",
            "story_method",
            "repetition_pattern",
            "association_technique"
        ]
        
        # Return 2-3 random techniques
        return random.sample(techniques, min(3, len(techniques)))
    
    def _get_difficulty_description(self, mastery_level: float) -> str:
        """Get human-readable difficulty description"""
        if mastery_level < 2.0:
            return "Beginner Level - Building Foundations"
        elif mastery_level < 5.0:
            return "Intermediate Level - Applying Concepts"
        elif mastery_level < 8.0:
            return "Advanced Level - Mastering Complexity"
        else:
            return "Expert Level - Achieving Excellence"
    
    def _validate_generated_questions(self, questions: List[Dict]) -> List[Dict[str, Any]]:
        """Validate and clean generated questions"""
        validated = []
        
        for q in questions:
            if all(key in q for key in ["question", "options", "correct_answer", "explanation"]):
                # Ensure proper format
                q["difficulty"] = float(q.get("difficulty", 5.0))
                q["time_allocation"] = int(q.get("time_allocation", 60))
                q["tags"] = q.get("tags", [])
                validated.append(q)
        
        return validated
    
    def _fallback_questions(self, topic: str, difficulty: float, count: int) -> List[Dict[str, Any]]:
        """Generate fallback questions if AI generation fails"""
        fallback = []
        
        for i in range(count):
            fallback.append({
                "question": f"Sample {topic} question {i+1}",
                "options": ["Option A", "Option B", "Option C", "Option D"],
                "correct_answer": "A",
                "explanation": f"This is a sample explanation for {topic}",
                "difficulty": difficulty,
                "tags": [topic, "sample"],
                "time_allocation": 60
            })
        
        return fallback
    
    def _create_learning_module(self, topic: str, duration: int, module_type: str) -> Dict[str, Any]:
        """Create a learning module for adaptive content"""
        return {
            "topic": topic,
            "duration_minutes": duration,
            "type": module_type,
            "activities": self._get_activities_for_type(module_type, duration),
            "learning_objectives": [f"Improve {topic} understanding", f"Practice {topic} problems"]
        }
    
    def _get_activities_for_type(self, module_type: str, duration: int) -> List[str]:
        """Get activities based on module type"""
        activities = {
            "remedial": ["concept_review", "basic_practice", "guided_examples"],
            "review": ["quick_recap", "mixed_practice", "speed_drill"],
            "challenge": ["advanced_problems", "exam_simulation", "time_pressure_practice"]
        }
        
        return activities.get(module_type, ["general_practice"])
    
    def _select_challenge_topics(self, user_performance: Dict[str, Any]) -> List[str]:
        """Select topics for challenge content"""
        strong_areas = user_performance.get('strong_areas', [])
        if strong_areas:
            return [strong_areas[0]]  # Challenge with strongest area
        
        # Fallback to general challenging topics
        return ["Advanced Mathematics", "Complex Reasoning", "Critical English"]
    
    def _load_ssc_context(self) -> Dict[str, Any]:
        """Load SSC CGL specific context and patterns"""
        return {
            "exam_pattern": "SSC CGL Tier-1",
            "question_types": ["MCQ", "Objective"],
            "time_per_question": 36,  # seconds
            "negative_marking": 0.25,
            "total_marks": 200,
            "passing_criteria": "Cutoff based",
            "key_topics": {
                "Mathematics": ["Arithmetic", "Algebra", "Geometry", "Statistics"],
                "Reasoning": ["Logical", "Analytical", "Non-verbal", "Verbal"],
                "English": ["Grammar", "Vocabulary", "Comprehension", "Error Detection"],
                "GK": ["Current Affairs", "Static GK", "Science", "History", "Geography"]
            }
        }


# Integration class for API endpoints
class ContentAPI:
    """API wrapper for content generation"""
    
    def __init__(self, content_engine: ContentGenerationEngine):
        self.engine = content_engine
    
    async def generate_explanation(self, request: ContentRequest) -> Dict[str, Any]:
        """Generate personalized explanation"""
        return self.engine.generate_personalized_explanation(
            request.concept,
            request.user_profile,
            request.performance_data
        )
    
    async def generate_questions(self, 
                               topic: str, 
                               difficulty: float, 
                               question_type: str, 
                               count: int) -> List[Dict[str, Any]]:
        """Generate questions for topic"""
        return self.engine.generate_questions(topic, difficulty, question_type, count)
    
    async def enhance_content(self, 
                            explanation: str, 
                            confusion_points: List[str], 
                            preferences: Dict[str, Any]) -> Dict[str, Any]:
        """Enhance existing content"""
        return self.engine.enhance_existing_explanation(
            explanation, confusion_points, preferences
        )
    
    async def adaptive_content_plan(self,
                                   performance: Dict[str, Any],
                                   goals: List[str],
                                   time_available: int) -> Dict[str, Any]:
        """Generate adaptive content plan"""
        return self.engine.generate_adaptive_content(performance, goals, time_available)
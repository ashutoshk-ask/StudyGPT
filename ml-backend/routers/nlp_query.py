from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional, Any
from models.content_generation import ContentGenerationEngine, ContentAPI
import logging
import os

router = APIRouter()
logger = logging.getLogger(__name__)

# Initialize content generation engine
try:
    openai_api_key = os.getenv("OPENAI_API_KEY", "your-openai-key-here")
    content_engine = ContentGenerationEngine(openai_api_key)
    content_api = ContentAPI(content_engine)
except Exception as e:
    logger.warning(f"Could not initialize content generation: {e}")
    content_engine = None
    content_api = None

class QueryRequest(BaseModel):
    query: str
    user_id: str
    context: Optional[Dict[str, Any]] = None

class ContentExplanationRequest(BaseModel):
    concept: str
    user_profile: Dict[str, Any]
    performance_data: Dict[str, Any]

class QuestionGenerationRequest(BaseModel):
    topic: str
    difficulty_level: float
    question_type: str
    count: int = 5

class EnhanceContentRequest(BaseModel):
    existing_explanation: str
    confusion_points: List[str]
    learning_preferences: Dict[str, Any]

class SimilaritySearchRequest(BaseModel):
    query: str
    type: str = "question_similarity"
    n_results: int = 5

@router.post("/generate-explanation")
async def generate_personalized_explanation(request: ContentExplanationRequest):
    """Generate AI-powered personalized explanations"""
    try:
        if not content_api:
            raise HTTPException(status_code=503, detail="Content generation service not available")
        
        explanation = await content_api.generate_explanation(request)
        
        return {
            "concept": request.concept,
            "personalized_explanation": explanation,
            "generation_method": "AI-Powered",
            "status": "success"
        }
    except Exception as e:
        logger.error(f"Generate explanation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate-questions")
async def generate_ssc_questions(request: QuestionGenerationRequest):
    """Generate new SSC CGL questions using AI"""
    try:
        if not content_api:
            raise HTTPException(status_code=503, detail="Content generation service not available")
        
        questions = await content_api.generate_questions(
            request.topic,
            request.difficulty_level,
            request.question_type,
            request.count
        )
        
        return {
            "topic": request.topic,
            "difficulty_level": request.difficulty_level,
            "question_type": request.question_type,
            "generated_questions": questions,
            "count": len(questions),
            "status": "success"
        }
    except Exception as e:
        logger.error(f"Generate questions error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/enhance-content")
async def enhance_existing_content(request: EnhanceContentRequest):
    """Enhance existing explanations based on user confusion"""
    try:
        if not content_api:
            raise HTTPException(status_code=503, detail="Content generation service not available")
        
        enhanced = await content_api.enhance_content(
            request.existing_explanation,
            request.confusion_points,
            request.learning_preferences
        )
        
        return {
            "original_explanation": request.existing_explanation,
            "enhanced_content": enhanced,
            "improvements_made": len(request.confusion_points),
            "status": "success"
        }
    except Exception as e:
        logger.error(f"Enhance content error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/adaptive-content-plan")
async def generate_adaptive_content_plan(
    user_performance: Dict[str, Any],
    learning_goals: List[str],
    time_available: int
):
    """Generate adaptive content plan based on performance and goals"""
    try:
        if not content_api:
            raise HTTPException(status_code=503, detail="Content generation service not available")
        
        content_plan = await content_api.adaptive_content_plan(
            user_performance,
            learning_goals,
            time_available
        )
        
        return {
            "content_plan": content_plan,
            "time_allocated": time_available,
            "learning_objectives": learning_goals,
            "status": "success"
        }
    except Exception as e:
        logger.error(f"Adaptive content plan error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/query")
async def process_nlp_query(request: QueryRequest):
    """Process natural language query with context"""
    try:
        # Enhanced NLP query processing with context
        response_data = {
            "query": request.query,
            "user_id": request.user_id,
            "intent": "general_query",  # Would be determined by NLP analysis
            "response": "Enhanced NLP query processing with contextual understanding",
            "context_used": request.context is not None,
            "suggestions": [
                "Try asking about specific SSC topics",
                "Ask for explanations of concepts",
                "Request practice questions"
            ]
        }
        
        # If content generation is available, try to provide better response
        if content_api and request.context:
            try:
                # Simple context-aware response
                if "explain" in request.query.lower():
                    response_data["intent"] = "explanation_request"
                    response_data["response"] = "I can help explain SSC CGL concepts. Please specify the topic you'd like me to explain."
                elif "question" in request.query.lower() or "practice" in request.query.lower():
                    response_data["intent"] = "question_request"
                    response_data["response"] = "I can generate practice questions. Please specify the topic and difficulty level."
            except Exception as inner_e:
                logger.warning(f"Enhanced processing failed: {inner_e}")
        
        return response_data
    except Exception as e:
        logger.error(f"NLP query processing error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/search-similar")
async def search_similar_content(request: SimilaritySearchRequest):
    """Search for semantically similar questions and content"""
    try:
        # Mock similarity search - in production, this would use vector embeddings
        similar_results = []
        
        if request.type == "question_similarity":
            # Mock similar questions
            similar_results = [
                {
                    "content": f"Similar question 1 to: {request.query}",
                    "similarity_score": 0.95,
                    "topic": "Mathematics",
                    "difficulty": 0.6
                },
                {
                    "content": f"Similar question 2 to: {request.query}",
                    "similarity_score": 0.87,
                    "topic": "Reasoning",
                    "difficulty": 0.5
                }
            ]
        elif request.type == "concept_similarity":
            # Mock similar concepts
            similar_results = [
                {
                    "concept": "Related concept 1",
                    "similarity_score": 0.92,
                    "explanation": "Brief explanation of related concept"
                }
            ]
        
        return {
            "query": request.query,
            "search_type": request.type,
            "similar_results": similar_results[:request.n_results],
            "total_found": len(similar_results),
            "status": "success"
        }
    except Exception as e:
        logger.error(f"Similarity search error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/content-templates/{topic}")
async def get_content_templates(topic: str):
    """Get content templates for specific SSC topics"""
    try:
        templates = {
            "mathematics": {
                "explanation_template": "Start with basic concept, provide formula, show step-by-step solution",
                "question_types": ["numerical", "word_problems", "data_interpretation"],
                "difficulty_progression": ["basic_calculation", "application", "complex_problem"]
            },
            "reasoning": {
                "explanation_template": "Identify pattern, explain logic, provide examples",
                "question_types": ["analogies", "classification", "series"],
                "difficulty_progression": ["simple_pattern", "complex_reasoning", "multi_step_logic"]
            },
            "english": {
                "explanation_template": "Grammar rule, examples, practice sentences",
                "question_types": ["grammar", "vocabulary", "comprehension"],
                "difficulty_progression": ["basic_grammar", "advanced_usage", "contextual_application"]
            },
            "general_awareness": {
                "explanation_template": "Background context, key facts, current relevance",
                "question_types": ["factual", "current_affairs", "analytical"],
                "difficulty_progression": ["basic_facts", "interconnections", "analysis"]
            }
        }
        
        template = templates.get(topic.lower(), {
            "explanation_template": "General explanation structure",
            "question_types": ["basic", "intermediate", "advanced"],
            "difficulty_progression": ["easy", "medium", "hard"]
        })
        
        return {
            "topic": topic,
            "template": template,
            "status": "success"
        }
    except Exception as e:
        logger.error(f"Get content templates error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

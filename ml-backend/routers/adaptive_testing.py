from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from models.irt_model import ItemResponseTheory, SSCAdaptiveTesting, TestType
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

irt_model = ItemResponseTheory()
ssc_adaptive = SSCAdaptiveTesting()
test_sessions = {}

class SSCTestRequest(BaseModel):
    test_type: str  # "full_mock_ssc", "learning_adaptive", "topic_wise", "sectional_mock"
    user_id: str
    user_mastery: Dict[str, float]
    customization: Optional[Dict[str, Any]] = None

class ItemParametersInput(BaseModel):
    item_id: str
    difficulty: float
    discrimination: float
    guessing: float

class ResponseInput(BaseModel):
    item_id: str
    is_correct: bool

class StartTestRequest(BaseModel):
    student_id: str
    test_id: str
    item_bank: List[str]

class SubmitResponseRequest(BaseModel):
    test_id: str
    item_id: str
    is_correct: bool

@router.post("/generate-ssc-test")
async def generate_ssc_test(request: SSCTestRequest):
    """
    Generate SSC CGL test based on type and user requirements
    """
    try:
        # Convert string to enum
        test_type_map = {
            "full_mock_ssc": TestType.FULL_MOCK_SSC,
            "learning_adaptive": TestType.LEARNING_ADAPTIVE,
            "topic_wise": TestType.TOPIC_WISE,
            "sectional_mock": TestType.SECTIONAL_MOCK
        }
        
        test_type = test_type_map.get(request.test_type)
        if not test_type:
            raise HTTPException(status_code=400, detail=f"Invalid test type: {request.test_type}")
        
        test_structure = ssc_adaptive.generate_test(
            test_type=test_type,
            user_id=request.user_id,
            user_mastery=request.user_mastery,
            customization=request.customization
        )
        
        # Store test session
        test_id = f"{request.user_id}_{request.test_type}_{len(test_sessions)}"
        test_sessions[test_id] = {
            "user_id": request.user_id,
            "test_type": request.test_type,
            "test_structure": test_structure,
            "started_at": None,
            "completed_at": None
        }
        
        return {
            "test_id": test_id,
            "test_structure": test_structure,
            "status": "generated"
        }
        
    except Exception as e:
        logger.error(f"Generate SSC test error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/ssc-pattern-info")
async def get_ssc_pattern_info():
    """
    Get official SSC CGL Tier-1 pattern information
    """
    try:
        pattern = ssc_adaptive.ssc_pattern
        
        return {
            "exam_pattern": "SSC CGL Tier-1",
            "total_questions": pattern.total_questions,
            "total_time_minutes": pattern.total_time_minutes,
            "sections": pattern.sections,
            "marking_scheme": {
                "correct_marks": 2,
                "negative_marks": -0.5,
                "total_marks": 200
            },
            "general_instructions": ssc_adaptive._get_general_ssc_instructions()
        }
    except Exception as e:
        logger.error(f"Get SSC pattern error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/mock-test/full-ssc")
async def generate_full_ssc_mock(user_id: str, user_mastery: Dict[str, float]):
    """
    Generate STRICT SSC CGL pattern mock test
    """
    try:
        test_structure = ssc_adaptive._generate_full_mock_ssc(user_mastery)
        
        test_id = f"full_mock_{user_id}_{len(test_sessions)}"
        test_sessions[test_id] = {
            "user_id": user_id,
            "test_type": "full_mock_ssc",
            "test_structure": test_structure,
            "started_at": None,
            "completed_at": None
        }
        
        return {
            "test_id": test_id,
            "message": "Strict SSC CGL Tier-1 Mock Test Generated",
            "test_details": {
                "total_questions": 100,
                "time_limit": "60 minutes", 
                "sections": 4,
                "marking": "+2 for correct, -0.5 for wrong",
                "pattern_compliance": "100% Official SSC Pattern"
            },
            "test_structure": test_structure
        }
    except Exception as e:
        logger.error(f"Generate full SSC mock error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/adaptive-test/learning")
async def generate_learning_adaptive_test(
    user_id: str, 
    user_mastery: Dict[str, float],
    customization: Optional[Dict[str, Any]] = None
):
    """
    Generate adaptive test for learning (not exam simulation)
    """
    try:
        test_structure = ssc_adaptive._generate_learning_adaptive(
            user_id, user_mastery, customization or {}
        )
        
        test_id = f"adaptive_learning_{user_id}_{len(test_sessions)}"
        test_sessions[test_id] = {
            "user_id": user_id,
            "test_type": "learning_adaptive",
            "test_structure": test_structure,
            "started_at": None,
            "completed_at": None
        }
        
        return {
            "test_id": test_id,
            "message": "Adaptive Learning Test Generated",
            "test_features": {
                "adaptive_difficulty": True,
                "immediate_feedback": True,
                "hint_system": True,
                "personalized_content": True
            },
            "test_structure": test_structure
        }
    except Exception as e:
        logger.error(f"Generate learning adaptive test error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/irt/set-item-parameters")
async def set_item_parameters(params: ItemParametersInput):
    """Set IRT parameters for an item"""
    try:
        irt_model.set_item_parameters(
            params.item_id,
            params.difficulty,
            params.discrimination,
            params.guessing
        )

        return {
            "item_id": params.item_id,
            "status": "parameters_set",
            "parameters": {
                "difficulty": params.difficulty,
                "discrimination": params.discrimination,
                "guessing": params.guessing
            }
        }
    except Exception as e:
        logger.error(f"Set item parameters error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/irt/estimate-ability")
async def estimate_ability(student_id: str, responses: List[ResponseInput]):
    """Estimate student ability using IRT"""
    try:
        response_tuples = [(r.item_id, r.is_correct) for r in responses]
        ability = irt_model.estimate_ability(response_tuples)

        return {
            "student_id": student_id,
            "estimated_ability": ability,
            "num_responses": len(responses)
        }
    except Exception as e:
        logger.error(f"Estimate ability error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/cat/start-test")
async def start_adaptive_test(request: StartTestRequest):
    """Start a new Computerized Adaptive Test"""
    try:
        cat = ComputerizedAdaptiveTesting(request.item_bank, irt_model)
        cat.start_test(request.student_id, request.test_id)
        cat_instances[request.test_id] = cat

        return {
            "test_id": request.test_id,
            "student_id": request.student_id,
            "status": "test_started",
            "item_bank_size": len(request.item_bank)
        }
    except Exception as e:
        logger.error(f"Start CAT error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/cat/next-item/{test_id}")
async def get_next_item(test_id: str):
    """Get next item for adaptive test"""
    try:
        if test_id not in cat_instances:
            raise HTTPException(status_code=404, detail="Test session not found")

        cat = cat_instances[test_id]
        next_item = cat.get_next_item(test_id)

        if not next_item:
            return {
                "test_id": test_id,
                "next_item": None,
                "message": "No more items available or test complete"
            }

        return {
            "test_id": test_id,
            "next_item_id": next_item
        }
    except Exception as e:
        logger.error(f"Get next item error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/cat/submit-response")
async def submit_response(request: SubmitResponseRequest):
    """Submit response and update ability estimate"""
    try:
        if request.test_id not in cat_instances:
            raise HTTPException(status_code=404, detail="Test session not found")

        cat = cat_instances[request.test_id]
        result = cat.submit_response(
            request.test_id,
            request.item_id,
            request.is_correct
        )

        should_terminate = cat.should_terminate(request.test_id)

        return {
            "test_id": request.test_id,
            "item_id": request.item_id,
            "result": result,
            "should_terminate": should_terminate
        }
    except Exception as e:
        logger.error(f"Submit response error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/cat/results/{test_id}")
async def get_test_results(test_id: str):
    """Get final test results"""
    try:
        if test_id not in cat_instances:
            raise HTTPException(status_code=404, detail="Test session not found")

        cat = cat_instances[test_id]
        results = cat.get_test_results(test_id)

        # Clean up
        del cat_instances[test_id]

        return results
    except Exception as e:
        logger.error(f"Get test results error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from models.irt_model import ItemResponseTheory, ComputerizedAdaptiveTesting
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

irt_model = ItemResponseTheory()
cat_instances = {}

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

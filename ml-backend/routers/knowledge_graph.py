from fastapi import APIRouter

router = APIRouter()

@router.get("/prerequisites/{concept_id}")
async def get_prerequisites(concept_id: str):
    """Get prerequisite concepts"""
    return {"prerequisites": []}

@router.get("/related-concepts/{concept_id}")
async def get_related_concepts(concept_id: str):
    """Get related concepts"""
    return {"related_concepts": []}

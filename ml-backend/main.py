from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
from config import get_settings

from routers import (
    knowledge_tracing,
    spaced_repetition,
    adaptive_testing,
    nlp_query,
    recommendations,
    analytics,
    knowledge_graph,
    emotional_intelligence
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

settings = get_settings()

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting ML Backend Service...")
    logger.info(f"API Version: {settings.API_VERSION}")

    yield

    logger.info("Shutting down ML Backend Service...")

app = FastAPI(
    title="SSC CGL AI/ML Backend",
    description="Advanced AI/ML/DL services for SSC CGL Study Buddy",
    version=settings.API_VERSION,
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {
        "service": "SSC CGL AI/ML Backend",
        "version": settings.API_VERSION,
        "status": "operational"
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "services": {
            "api": "operational",
            "ml_models": "ready",
            "database": "connected",
            "cache": "connected"
        }
    }

app.include_router(knowledge_tracing.router, prefix=f"/api/{settings.API_VERSION}/kt", tags=["Knowledge Tracing"])
app.include_router(spaced_repetition.router, prefix=f"/api/{settings.API_VERSION}/sr", tags=["Spaced Repetition"])
app.include_router(adaptive_testing.router, prefix=f"/api/{settings.API_VERSION}/adaptive", tags=["Adaptive Testing"])
app.include_router(nlp_query.router, prefix=f"/api/{settings.API_VERSION}/nlp", tags=["NLP Query"])
app.include_router(recommendations.router, prefix=f"/api/{settings.API_VERSION}/recommendations", tags=["AI Recommendations"])
app.include_router(analytics.router, prefix=f"/api/{settings.API_VERSION}/analytics", tags=["Advanced Analytics"])
app.include_router(knowledge_graph.router, prefix=f"/api/{settings.API_VERSION}/knowledge-graph", tags=["Knowledge Graph"])
app.include_router(emotional_intelligence.router, prefix=f"/api/{settings.API_VERSION}/emotional-intelligence", tags=["Emotional Intelligence"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        reload=True
    )

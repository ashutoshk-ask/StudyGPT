from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    """ML Backend Configuration"""

    # API Settings
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8001
    API_VERSION: str = "v1"

    # Database
    DATABASE_URL: str
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_DB: str = "ssc_cgl"
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = ""

    # Neo4j Knowledge Graph
    NEO4J_URI: str = "bolt://localhost:7687"
    NEO4J_USER: str = "neo4j"
    NEO4J_PASSWORD: str = "password"

    # Redis Cache
    REDIS_URL: str = "redis://localhost:6379"
    CACHE_TTL: int = 3600

    # ChromaDB
    CHROMA_PERSIST_DIR: str = "./chroma_db"

    # Model Paths
    MODEL_DIR: str = "./models"
    DKT_MODEL_PATH: str = "./models/dkt_model.pth"
    BKT_MODEL_PATH: str = "./models/bkt_model.pkl"
    PERFORMANCE_MODEL_PATH: str = "./models/performance_predictor.pkl"

    # ML Model Settings
    EMBEDDING_MODEL: str = "sentence-transformers/all-MiniLM-L6-v2"
    MAX_SEQUENCE_LENGTH: int = 50
    DKT_HIDDEN_SIZE: int = 128
    DKT_NUM_LAYERS: int = 2

    # Spaced Repetition
    SR_INITIAL_INTERVAL: int = 1
    SR_MAX_INTERVAL: int = 365
    SR_EASE_FACTOR: float = 2.5

    # Multi-Armed Bandit
    MAB_EPSILON: float = 0.1
    MAB_DECAY_RATE: float = 0.995

    # IRT Settings
    IRT_DEFAULT_DIFFICULTY: float = 0.0
    IRT_DEFAULT_DISCRIMINATION: float = 1.0
    IRT_DEFAULT_GUESSING: float = 0.25

    class Config:
        env_file = ".env"
        case_sensitive = True

@lru_cache()
def get_settings() -> Settings:
    return Settings()

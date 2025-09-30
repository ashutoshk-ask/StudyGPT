# SSC CGL AI/ML Backend

Advanced Machine Learning and Deep Learning backend for the SSC CGL Study Buddy application.

## Quick Start

### Docker (Recommended)

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f ml-backend

# Stop services
docker-compose down
```

### Manual Setup

```bash
# Install dependencies
pip install -r requirements.txt

# Start the server
python -m uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

## Features

### 1. Knowledge Tracing
- **Bayesian Knowledge Tracing (BKT)**: Probabilistic skill mastery tracking
- **Deep Knowledge Tracing (DKT)**: LSTM-based knowledge state prediction

### 2. Spaced Repetition
- **Adaptive SM-2+**: Personalized review scheduling
- **Session Optimization**: Maximize learning in available time

### 3. Adaptive Testing
- **IRT (Item Response Theory)**: Question difficulty estimation
- **CAT (Computerized Adaptive Testing)**: Dynamic test adaptation

### 4. Content Recommendations
- **Multi-Armed Bandit**: Optimal content selection
- **Contextual Bandits**: Context-aware recommendations

### 5. NLP & Semantic Search
- **Sentence Transformers**: Semantic question similarity
- **ChromaDB**: Vector database for fast search
- **Query Processing**: Natural language intent detection

### 6. Performance Prediction
- **XGBoost + LSTM**: Exam score prediction
- **Improvement Analysis**: Identify high-impact areas

### 7. Emotional Intelligence
- **State Detection**: Frustration, confusion, boredom detection
- **Adaptive Actions**: Dynamic difficulty adjustment
- **Engagement Tracking**: Real-time engagement scoring

## API Documentation

Once running, visit:
- API Docs: http://localhost:8001/docs
- Health Check: http://localhost:8001/health

## Architecture

```
FastAPI Application
├── models/              # ML/DL models
│   ├── bkt_model.py            # Bayesian Knowledge Tracing
│   ├── dkt_model.py            # Deep Knowledge Tracing
│   ├── spaced_repetition.py   # SM-2+ Algorithm
│   ├── irt_model.py            # Item Response Theory
│   ├── multi_armed_bandit.py  # MAB Recommendations
│   ├── nlp_engine.py           # NLP & Semantic Search
│   ├── performance_predictor.py # Performance Prediction
│   └── emotional_intelligence.py # Emotional State Detection
├── routers/             # API endpoints
│   ├── knowledge_tracing.py
│   ├── spaced_repetition.py
│   ├── adaptive_testing.py
│   ├── nlp_query.py
│   ├── recommendations.py
│   ├── analytics.py
│   ├── knowledge_graph.py
│   └── emotional_intelligence.py
├── services/            # Business logic
├── schemas/             # Request/response models
├── utils/               # Helper functions
├── config.py            # Configuration
└── main.py              # Application entry
```

## Technology Stack

- **FastAPI**: Modern Python web framework
- **PyTorch**: Deep learning framework (DKT, LSTM)
- **Scikit-learn**: Machine learning (XGBoost, preprocessing)
- **Sentence Transformers**: Text embeddings
- **ChromaDB**: Vector database
- **Redis**: Caching layer
- **Neo4j**: Knowledge graph (optional)

## Configuration

Environment variables (set in `.env` or docker-compose.yml):

```env
# API Configuration
API_HOST=0.0.0.0
API_PORT=8001

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/ssc_cgl

# Redis Cache
REDIS_URL=redis://localhost:6379
CACHE_TTL=3600

# Neo4j Knowledge Graph
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=password

# ChromaDB
CHROMA_PERSIST_DIR=./chroma_db

# Model Configuration
EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2
DKT_HIDDEN_SIZE=128
DKT_NUM_LAYERS=2
```

## Development

### Running Tests

```bash
# Install dev dependencies
pip install pytest pytest-asyncio

# Run tests
pytest

# With coverage
pytest --cov=. --cov-report=html
```

### Adding New Models

1. Create model in `models/`
2. Add router in `routers/`
3. Register router in `main.py`
4. Update documentation

### Code Style

```bash
# Format code
black .

# Lint
flake8 .
```

## Performance

### Caching

- ML predictions cached in Redis (default: 5 min TTL)
- Embeddings stored in ChromaDB
- Memoization for expensive operations

### Scaling

- Horizontal scaling: Run multiple instances behind load balancer
- Vertical scaling: Increase CPU/RAM for model inference
- Database: Use read replicas for analytics queries

### Benchmarks

Average response times (production setup):
- Knowledge Tracing: ~50ms
- Spaced Repetition: ~30ms
- Adaptive Testing: ~100ms
- NLP Query: ~200ms
- Performance Prediction: ~150ms

## Troubleshooting

### Service Won't Start

```bash
# Check logs
docker-compose logs ml-backend

# Verify Python version
python --version  # Should be 3.11+

# Check port availability
lsof -i :8001
```

### High Memory Usage

- Reduce model batch sizes in config
- Enable Redis caching
- Limit ChromaDB collection size

### Slow Predictions

- Enable Redis caching
- Use model quantization
- Consider GPU acceleration

## Monitoring

### Health Endpoints

```bash
# Application health
curl http://localhost:8001/health

# Detailed status
curl http://localhost:8001/
```

### Metrics

- Prometheus metrics: `/metrics`
- Request latency
- Cache hit rates
- Model inference times

## Security

- JWT authentication required for all endpoints
- Rate limiting enabled
- Input validation on all requests
- No PII stored in models
- Secure secrets management

## Contributing

1. Fork repository
2. Create feature branch
3. Add tests for new features
4. Ensure tests pass
5. Submit pull request

## License

Same as parent project.

## Support

For issues or questions:
- Check logs: `docker-compose logs ml-backend`
- Review documentation: `/docs/ML_IMPLEMENTATION_GUIDE.md`
- Open issue on GitHub

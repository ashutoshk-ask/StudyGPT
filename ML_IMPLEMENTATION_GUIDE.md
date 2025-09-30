# Advanced AI/ML/DL Implementation Guide

## Overview

This document describes the advanced AI/ML/DL features added to the SSC CGL Study Buddy application. All features are **additive** and **backward compatible** - the existing UI/UX remains completely unchanged.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                  React Frontend                      │
│              (No Changes Required)                   │
└────────────────────┬────────────────────────────────┘
                     │
                     │ Existing API
                     ├─────────────────────┐
                     │                     │
         ┌───────────▼──────────┐  ┌──────▼──────────┐
         │  Express Backend     │  │  ML-Enhanced    │
         │  (Existing Routes)   │  │  Routes (NEW)   │
         └───────────┬──────────┘  └─────────────────┘
                     │                     │
                     │             ┌───────▼──────────┐
                     │             │  ML Service      │
                     │             │  Client (NEW)    │
                     │             └───────┬──────────┘
                     │                     │
                     │             ┌───────▼──────────┐
                     │             │  FastAPI Python  │
                     │             │  ML Backend (NEW)│
                     │             └───────┬──────────┘
                     │                     │
         ┌───────────▼─────────────────────▼──────────┐
         │          PostgreSQL Database                │
         └─────────────────────────────────────────────┘
```

## Features Implemented

### 1. Knowledge Tracing

#### Bayesian Knowledge Tracing (BKT)
- **Location**: `ml-backend/models/bkt_model.py`
- **Purpose**: Probabilistically tracks student knowledge state
- **API Endpoints**:
  - `POST /api/ml/knowledge-tracing/mastery` - Predict skill mastery
  - `POST /api/ml/knowledge-tracing/weak-skills` - Identify weak skills

**How it works**: BKT uses Bayesian inference to update probability of knowledge after each question. It considers:
- Initial knowledge probability
- Learning rate
- Slip probability (knows but answers wrong)
- Guess probability (doesn't know but answers correct)

#### Deep Knowledge Tracing (DKT)
- **Location**: `ml-backend/models/dkt_model.py`
- **Purpose**: LSTM-based neural network for knowledge prediction
- **Features**:
  - Handles sequential learning interactions
  - Predicts mastery for multiple skills
  - Identifies weak areas automatically

### 2. Spaced Repetition System

#### Adaptive SM-2+ Algorithm
- **Location**: `ml-backend/models/spaced_repetition.py`
- **Purpose**: Optimizes review scheduling based on memory retention
- **API Endpoints**:
  - `POST /api/ml/spaced-repetition/schedule` - Schedule next review
  - `POST /api/ml/spaced-repetition/due-reviews` - Get prioritized reviews
  - `POST /api/ml/spaced-repetition/optimize-session` - Optimize study session

**Features**:
- Personalized learning rates
- Consistency-based adjustments
- Priority-based review scheduling
- Session time optimization

### 3. Adaptive Testing (IRT/CAT)

#### Item Response Theory
- **Location**: `ml-backend/models/irt_model.py`
- **Purpose**: Estimate question difficulty and student ability
- **Model**: 3-Parameter Logistic (3PL)

#### Computerized Adaptive Testing
- **Features**:
  - Dynamic difficulty adjustment
  - Ability estimation with confidence intervals
  - Optimal item selection
  - Early stopping criteria

**API Endpoints**:
- `POST /api/ml/adaptive-test/start` - Start adaptive test
- `GET /api/ml/adaptive-test/:testId/next-item` - Get next question
- `POST /api/ml/adaptive-test/:testId/submit` - Submit answer

### 4. Multi-Armed Bandit Recommendations

- **Location**: `ml-backend/models/multi_armed_bandit.py`
- **Algorithms**:
  - Epsilon-Greedy
  - Upper Confidence Bound (UCB)
  - Thompson Sampling
- **Purpose**: Balance exploration vs exploitation for content recommendations

### 5. NLP & Semantic Search

#### Semantic Search Engine
- **Location**: `ml-backend/models/nlp_engine.py`
- **Technology**: Sentence Transformers + ChromaDB
- **Features**:
  - Find similar questions
  - Concept search
  - Question difficulty estimation

#### Natural Language Query Processing
- **Features**:
  - Intent detection (explanation, example, practice, comparison)
  - Entity extraction
  - Context-aware responses

### 6. Performance Prediction

- **Location**: `ml-backend/models/performance_predictor.py`
- **Models**: XGBoost + LSTM ensemble
- **Predictions**:
  - Exam score prediction
  - Subject-wise performance
  - Improvement opportunities
  - Performance trends

**API Endpoints**:
- `POST /api/ml/analytics/predict-performance`
- `POST /api/ml/analytics/improvement-opportunities`

### 7. Emotional Intelligence Layer

- **Location**: `ml-backend/models/emotional_intelligence.py`
- **Purpose**: Detect student emotional states and adapt content
- **States Detected**:
  - Frustrated
  - Confused
  - Bored
  - Confident
  - Anxious
  - Engaged

**Adaptive Actions**:
- Adjust difficulty based on frustration
- Provide hints when confused
- Increase challenge when bored
- Suggest breaks when anxious

**API Endpoints**:
- `POST /api/ml/emotional-intelligence/analyze`
- `GET /api/ml/emotional-intelligence/engagement`

## Deployment

### Option 1: Docker Deployment (Recommended)

```bash
cd ml-backend
docker-compose up -d
```

This starts:
- ML Backend (FastAPI) on port 8001
- Redis (caching) on port 6379
- Neo4j (knowledge graph) on ports 7474/7687

### Option 2: Manual Deployment

```bash
# Install Python dependencies
cd ml-backend
pip install -r requirements.txt

# Start services
python -m uvicorn main:app --host 0.0.0.0 --port 8001
```

### Environment Variables

Add to your `.env` file:

```env
ML_SERVICE_URL=http://localhost:8001
```

## Integration with Existing Code

### Backward Compatibility

**All existing routes work exactly as before**. The ML features are additive:

- Existing routes: `/api/*` - unchanged
- New ML routes: `/api/ml/*` - new functionality

### Fallback Mechanism

All ML services have automatic fallbacks:

```typescript
// If ML service is unavailable, fallback to basic algorithms
const mastery = await mlService.predictMasteryDKT(userId, interactions, skillId);

if (mastery === null) {
  // Fallback: use simple average
  return calculateSimpleMastery(interactions);
}
```

### Caching

Expensive ML operations are cached:
- Knowledge tracing predictions: 5 minutes
- Engagement scores: 2 minutes
- Recommendations: configurable

## Usage Examples

### Example 1: Knowledge Tracing

```typescript
// Frontend makes existing API call (no changes)
// Backend optionally enhances with ML

const interactions = [
  { skill_id: 1, correct: true },
  { skill_id: 1, correct: false },
  { skill_id: 2, correct: true }
];

// New ML endpoint (optional)
const response = await fetch('/api/ml/knowledge-tracing/mastery', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ interactions, skillId: 1 })
});

const { mastery, source } = await response.json();
// source: "dkt_model" or "fallback"
```

### Example 2: Spaced Repetition

```typescript
// Get optimized review schedule
const response = await fetch('/api/ml/spaced-repetition/due-reviews', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    reviewItems: [...],
    maxItems: 20
  })
});

const { dueReviews, source } = await response.json();
// Returns prioritized list of topics to review
```

### Example 3: Performance Prediction

```typescript
// Predict exam performance
const response = await fetch('/api/ml/analytics/predict-performance', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userData: {
      recent_quiz_scores: [75, 80, 85, 78],
      total_study_hours: 120,
      study_consistency: 0.85,
      subject_scores: { math: 75, reasoning: 80, english: 85, gs: 70 }
    }
  })
});

const { prediction } = await response.json();
// { predicted_score: 78.5, confidence: 0.85, confidence_interval: [75, 82] }
```

## Monitoring & Observability

### Health Check

```bash
curl http://localhost:8001/health
```

### ML Service Status

```bash
curl http://localhost:5000/api/ml/status
```

Response:
```json
{
  "mlService": {
    "available": true,
    "baseURL": "http://localhost:8001"
  },
  "features": {
    "knowledgeTracing": true,
    "spacedRepetition": true,
    "adaptiveTesting": true,
    "performancePrediction": true,
    "emotionalIntelligence": true,
    "nlpQuery": true,
    "contentRecommendations": true,
    "knowledgeGraph": true
  }
}
```

## Performance Considerations

### Caching Strategy

- **Redis**: Cache ML predictions with TTL
- **Memoization**: Cache frequently accessed data in Node.js
- **ChromaDB**: Persistent vector store for semantic search

### Scaling

- ML backend can run multiple instances
- Load balance with nginx/traefik
- Separate read replicas for database

### Resource Usage

Estimated resource requirements:
- **ML Backend**: 2GB RAM, 1 CPU core
- **Redis**: 512MB RAM
- **Neo4j**: 1GB RAM, 1 CPU core
- **Total**: ~4GB RAM, 2-3 CPU cores

## Security

- All ML endpoints require authentication
- Rate limiting on ML requests
- Input validation on all endpoints
- No PII stored in ML models

## Testing

```bash
# Test ML backend
cd ml-backend
pytest

# Test integration
cd ..
npm test
```

## Troubleshooting

### ML Service Not Starting

```bash
# Check logs
docker logs ssc-cgl-ml-backend

# Verify ports
netstat -tulpn | grep 8001
```

### Predictions Failing

```bash
# Check ML service status
curl http://localhost:8001/health

# Application falls back to basic algorithms automatically
```

### High Latency

- Check Redis cache hit rate
- Verify network latency between services
- Consider increasing cache TTL
- Use memoization for frequent calls

## Future Enhancements

Planned features:
- [ ] Collaborative filtering for peer recommendations
- [ ] Advanced knowledge graph with Neo4j
- [ ] Real-time learning analytics dashboard
- [ ] Multimodal content generation (audio, video)
- [ ] Question generation system
- [ ] Cross-platform synchronization

## Support

For issues or questions:
1. Check ML service logs: `docker logs ssc-cgl-ml-backend`
2. Verify configuration in `.env`
3. Ensure all services are running: `docker-compose ps`

## License

Same as main application license.

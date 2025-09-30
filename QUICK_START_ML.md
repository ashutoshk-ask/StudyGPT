# Quick Start: AI/ML Features

## 🚀 Get Started in 5 Minutes

### Option 1: With ML Features (Recommended)

```bash
# 1. Start ML Backend (in a new terminal)
cd ml-backend
docker-compose up -d

# 2. Verify ML Backend is running
curl http://localhost:8001/health

# 3. Start main application
npm run dev

# 4. Check ML integration status
curl http://localhost:5000/api/ml/status
```

### Option 2: Without ML Features (Existing App)

```bash
# Just start the app as before
npm run dev

# ML features will gracefully fall back to basic algorithms
```

## ✅ Verify Installation

### Check ML Backend
```bash
# Health check
curl http://localhost:8001/health

# Should return:
# {"status":"healthy","services":{"api":"operational",...}}
```

### Check ML Integration
```bash
# Status endpoint
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/ml/status

# Should return feature availability
```

## 📖 Quick Examples

### Example 1: Predict Skill Mastery

```typescript
// Frontend or backend code
const response = await fetch('/api/ml/knowledge-tracing/mastery', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    interactions: [
      { skill_id: 1, correct: true },
      { skill_id: 1, correct: false },
      { skill_id: 1, correct: true }
    ],
    skillId: 1
  })
});

const { mastery, source } = await response.json();
console.log(`Mastery: ${mastery} (from ${source})`);
```

### Example 2: Get Personalized Study Schedule

```typescript
const response = await fetch('/api/ml/spaced-repetition/due-reviews', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    reviewItems: [
      {
        topic_id: "math-algebra",
        last_review_date: "2025-01-01T10:00:00Z",
        next_review_date: "2025-01-05T10:00:00Z",
        ease_factor: 2.5,
        importance: 1.0
      }
    ],
    maxItems: 20
  })
});

const { dueReviews } = await response.json();
console.log('Priority topics to review:', dueReviews);
```

### Example 3: Predict Exam Performance

```typescript
const response = await fetch('/api/ml/analytics/predict-performance', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userData: {
      recent_quiz_scores: [75, 80, 85, 78, 82],
      total_study_hours: 120,
      study_consistency: 0.85,
      subject_scores: {
        mathematics: 75,
        reasoning: 80,
        english: 85,
        general_studies: 70
      },
      days_until_exam: 30
    }
  })
});

const { prediction } = await response.json();
console.log(`Predicted Score: ${prediction.predicted_score}%`);
console.log(`Confidence: ${prediction.confidence * 100}%`);
```

## 🛠️ Troubleshooting

### ML Backend Won't Start

```bash
# Check Docker logs
docker-compose logs ml-backend

# Common issues:
# 1. Port 8001 already in use
sudo lsof -i :8001

# 2. Docker not running
sudo systemctl start docker

# 3. Python dependencies missing (if running without Docker)
pip install -r requirements.txt
```

### API Returns "ML service unavailable"

**This is normal!** The app automatically falls back to basic algorithms.

To enable ML features:
1. Ensure ML backend is running: `docker-compose ps`
2. Check connectivity: `curl http://localhost:8001/health`
3. Restart Express server to reconnect

### High Memory Usage

```bash
# Check resource usage
docker stats

# Reduce memory if needed (edit docker-compose.yml)
services:
  ml-backend:
    mem_limit: 2g
```

## 📚 What's Different?

### Before (Still Works!)
```typescript
// Your existing code works exactly the same
const user = await fetch('/api/user').then(r => r.json());
const quizzes = await fetch('/api/quizzes').then(r => r.json());
// ... everything else unchanged
```

### After (Optional Enhancements)
```typescript
// NEW: Additional ML endpoints available
const mastery = await fetch('/api/ml/knowledge-tracing/mastery', {...});
const schedule = await fetch('/api/ml/spaced-repetition/schedule', {...});
const prediction = await fetch('/api/ml/analytics/predict-performance', {...});

// OLD endpoints still work identically
const user = await fetch('/api/user').then(r => r.json());
```

## 🎯 Key Points

1. **No Code Changes Required** - Existing app works as-is
2. **Optional Features** - ML backend is optional, not required
3. **Automatic Fallbacks** - Graceful degradation if ML unavailable
4. **Zero UI Changes** - Frontend unchanged
5. **Progressive Enhancement** - Add ML features gradually

## 📊 Monitor Performance

```bash
# ML Backend logs
docker-compose logs -f ml-backend

# Check response times
curl -w "@curl-format.txt" http://localhost:8001/health

# Redis cache stats
docker exec -it ssc-cgl-redis redis-cli INFO stats
```

## 🔄 Start/Stop ML Backend

```bash
# Start
docker-compose up -d

# Stop
docker-compose down

# Restart
docker-compose restart

# View status
docker-compose ps
```

## 📝 Next Steps

1. **Explore API Docs**: Visit http://localhost:8001/docs
2. **Read Full Guide**: See `ML_IMPLEMENTATION_GUIDE.md`
3. **Try Examples**: Test the endpoints above
4. **Monitor**: Check logs and metrics
5. **Extend**: Add custom ML models in `ml-backend/models/`

## 💡 Tips

- ML backend can be added/removed anytime without breaking the app
- Start with ML backend off, enable when ready
- All ML features have fallbacks to basic algorithms
- Cache results in Redis for better performance
- Scale ML backend independently from main app

## 🆘 Need Help?

1. Check logs: `docker-compose logs ml-backend`
2. Review documentation: `ML_IMPLEMENTATION_GUIDE.md`
3. Test health: `curl http://localhost:8001/health`
4. Verify integration: `curl http://localhost:5000/api/ml/status`

## ✨ Summary

- **Install**: `cd ml-backend && docker-compose up -d`
- **Start App**: `npm run dev`
- **Check Status**: `curl http://localhost:5000/api/ml/status`
- **Use Features**: New endpoints at `/api/ml/*`
- **Optional**: Works without ML backend (automatic fallbacks)

Enjoy your AI-powered learning platform! 🎓

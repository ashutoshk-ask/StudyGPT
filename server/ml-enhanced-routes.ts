import { Router } from "express";
import mlService from "./ml-service";

/**
 * ML-Enhanced Routes
 * Additional endpoints that leverage advanced ML/AI features
 * These are additive and don't modify existing functionality
 */

const router = Router();

function isAuthenticated(req: any, res: any, next: any) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
}

// Knowledge Tracing Endpoints
router.post("/api/ml/knowledge-tracing/mastery", isAuthenticated, async (req: any, res) => {
  try {
    const { interactions, skillId } = req.body;
    const userId = req.user.id;

    const mastery = await mlService.predictMasteryDKT(userId, interactions, skillId);

    if (mastery === null) {
      return res.json({
        mastery: 0.5,
        source: "fallback",
        message: "ML service unavailable"
      });
    }

    res.json({
      mastery,
      source: "dkt_model",
      skillId
    });
  } catch (error) {
    console.error("ML mastery prediction error:", error);
    res.status(500).json({ message: "Failed to predict mastery" });
  }
});

router.post("/api/ml/knowledge-tracing/weak-skills", isAuthenticated, async (req: any, res) => {
  try {
    const { interactions, threshold = 0.6 } = req.body;
    const userId = req.user.id;

    const weakSkills = await mlService.getWeakSkillsDKT(userId, interactions, threshold);

    res.json({
      weakSkills: weakSkills || [],
      source: weakSkills ? "dkt_model" : "fallback"
    });
  } catch (error) {
    console.error("ML weak skills error:", error);
    res.status(500).json({ message: "Failed to identify weak skills" });
  }
});

// Spaced Repetition Endpoints
router.post("/api/ml/spaced-repetition/schedule", isAuthenticated, async (req: any, res) => {
  try {
    const { topicId, currentState, quality } = req.body;
    const userId = req.user.id;

    const nextState = await mlService.scheduleReview(userId, topicId, currentState, quality);

    if (!nextState) {
      // Fallback: basic SM-2 calculation
      const interval = currentState.interval || 1;
      const nextInterval = quality >= 3 ? Math.ceil(interval * 2.5) : 1;

      return res.json({
        nextInterval,
        nextReviewDate: new Date(Date.now() + nextInterval * 24 * 60 * 60 * 1000),
        source: "fallback"
      });
    }

    res.json({
      ...nextState,
      source: "ml_service"
    });
  } catch (error) {
    console.error("ML schedule review error:", error);
    res.status(500).json({ message: "Failed to schedule review" });
  }
});

router.post("/api/ml/spaced-repetition/due-reviews", isAuthenticated, async (req: any, res) => {
  try {
    const { reviewItems, maxItems = 50 } = req.body;

    const dueReviews = await mlService.getDueReviews(reviewItems, maxItems);

    res.json({
      dueReviews: dueReviews || reviewItems.slice(0, maxItems),
      source: dueReviews ? "ml_service" : "fallback"
    });
  } catch (error) {
    console.error("ML due reviews error:", error);
    res.status(500).json({ message: "Failed to get due reviews" });
  }
});

router.post("/api/ml/spaced-repetition/optimize-session", isAuthenticated, async (req: any, res) => {
  try {
    const { availableMinutes, reviewItems } = req.body;

    const optimized = await mlService.optimizeStudySession(availableMinutes, reviewItems);

    res.json({
      optimizedItems: optimized || reviewItems.slice(0, Math.floor(availableMinutes / 5)),
      source: optimized ? "ml_service" : "fallback"
    });
  } catch (error) {
    console.error("ML optimize session error:", error);
    res.status(500).json({ message: "Failed to optimize session" });
  }
});

// Adaptive Testing Endpoints
router.post("/api/ml/adaptive-test/start", isAuthenticated, async (req: any, res) => {
  try {
    const { testId, itemBank } = req.body;
    const studentId = req.user.id;

    const result = await mlService.startAdaptiveTest(studentId, testId, itemBank);

    res.json({
      result: result || { status: "fallback_mode" },
      source: result ? "ml_service" : "fallback"
    });
  } catch (error) {
    console.error("ML start adaptive test error:", error);
    res.status(500).json({ message: "Failed to start adaptive test" });
  }
});

router.get("/api/ml/adaptive-test/:testId/next-item", isAuthenticated, async (req: any, res) => {
  try {
    const { testId } = req.params;

    const nextItem = await mlService.getNextAdaptiveItem(testId);

    res.json({
      nextItemId: nextItem,
      source: nextItem ? "ml_service" : "fallback"
    });
  } catch (error) {
    console.error("ML next item error:", error);
    res.status(500).json({ message: "Failed to get next item" });
  }
});

router.post("/api/ml/adaptive-test/:testId/submit", isAuthenticated, async (req: any, res) => {
  try {
    const { testId } = req.params;
    const { itemId, isCorrect } = req.body;

    const result = await mlService.submitAdaptiveResponse(testId, itemId, isCorrect);

    res.json({
      result: result || { message: "Response recorded in fallback mode" },
      source: result ? "ml_service" : "fallback"
    });
  } catch (error) {
    console.error("ML submit response error:", error);
    res.status(500).json({ message: "Failed to submit response" });
  }
});

// Performance Prediction Endpoints
router.post("/api/ml/analytics/predict-performance", isAuthenticated, async (req: any, res) => {
  try {
    const { userData } = req.body;
    const userId = req.user.id;

    const prediction = await mlService.predictPerformance(userId, userData);

    res.json({
      prediction: prediction || {
        predicted_score: 50,
        confidence: 0.5,
        source: "fallback"
      }
    });
  } catch (error) {
    console.error("ML performance prediction error:", error);
    res.status(500).json({ message: "Failed to predict performance" });
  }
});

router.post("/api/ml/analytics/improvement-opportunities", isAuthenticated, async (req: any, res) => {
  try {
    const { userData } = req.body;
    const userId = req.user.id;

    const opportunities = await mlService.getImprovementOpportunities(userId, userData);

    res.json({
      opportunities: opportunities || [],
      source: opportunities ? "ml_service" : "fallback"
    });
  } catch (error) {
    console.error("ML improvement opportunities error:", error);
    res.status(500).json({ message: "Failed to get improvement opportunities" });
  }
});

// Emotional Intelligence Endpoints
router.post("/api/ml/emotional-intelligence/analyze", isAuthenticated, async (req: any, res) => {
  try {
    const { recentInteractions } = req.body;
    const userId = req.user.id;

    const analysis = await mlService.analyzeEmotionalState(userId, recentInteractions);

    res.json({
      analysis: analysis || {
        emotional_state: "unknown",
        confidence: 0,
        recommendations: []
      },
      source: analysis ? "ml_service" : "fallback"
    });
  } catch (error) {
    console.error("ML emotional analysis error:", error);
    res.status(500).json({ message: "Failed to analyze emotional state" });
  }
});

router.get("/api/ml/emotional-intelligence/engagement", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id;

    const engagementScore = await mlService.getEngagementScore(userId);

    res.json({
      engagementScore: engagementScore || 50.0,
      source: engagementScore ? "ml_service" : "fallback"
    });
  } catch (error) {
    console.error("ML engagement score error:", error);
    res.status(500).json({ message: "Failed to get engagement score" });
  }
});

// NLP Query Endpoints
router.post("/api/ml/nlp/query", isAuthenticated, async (req: any, res) => {
  try {
    const { query } = req.body;
    const userId = req.user.id;

    const response = await mlService.processNLPQuery(userId, query);

    res.json({
      response: response || { message: "NLP service unavailable" },
      source: response ? "ml_service" : "fallback"
    });
  } catch (error) {
    console.error("ML NLP query error:", error);
    res.status(500).json({ message: "Failed to process query" });
  }
});

// Content Recommendation Endpoints
router.post("/api/ml/recommendations/content", isAuthenticated, async (req: any, res) => {
  try {
    const { userProfile, context } = req.body;
    const userId = req.user.id;

    const recommendations = await mlService.getContentRecommendations(userId, userProfile, context);

    res.json({
      recommendations: recommendations || [],
      source: recommendations ? "ml_service" : "fallback"
    });
  } catch (error) {
    console.error("ML content recommendations error:", error);
    res.status(500).json({ message: "Failed to get recommendations" });
  }
});

router.post("/api/ml/recommendations/feedback", isAuthenticated, async (req: any, res) => {
  try {
    const { contentId, engagementScore } = req.body;
    const userId = req.user.id;

    await mlService.updateRecommendationFeedback(userId, contentId, engagementScore);

    res.json({ status: "feedback_recorded" });
  } catch (error) {
    console.error("ML recommendation feedback error:", error);
    res.status(500).json({ message: "Failed to record feedback" });
  }
});

// Knowledge Graph Endpoints
router.get("/api/ml/knowledge-graph/prerequisites/:conceptId", isAuthenticated, async (req, res) => {
  try {
    const { conceptId } = req.params;

    const prerequisites = await mlService.getPrerequisites(conceptId);

    res.json({
      prerequisites: prerequisites || [],
      source: prerequisites ? "ml_service" : "fallback"
    });
  } catch (error) {
    console.error("ML prerequisites error:", error);
    res.status(500).json({ message: "Failed to get prerequisites" });
  }
});

router.get("/api/ml/knowledge-graph/related/:conceptId", isAuthenticated, async (req, res) => {
  try {
    const { conceptId } = req.params;

    const relatedConcepts = await mlService.getRelatedConcepts(conceptId);

    res.json({
      relatedConcepts: relatedConcepts || [],
      source: relatedConcepts ? "ml_service" : "fallback"
    });
  } catch (error) {
    console.error("ML related concepts error:", error);
    res.status(500).json({ message: "Failed to get related concepts" });
  }
});

// ML Service Status
router.get("/api/ml/status", isAuthenticated, async (req, res) => {
  try {
    const status = mlService.getServiceStatus();

    res.json({
      mlService: status,
      features: {
        knowledgeTracing: status.available,
        spacedRepetition: status.available,
        adaptiveTesting: status.available,
        performancePrediction: status.available,
        emotionalIntelligence: status.available,
        nlpQuery: status.available,
        contentRecommendations: status.available,
        knowledgeGraph: status.available
      }
    });
  } catch (error) {
    console.error("ML status check error:", error);
    res.status(500).json({ message: "Failed to check ML service status" });
  }
});

export default router;

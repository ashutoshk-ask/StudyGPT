import axios, { AxiosInstance } from 'axios';
import memoize from 'memoizee';

/**
 * ML Service Integration Layer
 * Communicates with Python ML backend without changing existing APIs
 */

interface MLServiceConfig {
  baseURL: string;
  timeout: number;
  retryAttempts: number;
}

const DEFAULT_CONFIG: MLServiceConfig = {
  baseURL: process.env.ML_SERVICE_URL || 'http://localhost:8001',
  timeout: 10000,
  retryAttempts: 3
};

class MLServiceClient {
  private client: AxiosInstance;
  private isAvailable: boolean = false;

  constructor(config: MLServiceConfig = DEFAULT_CONFIG) {
    this.client = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    this.checkAvailability();
  }

  private async checkAvailability() {
    try {
      await this.client.get('/health');
      this.isAvailable = true;
      console.log('✅ ML Service is available');
    } catch (error) {
      this.isAvailable = false;
      console.log('⚠️  ML Service is not available - using fallbacks');
    }
  }

  /**
   * Knowledge Tracing - DKT
   */
  async predictMasteryDKT(
    userId: string,
    interactions: any[],
    skillId: number
  ): Promise<number | null> {
    if (!this.isAvailable) return null;

    try {
      const response = await this.client.post('/api/v1/kt/dkt/predict-mastery', {
        user_id: userId,
        interactions,
        skill_id: skillId
      });
      return response.data.mastery_probability;
    } catch (error) {
      console.error('DKT prediction error:', error);
      return null;
    }
  }

  async getWeakSkillsDKT(
    userId: string,
    interactions: any[],
    threshold: number = 0.6
  ): Promise<number[] | null> {
    if (!this.isAvailable) return null;

    try {
      const response = await this.client.post(
        `/api/v1/kt/dkt/weak-skills?threshold=${threshold}`,
        {
          user_id: userId,
          interactions
        }
      );
      return response.data.weak_skills;
    } catch (error) {
      console.error('DKT weak skills error:', error);
      return null;
    }
  }

  /**
   * Knowledge Tracing - BKT
   */
  async processInteractionHistoryBKT(
    userId: string,
    interactions: any[]
  ): Promise<Record<number, number> | null> {
    if (!this.isAvailable) return null;

    try {
      const response = await this.client.post('/api/v1/kt/bkt/process-history', {
        user_id: userId,
        interactions
      });
      return response.data.skill_states;
    } catch (error) {
      console.error('BKT processing error:', error);
      return null;
    }
  }

  /**
   * Spaced Repetition
   */
  async scheduleReview(
    userId: string,
    topicId: string,
    currentState: any,
    quality: number
  ): Promise<any | null> {
    if (!this.isAvailable) return null;

    try {
      const response = await this.client.post('/api/v1/sr/schedule-review', {
        user_id: userId,
        topic_id: topicId,
        current_state: currentState,
        quality
      });
      return response.data.next_state;
    } catch (error) {
      console.error('Schedule review error:', error);
      return null;
    }
  }

  async getDueReviews(
    reviewItems: any[],
    maxItems: number = 50
  ): Promise<any[] | null> {
    if (!this.isAvailable) return null;

    try {
      const response = await this.client.post('/api/v1/sr/due-reviews', reviewItems, {
        params: { max_items: maxItems }
      });
      return response.data.due_reviews;
    } catch (error) {
      console.error('Due reviews error:', error);
      return null;
    }
  }

  async optimizeStudySession(
    availableMinutes: number,
    reviewItems: any[]
  ): Promise<any[] | null> {
    if (!this.isAvailable) return null;

    try {
      const response = await this.client.post('/api/v1/sr/optimize-session', {
        available_minutes: availableMinutes,
        review_items: reviewItems
      });
      return response.data.optimized_items;
    } catch (error) {
      console.error('Optimize session error:', error);
      return null;
    }
  }

  /**
   * Adaptive Testing (IRT/CAT)
   */
  async startAdaptiveTest(
    studentId: string,
    testId: string,
    itemBank: string[]
  ): Promise<any | null> {
    if (!this.isAvailable) return null;

    try {
      const response = await this.client.post('/api/v1/adaptive/cat/start-test', {
        student_id: studentId,
        test_id: testId,
        item_bank: itemBank
      });
      return response.data;
    } catch (error) {
      console.error('Start adaptive test error:', error);
      return null;
    }
  }

  async getNextAdaptiveItem(testId: string): Promise<string | null> {
    if (!this.isAvailable) return null;

    try {
      const response = await this.client.get(`/api/v1/adaptive/cat/next-item/${testId}`);
      return response.data.next_item_id;
    } catch (error) {
      console.error('Get next item error:', error);
      return null;
    }
  }

  async submitAdaptiveResponse(
    testId: string,
    itemId: string,
    isCorrect: boolean
  ): Promise<any | null> {
    if (!this.isAvailable) return null;

    try {
      const response = await this.client.post('/api/v1/adaptive/cat/submit-response', {
        test_id: testId,
        item_id: itemId,
        is_correct: isCorrect
      });
      return response.data;
    } catch (error) {
      console.error('Submit response error:', error);
      return null;
    }
  }

  /**
   * Performance Prediction
   */
  async predictPerformance(userId: string, userData: any): Promise<any | null> {
    if (!this.isAvailable) return null;

    try {
      const response = await this.client.post('/api/v1/analytics/predict-performance', {
        user_id: userId,
        user_data: userData
      });
      return response.data;
    } catch (error) {
      console.error('Performance prediction error:', error);
      return null;
    }
  }

  async getImprovementOpportunities(userId: string, userData: any): Promise<any[] | null> {
    if (!this.isAvailable) return null;

    try {
      const response = await this.client.post('/api/v1/analytics/improvement-opportunities', {
        user_id: userId,
        user_data: userData
      });
      return response.data.opportunities;
    } catch (error) {
      console.error('Improvement opportunities error:', error);
      return null;
    }
  }

  /**
   * Emotional Intelligence
   */
  async analyzeEmotionalState(
    userId: string,
    recentInteractions: any[]
  ): Promise<any | null> {
    if (!this.isAvailable) return null;

    try {
      const response = await this.client.post('/api/v1/emotional-intelligence/analyze', {
        user_id: userId,
        recent_interactions: recentInteractions
      });
      return response.data;
    } catch (error) {
      console.error('Emotional analysis error:', error);
      return null;
    }
  }

  async getEngagementScore(userId: string): Promise<number | null> {
    if (!this.isAvailable) return null;

    try {
      const response = await this.client.get(`/api/v1/emotional-intelligence/engagement-score/${userId}`);
      return response.data.engagement_score;
    } catch (error) {
      console.error('Engagement score error:', error);
      return null;
    }
  }

  /**
   * NLP Query Processing
   */
  async processNLPQuery(userId: string, query: string): Promise<any | null> {
    if (!this.isAvailable) return null;

    try {
      const response = await this.client.post('/api/v1/nlp/query', {
        user_id: userId,
        query
      });
      return response.data;
    } catch (error) {
      console.error('NLP query error:', error);
      return null;
    }
  }

  /**
   * Multi-Armed Bandit Recommendations
   */
  async getContentRecommendations(
    userId: string,
    userProfile: any,
    context: any
  ): Promise<any[] | null> {
    if (!this.isAvailable) return null;

    try {
      const response = await this.client.post('/api/v1/recommendations/content', {
        user_id: userId,
        user_profile: userProfile,
        context
      });
      return response.data.recommendations;
    } catch (error) {
      console.error('Content recommendations error:', error);
      return null;
    }
  }

  async updateRecommendationFeedback(
    userId: string,
    contentId: string,
    engagementScore: number
  ): Promise<void> {
    if (!this.isAvailable) return;

    try {
      await this.client.post('/api/v1/recommendations/feedback', null, {
        params: {
          user_id: userId,
          content_id: contentId,
          engagement_score: engagementScore
        }
      });
    } catch (error) {
      console.error('Recommendation feedback error:', error);
    }
  }

  /**
   * Knowledge Graph
   */
  async getPrerequisites(conceptId: string): Promise<any[] | null> {
    if (!this.isAvailable) return null;

    try {
      const response = await this.client.get(`/api/v1/knowledge-graph/prerequisites/${conceptId}`);
      return response.data.prerequisites;
    } catch (error) {
      console.error('Get prerequisites error:', error);
      return null;
    }
  }

  async getRelatedConcepts(conceptId: string): Promise<any[] | null> {
    if (!this.isAvailable) return null;

    try {
      const response = await this.client.get(`/api/v1/knowledge-graph/related-concepts/${conceptId}`);
      return response.data.related_concepts;
    } catch (error) {
      console.error('Get related concepts error:', error);
      return null;
    }
  }

  /**
   * Utility Methods
   */
  getServiceStatus(): { available: boolean; baseURL: string } {
    return {
      available: this.isAvailable,
      baseURL: this.client.defaults.baseURL || ''
    };
  }
}

// Cached instance with 5 minute cache for frequently accessed data
const mlServiceClient = new MLServiceClient();

// Export memoized expensive ML operations
export const mlService = {
  ...mlServiceClient,

  // Cache knowledge tracing predictions for 5 minutes
  predictMasteryDKT: memoize(
    mlServiceClient.predictMasteryDKT.bind(mlServiceClient),
    { maxAge: 300000, primitive: true }
  ),

  // Cache engagement scores for 2 minutes
  getEngagementScore: memoize(
    mlServiceClient.getEngagementScore.bind(mlServiceClient),
    { maxAge: 120000, primitive: true }
  )
};

export default mlService;

import {
  users,
  subjects,
  topics,
  questions,
  quizzes,
  mockTests,
  userProgress,
  quizAttempts,
  mockTestAttempts,
  studyPlans,
  aiRecommendations,
  progressHistory,
  sectionPerformance,
  type User,
  type InsertUser,
  type Subject,
  type InsertSubject,
  type Topic,
  type InsertTopic,
  type Question,
  type InsertQuestion,
  type Quiz,
  type InsertQuiz,
  type MockTest,
  type InsertMockTest,
  type QuizAttempt,
  type InsertQuizAttempt,
  type MockTestAttempt,
  type InsertMockTestAttempt,
  type UserProgress,
  type StudyPlan,
  type InsertStudyPlan,
  type AiRecommendation,
  type InsertAiRecommendation,
  type ProgressHistory,
  type InsertProgressHistory,
  type SectionPerformance,
  type InsertSectionPerformance,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, sql } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;

  // Subject operations
  getSubjects(): Promise<Subject[]>;
  getSubject(id: string): Promise<Subject | undefined>;
  createSubject(subject: InsertSubject): Promise<Subject>;

  // Topic operations
  getTopicsBySubject(subjectId: string): Promise<Topic[]>;
  getTopic(id: string): Promise<Topic | undefined>;
  createTopic(topic: InsertTopic): Promise<Topic>;

  // Question operations
  getQuestionsByTopic(topicId: string): Promise<Question[]>;
  getQuestionsBySubject(subjectId: string): Promise<Question[]>;
  getQuestion(id: string): Promise<Question | undefined>;
  createQuestion(question: InsertQuestion): Promise<Question>;
  getRandomQuestions(subjectId?: string, topicId?: string, limit?: number): Promise<Question[]>;

  // Quiz operations
  getQuizzes(subjectId?: string, topicId?: string): Promise<Quiz[]>;
  getQuiz(id: string): Promise<Quiz | undefined>;
  createQuiz(quiz: InsertQuiz): Promise<Quiz>;

  // Mock test operations
  getMockTests(): Promise<MockTest[]>;
  getMockTest(id: string): Promise<MockTest | undefined>;
  createMockTest(mockTest: InsertMockTest): Promise<MockTest>;

  // Quiz attempt operations
  createQuizAttempt(attempt: InsertQuizAttempt): Promise<QuizAttempt>;
  updateQuizAttempt(id: string, updates: Partial<QuizAttempt>): Promise<QuizAttempt>;
  getUserQuizAttempts(userId: string): Promise<QuizAttempt[]>;

  // Mock test attempt operations
  createMockTestAttempt(attempt: InsertMockTestAttempt): Promise<MockTestAttempt>;
  updateMockTestAttempt(id: string, updates: Partial<MockTestAttempt>): Promise<MockTestAttempt>;
  getUserMockTestAttempts(userId: string): Promise<MockTestAttempt[]>;

  // Progress operations
  getUserProgress(userId: string): Promise<UserProgress[]>;
  getSubjectProgress(userId: string, subjectId: string): Promise<UserProgress | undefined>;
  updateProgress(userId: string, subjectId: string, topicId: string | null, updates: Partial<UserProgress>): Promise<UserProgress>;

  // Study plan operations
  getUserStudyPlan(userId: string): Promise<StudyPlan | undefined>;
  createStudyPlan(plan: InsertStudyPlan): Promise<StudyPlan>;
  updateStudyPlan(id: string, updates: Partial<StudyPlan>): Promise<StudyPlan>;

  // AI recommendation operations
  getUserRecommendations(userId: string): Promise<AiRecommendation[]>;
  createRecommendation(recommendation: InsertAiRecommendation): Promise<AiRecommendation>;
  markRecommendationAsRead(id: string): Promise<void>;

  // Progress history operations
  getProgressHistory(userId: string, subjectId?: string, topicId?: string): Promise<ProgressHistory[]>;
  createProgressHistory(history: InsertProgressHistory): Promise<ProgressHistory>;
  getProgressTrend(userId: string, subjectId: string, days: number): Promise<ProgressHistory[]>;

  // Section performance operations
  getSectionPerformance(userId: string, subjectId?: string): Promise<SectionPerformance[]>;
  updateSectionPerformance(userId: string, subjectId: string, sectionName: string, updates: Partial<SectionPerformance>): Promise<SectionPerformance>;
  getWeakSections(userId: string): Promise<SectionPerformance[]>;

  // Enhanced progress analytics
  updateProgressWithHistory(userId: string, subjectId: string, topicId: string | null, updates: Partial<UserProgress>, activityType: string, activityId: string, scoreObtained?: number): Promise<UserProgress>;
  calculateStudyStreak(userId: string): Promise<number>;
  getOverallProgress(userId: string): Promise<{ overallProgress: number; totalStudyHours: number; studyStreak: number }>;

  sessionStore: any;
}

export class DatabaseStorage implements IStorage {
  sessionStore: any;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      conString: process.env.DATABASE_URL,
      createTableIfMissing: false,
    });
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Subject operations
  async getSubjects(): Promise<Subject[]> {
    return await db.select().from(subjects).orderBy(asc(subjects.name));
  }

  async getSubject(id: string): Promise<Subject | undefined> {
    const [subject] = await db.select().from(subjects).where(eq(subjects.id, id));
    return subject;
  }

  async createSubject(insertSubject: InsertSubject): Promise<Subject> {
    const [subject] = await db.insert(subjects).values(insertSubject).returning();
    return subject;
  }

  // Topic operations
  async getTopicsBySubject(subjectId: string): Promise<Topic[]> {
    return await db.select().from(topics).where(eq(topics.subjectId, subjectId));
  }

  async getTopic(id: string): Promise<Topic | undefined> {
    const [topic] = await db.select().from(topics).where(eq(topics.id, id));
    return topic;
  }

  async createTopic(insertTopic: InsertTopic): Promise<Topic> {
    const [topic] = await db.insert(topics).values(insertTopic).returning();
    return topic;
  }

  // Question operations
  async getQuestionsByTopic(topicId: string): Promise<Question[]> {
    return await db.select().from(questions).where(eq(questions.topicId, topicId));
  }

  async getQuestionsBySubject(subjectId: string): Promise<Question[]> {
    return await db.select().from(questions).where(eq(questions.subjectId, subjectId));
  }

  async getQuestion(id: string): Promise<Question | undefined> {
    const [question] = await db.select().from(questions).where(eq(questions.id, id));
    return question;
  }

  async createQuestion(insertQuestion: InsertQuestion): Promise<Question> {
    const [question] = await db.insert(questions).values(insertQuestion).returning();
    return question;
  }

  async getRandomQuestions(subjectId?: string, topicId?: string, limit = 10): Promise<Question[]> {
    let query = db.select().from(questions);
    
    if (topicId) {
      query = query.where(eq(questions.topicId, topicId));
    } else if (subjectId) {
      query = query.where(eq(questions.subjectId, subjectId));
    }
    
    return await query.orderBy(sql`RANDOM()`).limit(limit);
  }

  // Quiz operations
  async getQuizzes(subjectId?: string, topicId?: string): Promise<Quiz[]> {
    let query = db.select().from(quizzes).where(eq(quizzes.isActive, true));
    
    if (topicId) {
      query = query.where(and(eq(quizzes.topicId, topicId), eq(quizzes.isActive, true)));
    } else if (subjectId) {
      query = query.where(and(eq(quizzes.subjectId, subjectId), eq(quizzes.isActive, true)));
    }
    
    return await query.orderBy(desc(quizzes.createdAt));
  }

  async getQuiz(id: string): Promise<Quiz | undefined> {
    const [quiz] = await db.select().from(quizzes).where(eq(quizzes.id, id));
    return quiz;
  }

  async createQuiz(insertQuiz: InsertQuiz): Promise<Quiz> {
    const [quiz] = await db.insert(quizzes).values(insertQuiz).returning();
    return quiz;
  }

  // Mock test operations
  async getMockTests(): Promise<MockTest[]> {
    return await db.select().from(mockTests).where(eq(mockTests.isActive, true)).orderBy(desc(mockTests.createdAt));
  }

  async getMockTest(id: string): Promise<MockTest | undefined> {
    const [mockTest] = await db.select().from(mockTests).where(eq(mockTests.id, id));
    return mockTest;
  }

  async createMockTest(insertMockTest: InsertMockTest): Promise<MockTest> {
    const [mockTest] = await db.insert(mockTests).values(insertMockTest).returning();
    return mockTest;
  }

  // Quiz attempt operations
  async createQuizAttempt(insertAttempt: InsertQuizAttempt): Promise<QuizAttempt> {
    const [attempt] = await db.insert(quizAttempts).values(insertAttempt).returning();
    return attempt;
  }

  async updateQuizAttempt(id: string, updates: Partial<QuizAttempt>): Promise<QuizAttempt> {
    const [attempt] = await db
      .update(quizAttempts)
      .set(updates)
      .where(eq(quizAttempts.id, id))
      .returning();
    return attempt;
  }

  async getUserQuizAttempts(userId: string): Promise<QuizAttempt[]> {
    return await db.select().from(quizAttempts).where(eq(quizAttempts.userId, userId)).orderBy(desc(quizAttempts.completedAt));
  }

  // Mock test attempt operations
  async createMockTestAttempt(insertAttempt: InsertMockTestAttempt): Promise<MockTestAttempt> {
    const [attempt] = await db.insert(mockTestAttempts).values(insertAttempt).returning();
    return attempt;
  }

  async updateMockTestAttempt(id: string, updates: Partial<MockTestAttempt>): Promise<MockTestAttempt> {
    const [attempt] = await db
      .update(mockTestAttempts)
      .set(updates)
      .where(eq(mockTestAttempts.id, id))
      .returning();
    return attempt;
  }

  async getUserMockTestAttempts(userId: string): Promise<MockTestAttempt[]> {
    return await db.select().from(mockTestAttempts).where(eq(mockTestAttempts.userId, userId)).orderBy(desc(mockTestAttempts.completedAt));
  }

  // Progress operations
  async getUserProgress(userId: string): Promise<UserProgress[]> {
    return await db.select().from(userProgress).where(eq(userProgress.userId, userId));
  }

  async getSubjectProgress(userId: string, subjectId: string): Promise<UserProgress | undefined> {
    const [progress] = await db
      .select()
      .from(userProgress)
      .where(and(eq(userProgress.userId, userId), eq(userProgress.subjectId, subjectId)));
    return progress;
  }

  async updateProgress(userId: string, subjectId: string, topicId: string | null, updates: Partial<UserProgress>): Promise<UserProgress> {
    const existing = await db
      .select()
      .from(userProgress)
      .where(
        and(
          eq(userProgress.userId, userId),
          eq(userProgress.subjectId, subjectId),
          topicId ? eq(userProgress.topicId, topicId) : sql`topic_id IS NULL`
        )
      );

    if (existing.length > 0) {
      const [progress] = await db
        .update(userProgress)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(userProgress.id, existing[0].id))
        .returning();
      return progress;
    } else {
      const [progress] = await db
        .insert(userProgress)
        .values({
          userId,
          subjectId,
          topicId,
          ...updates,
        })
        .returning();
      return progress;
    }
  }

  // Study plan operations
  async getUserStudyPlan(userId: string): Promise<StudyPlan | undefined> {
    const [plan] = await db
      .select()
      .from(studyPlans)
      .where(and(eq(studyPlans.userId, userId), eq(studyPlans.isActive, true)))
      .orderBy(desc(studyPlans.createdAt));
    return plan;
  }

  async createStudyPlan(insertPlan: InsertStudyPlan): Promise<StudyPlan> {
    // Deactivate previous plans
    await db
      .update(studyPlans)
      .set({ isActive: false })
      .where(eq(studyPlans.userId, insertPlan.userId));

    const [plan] = await db.insert(studyPlans).values(insertPlan).returning();
    return plan;
  }

  async updateStudyPlan(id: string, updates: Partial<StudyPlan>): Promise<StudyPlan> {
    const [plan] = await db
      .update(studyPlans)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(studyPlans.id, id))
      .returning();
    return plan;
  }

  // AI recommendation operations
  async getUserRecommendations(userId: string): Promise<AiRecommendation[]> {
    return await db
      .select()
      .from(aiRecommendations)
      .where(eq(aiRecommendations.userId, userId))
      .orderBy(desc(aiRecommendations.priority), desc(aiRecommendations.createdAt));
  }

  async createRecommendation(insertRecommendation: InsertAiRecommendation): Promise<AiRecommendation> {
    const [recommendation] = await db.insert(aiRecommendations).values(insertRecommendation).returning();
    return recommendation;
  }

  async markRecommendationAsRead(id: string): Promise<void> {
    await db
      .update(aiRecommendations)
      .set({ isRead: true })
      .where(eq(aiRecommendations.id, id));
  }

  // Progress history operations
  async getProgressHistory(userId: string, subjectId?: string, topicId?: string): Promise<ProgressHistory[]> {
    let query = db.select().from(progressHistory).where(eq(progressHistory.userId, userId));
    
    if (subjectId) {
      query = query.where(and(eq(progressHistory.userId, userId), eq(progressHistory.subjectId, subjectId)));
    }
    if (topicId) {
      query = query.where(and(eq(progressHistory.userId, userId), eq(progressHistory.topicId, topicId)));
    }
    
    return await query.orderBy(desc(progressHistory.createdAt));
  }

  async createProgressHistory(insertHistory: InsertProgressHistory): Promise<ProgressHistory> {
    const [history] = await db.insert(progressHistory).values(insertHistory).returning();
    return history;
  }

  async getProgressTrend(userId: string, subjectId: string, days: number): Promise<ProgressHistory[]> {
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - days);
    
    return await db
      .select()
      .from(progressHistory)
      .where(
        and(
          eq(progressHistory.userId, userId),
          eq(progressHistory.subjectId, subjectId),
          sql`created_at >= ${daysAgo}`
        )
      )
      .orderBy(asc(progressHistory.createdAt));
  }

  // Section performance operations
  async getSectionPerformance(userId: string, subjectId?: string): Promise<SectionPerformance[]> {
    let query = db.select().from(sectionPerformance).where(eq(sectionPerformance.userId, userId));
    
    if (subjectId) {
      query = query.where(and(eq(sectionPerformance.userId, userId), eq(sectionPerformance.subjectId, subjectId)));
    }
    
    return await query.orderBy(desc(sectionPerformance.updatedAt));
  }

  async updateSectionPerformance(userId: string, subjectId: string, sectionName: string, updates: Partial<SectionPerformance>): Promise<SectionPerformance> {
    const existing = await db
      .select()
      .from(sectionPerformance)
      .where(
        and(
          eq(sectionPerformance.userId, userId),
          eq(sectionPerformance.subjectId, subjectId),
          eq(sectionPerformance.sectionName, sectionName)
        )
      );

    if (existing.length > 0) {
      const [performance] = await db
        .update(sectionPerformance)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(sectionPerformance.id, existing[0].id))
        .returning();
      return performance;
    } else {
      const [performance] = await db
        .insert(sectionPerformance)
        .values({
          userId,
          subjectId,
          sectionName,
          ...updates,
        })
        .returning();
      return performance;
    }
  }

  async getWeakSections(userId: string): Promise<SectionPerformance[]> {
    return await db
      .select()
      .from(sectionPerformance)
      .where(and(
        eq(sectionPerformance.userId, userId),
        sql`average_score < 60`
      ))
      .orderBy(asc(sectionPerformance.averageScore));
  }

  // Enhanced progress analytics
  async updateProgressWithHistory(
    userId: string,
    subjectId: string,
    topicId: string | null,
    updates: Partial<UserProgress>,
    activityType: string,
    activityId: string,
    scoreObtained?: number
  ): Promise<UserProgress> {
    // Get current progress for history tracking
    const currentProgress = await this.getSubjectProgress(userId, subjectId);
    
    // Update progress
    const updatedProgress = await this.updateProgress(userId, subjectId, topicId, updates);
    
    // Create history entry
    await this.createProgressHistory({
      userId,
      subjectId,
      topicId,
      progressType: activityType,
      activityId,
      scoreObtained: scoreObtained ? scoreObtained.toString() : undefined,
      timeSpent: updates.timeSpent,
      masteryBefore: currentProgress?.mastery || "0",
      masteryAfter: updatedProgress.mastery || "0",
      completionBefore: currentProgress?.completionPercentage || "0",
      completionAfter: updatedProgress.completionPercentage || "0",
      metadata: { activityType, activityId }
    });
    
    return updatedProgress;
  }

  async calculateStudyStreak(userId: string): Promise<number> {
    // Get user's study history for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentHistory = await db
      .select()
      .from(progressHistory)
      .where(
        and(
          eq(progressHistory.userId, userId),
          sql`created_at >= ${thirtyDaysAgo}`
        )
      )
      .orderBy(desc(progressHistory.createdAt));
    
    // Calculate streak from recent activity
    let streak = 0;
    const today = new Date();
    const studyDates = new Set();
    
    recentHistory.forEach(entry => {
      const entryDate = new Date(entry.createdAt!);
      const dateString = entryDate.toDateString();
      studyDates.add(dateString);
    });
    
    // Count consecutive days from today backwards
    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const dateString = checkDate.toDateString();
      
      if (studyDates.has(dateString)) {
        streak++;
      } else if (i > 0) { // Skip today if no activity yet
        break;
      }
    }
    
    return streak;
  }

  async getOverallProgress(userId: string): Promise<{ overallProgress: number; totalStudyHours: number; studyStreak: number }> {
    // Get all user progress
    const allProgress = await this.getUserProgress(userId);
    
    // Calculate overall progress as weighted average
    let totalWeightedProgress = 0;
    let totalWeight = 0;
    let totalStudyMinutes = 0;
    
    for (const progress of allProgress) {
      const weight = 1; // Could be based on subject importance
      totalWeightedProgress += parseFloat(progress.completionPercentage || "0") * weight;
      totalWeight += weight;
      totalStudyMinutes += progress.timeSpent || 0;
    }
    
    const overallProgress = totalWeight > 0 ? totalWeightedProgress / totalWeight : 0;
    const totalStudyHours = Math.floor(totalStudyMinutes / 60);
    const studyStreak = await this.calculateStudyStreak(userId);
    
    // Update user record
    await this.updateUser(userId, {
      overallProgress: overallProgress.toString(),
      totalStudyHours,
      studyStreak
    });
    
    return { overallProgress, totalStudyHours, studyStreak };
  }
}

export const storage = new DatabaseStorage();

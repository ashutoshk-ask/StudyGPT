import { sql } from "drizzle-orm";
import { 
  pgTable, 
  text, 
  varchar, 
  integer, 
  timestamp, 
  boolean, 
  jsonb,
  decimal,
  index
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  profileImageUrl: text("profile_image_url"),
  examDate: timestamp("exam_date"),
  dailyStudyHours: integer("daily_study_hours").default(4),
  currentLevel: text("current_level").default("beginner"),
  overallProgress: decimal("overall_progress", { precision: 5, scale: 2 }).default("0"),
  studyStreak: integer("study_streak").default(0),
  totalStudyHours: integer("total_study_hours").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Subjects table
export const subjects = pgTable("subjects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  icon: text("icon"),
  color: text("color"),
  totalTopics: integer("total_topics").default(0),
  weightage: decimal("weightage", { precision: 5, scale: 2 }).default("25"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Topics table
export const topics = pgTable("topics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  subjectId: varchar("subject_id").references(() => subjects.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  difficulty: text("difficulty").notNull(), // beginner, intermediate, advanced
  estimatedTime: integer("estimated_time_minutes").default(60),
  content: jsonb("content"), // lesson content, formulas, examples
  createdAt: timestamp("created_at").defaultNow(),
});

// User progress tracking
export const userProgress = pgTable("user_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  subjectId: varchar("subject_id").references(() => subjects.id).notNull(),
  topicId: varchar("topic_id").references(() => topics.id),
  completionPercentage: decimal("completion_percentage", { precision: 5, scale: 2 }).default("0"),
  timeSpent: integer("time_spent_minutes").default(0),
  lastAccessed: timestamp("last_accessed").defaultNow(),
  mastery: decimal("mastery", { precision: 5, scale: 2 }).default("0"),
  weaknessScore: decimal("weakness_score", { precision: 5, scale: 2 }).default("0"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Questions table
export const questions = pgTable("questions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  subjectId: varchar("subject_id").references(() => subjects.id).notNull(),
  topicId: varchar("topic_id").references(() => topics.id),
  questionText: text("question_text").notNull(),
  options: jsonb("options").notNull(), // array of options
  correctAnswer: text("correct_answer").notNull(),
  explanation: text("explanation"),
  difficulty: text("difficulty").notNull(),
  questionType: text("question_type").default("mcq"), // mcq, fill-in-blank, etc
  timeLimit: integer("time_limit_seconds").default(120),
  marks: decimal("marks", { precision: 3, scale: 1 }).default("2"),
  negativeMarks: decimal("negative_marks", { precision: 3, scale: 1 }).default("0.5"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Quizzes table
export const quizzes = pgTable("quizzes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  subjectId: varchar("subject_id").references(() => subjects.id),
  topicId: varchar("topic_id").references(() => topics.id),
  questionIds: jsonb("question_ids").notNull(), // array of question IDs
  timeLimit: integer("time_limit_minutes").default(30),
  totalMarks: decimal("total_marks", { precision: 5, scale: 1 }).default("0"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Mock tests table
export const mockTests = pgTable("mock_tests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  examPattern: text("exam_pattern").default("ssc_cgl_tier1"),
  sections: jsonb("sections").notNull(), // array of sections with question IDs
  timeLimit: integer("time_limit_minutes").default(60),
  totalQuestions: integer("total_questions").default(100),
  totalMarks: decimal("total_marks", { precision: 5, scale: 1 }).default("200"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Quiz attempts table
export const quizAttempts = pgTable("quiz_attempts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  quizId: varchar("quiz_id").references(() => quizzes.id).notNull(),
  answers: jsonb("answers").notNull(), // user's answers
  score: decimal("score", { precision: 5, scale: 2 }).default("0"),
  timeTaken: integer("time_taken_seconds"),
  completedAt: timestamp("completed_at").defaultNow(),
  isCompleted: boolean("is_completed").default(false),
});

// Mock test attempts table
export const mockTestAttempts = pgTable("mock_test_attempts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  mockTestId: varchar("mock_test_id").references(() => mockTests.id).notNull(),
  answers: jsonb("answers").notNull(), // user's answers by section
  sectionScores: jsonb("section_scores"), // scores by section
  totalScore: decimal("total_score", { precision: 5, scale: 2 }).default("0"),
  timeTaken: integer("time_taken_seconds"),
  completedAt: timestamp("completed_at").defaultNow(),
  isCompleted: boolean("is_completed").default(false),
});

// Study plans table
export const studyPlans = pgTable("study_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  examDate: timestamp("exam_date").notNull(),
  weeklySchedule: jsonb("weekly_schedule").notNull(), // 7-day schedule
  aiGenerated: boolean("ai_generated").default(true),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// AI recommendations table
export const aiRecommendations = pgTable("ai_recommendations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  type: text("type").notNull(), // weakness, strength, speed, study_plan
  title: text("title").notNull(),
  description: text("description").notNull(),
  actionUrl: text("action_url"),
  priority: integer("priority").default(1), // 1-5
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  progress: many(userProgress),
  quizAttempts: many(quizAttempts),
  mockTestAttempts: many(mockTestAttempts),
  studyPlans: many(studyPlans),
  aiRecommendations: many(aiRecommendations),
}));

export const subjectsRelations = relations(subjects, ({ many }) => ({
  topics: many(topics),
  questions: many(questions),
  progress: many(userProgress),
}));

export const topicsRelations = relations(topics, ({ one, many }) => ({
  subject: one(subjects, {
    fields: [topics.subjectId],
    references: [subjects.id],
  }),
  questions: many(questions),
  progress: many(userProgress),
}));

export const questionsRelations = relations(questions, ({ one }) => ({
  subject: one(subjects, {
    fields: [questions.subjectId],
    references: [subjects.id],
  }),
  topic: one(topics, {
    fields: [questions.topicId],
    references: [topics.id],
  }),
}));

export const quizzesRelations = relations(quizzes, ({ one, many }) => ({
  subject: one(subjects, {
    fields: [quizzes.subjectId],
    references: [subjects.id],
  }),
  topic: one(topics, {
    fields: [quizzes.topicId],
    references: [topics.id],
  }),
  attempts: many(quizAttempts),
}));

export const mockTestsRelations = relations(mockTests, ({ many }) => ({
  attempts: many(mockTestAttempts),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSubjectSchema = createInsertSchema(subjects).omit({
  id: true,
  createdAt: true,
});

export const insertTopicSchema = createInsertSchema(topics).omit({
  id: true,
  createdAt: true,
});

export const insertQuestionSchema = createInsertSchema(questions).omit({
  id: true,
  createdAt: true,
});

export const insertQuizSchema = createInsertSchema(quizzes).omit({
  id: true,
  createdAt: true,
});

export const insertMockTestSchema = createInsertSchema(mockTests).omit({
  id: true,
  createdAt: true,
});

export const insertQuizAttemptSchema = createInsertSchema(quizAttempts).omit({
  id: true,
  completedAt: true,
});

export const insertMockTestAttemptSchema = createInsertSchema(mockTestAttempts).omit({
  id: true,
  completedAt: true,
});

export const insertStudyPlanSchema = createInsertSchema(studyPlans).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAiRecommendationSchema = createInsertSchema(aiRecommendations).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Subject = typeof subjects.$inferSelect;
export type InsertSubject = z.infer<typeof insertSubjectSchema>;
export type Topic = typeof topics.$inferSelect;
export type InsertTopic = z.infer<typeof insertTopicSchema>;
export type Question = typeof questions.$inferSelect;
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type Quiz = typeof quizzes.$inferSelect;
export type InsertQuiz = z.infer<typeof insertQuizSchema>;
export type MockTest = typeof mockTests.$inferSelect;
export type InsertMockTest = z.infer<typeof insertMockTestSchema>;
export type QuizAttempt = typeof quizAttempts.$inferSelect;
export type InsertQuizAttempt = z.infer<typeof insertQuizAttemptSchema>;
export type MockTestAttempt = typeof mockTestAttempts.$inferSelect;
export type InsertMockTestAttempt = z.infer<typeof insertMockTestAttemptSchema>;
export type UserProgress = typeof userProgress.$inferSelect;
export type StudyPlan = typeof studyPlans.$inferSelect;
export type InsertStudyPlan = z.infer<typeof insertStudyPlanSchema>;
export type AiRecommendation = typeof aiRecommendations.$inferSelect;
export type InsertAiRecommendation = z.infer<typeof insertAiRecommendationSchema>;

import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { 
  insertQuizAttemptSchema, 
  insertMockTestAttemptSchema,
  insertStudyPlanSchema 
} from "@shared/schema";
import { 
  generateStudyRecommendations, 
  analyzeWeakTopics, 
  generatePersonalizedStudyPlan,
  generateQuizExplanation
} from "./openai";

function isAuthenticated(req: any, res: any, next: any) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
}

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // User routes
  app.get("/api/user", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.put("/api/user/profile", isAuthenticated, async (req: any, res) => {
    try {
      const updates = req.body;
      const user = await storage.updateUser(req.user.id, updates);
      res.json(user);
    } catch (error) {
      console.error("Error updating user profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Subject routes
  app.get("/api/subjects", isAuthenticated, async (req, res) => {
    try {
      const subjects = await storage.getSubjects();
      res.json(subjects);
    } catch (error) {
      console.error("Error fetching subjects:", error);
      res.status(500).json({ message: "Failed to fetch subjects" });
    }
  });

  app.get("/api/subjects/:id", isAuthenticated, async (req, res) => {
    try {
      const subject = await storage.getSubject(req.params.id);
      if (!subject) {
        return res.status(404).json({ message: "Subject not found" });
      }
      res.json(subject);
    } catch (error) {
      console.error("Error fetching subject:", error);
      res.status(500).json({ message: "Failed to fetch subject" });
    }
  });

  // Topic routes
  app.get("/api/subjects/:subjectId/topics", isAuthenticated, async (req, res) => {
    try {
      const topics = await storage.getTopicsBySubject(req.params.subjectId);
      res.json(topics);
    } catch (error) {
      console.error("Error fetching topics:", error);
      res.status(500).json({ message: "Failed to fetch topics" });
    }
  });

  app.get("/api/topics/:id", isAuthenticated, async (req, res) => {
    try {
      const topic = await storage.getTopic(req.params.id);
      if (!topic) {
        return res.status(404).json({ message: "Topic not found" });
      }
      res.json(topic);
    } catch (error) {
      console.error("Error fetching topic:", error);
      res.status(500).json({ message: "Failed to fetch topic" });
    }
  });

  // Question routes
  app.get("/api/questions", isAuthenticated, async (req, res) => {
    try {
      const { subjectId, topicId, limit } = req.query;
      let questions;

      if (topicId) {
        questions = await storage.getQuestionsByTopic(topicId as string);
      } else if (subjectId) {
        questions = await storage.getQuestionsBySubject(subjectId as string);
      } else {
        questions = await storage.getRandomQuestions(
          subjectId as string,
          topicId as string,
          limit ? parseInt(limit as string) : 10
        );
      }

      res.json(questions);
    } catch (error) {
      console.error("Error fetching questions:", error);
      res.status(500).json({ message: "Failed to fetch questions" });
    }
  });

  app.get("/api/questions/random", isAuthenticated, async (req, res) => {
    try {
      const { subjectId, topicId, limit = 10 } = req.query;
      const questions = await storage.getRandomQuestions(
        subjectId as string,
        topicId as string,
        parseInt(limit as string)
      );
      res.json(questions);
    } catch (error) {
      console.error("Error fetching random questions:", error);
      res.status(500).json({ message: "Failed to fetch questions" });
    }
  });

  // Quiz routes
  app.get("/api/quizzes", isAuthenticated, async (req, res) => {
    try {
      const { subjectId, topicId } = req.query;
      const quizzes = await storage.getQuizzes(subjectId as string, topicId as string);
      res.json(quizzes);
    } catch (error) {
      console.error("Error fetching quizzes:", error);
      res.status(500).json({ message: "Failed to fetch quizzes" });
    }
  });

  app.get("/api/quizzes/:id", isAuthenticated, async (req, res) => {
    try {
      const quiz = await storage.getQuiz(req.params.id);
      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }

      // Get questions for the quiz
      const questionIds = quiz.questionIds as string[];
      const questions = await Promise.all(
        questionIds.map(id => storage.getQuestion(id))
      );

      res.json({
        ...quiz,
        questions: questions.filter(q => q !== undefined)
      });
    } catch (error) {
      console.error("Error fetching quiz:", error);
      res.status(500).json({ message: "Failed to fetch quiz" });
    }
  });

  app.post("/api/quizzes/:id/attempt", isAuthenticated, async (req: any, res) => {
    try {
      const { answers, timeTaken } = req.body;
      const quiz = await storage.getQuiz(req.params.id);
      
      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }

      // Calculate score
      const questionIds = quiz.questionIds as string[];
      const questions = await Promise.all(
        questionIds.map(id => storage.getQuestion(id))
      );

      let correctAnswers = 0;
      let totalMarks = 0;

      questions.forEach((question, index) => {
        if (question && answers[index] === question.correctAnswer) {
          correctAnswers++;
          totalMarks += parseFloat(question.marks || "0");
        }
      });

      const score = questions.length > 0 ? (correctAnswers / questions.length) * 100 : 0;

      const attempt = await storage.createQuizAttempt({
        userId: req.user.id,
        quizId: req.params.id,
        answers,
        score: score.toString(),
        timeTaken,
        isCompleted: true
      });

      // Update user progress
      if (quiz.subjectId) {
        // Get existing progress or default values
        const existingProgress = await storage.getUserProgress(req.user.id);
        const currentProgress = existingProgress.find(p => 
          p.subjectId === quiz.subjectId && p.topicId === quiz.topicId
        );
        
        // Calculate more realistic progress
        const previousTimeSpent = currentProgress?.timeSpent || 0;
        const newTimeSpent = previousTimeSpent + Math.floor(timeTaken / 60);
        const previousMastery = currentProgress ? parseFloat(currentProgress.mastery || "0") : 0;
        
        // Update progress with cumulative values
        await storage.updateProgress(req.user.id, quiz.subjectId, quiz.topicId, {
          completionPercentage: Math.max(
            currentProgress ? parseFloat(currentProgress.completionPercentage || "0") : 0,
            score
          ).toString(), // Keep highest completion percentage achieved
          timeSpent: newTimeSpent,
          mastery: Math.max(previousMastery, score).toString() // Keep highest score as mastery
        });
      }

      res.json({ attempt, score, correctAnswers, totalQuestions: questions.length });
    } catch (error) {
      console.error("Error submitting quiz attempt:", error);
      res.status(500).json({ message: "Failed to submit quiz attempt" });
    }
  });

  // Mock test routes
  app.get("/api/mock-tests", isAuthenticated, async (req, res) => {
    try {
      const mockTests = await storage.getMockTests();
      res.json(mockTests);
    } catch (error) {
      console.error("Error fetching mock tests:", error);
      res.status(500).json({ message: "Failed to fetch mock tests" });
    }
  });

  app.get("/api/mock-tests/:id", isAuthenticated, async (req, res) => {
    try {
      const mockTest = await storage.getMockTest(req.params.id);
      if (!mockTest) {
        return res.status(404).json({ message: "Mock test not found" });
      }

      // Get questions for each section
      const sections = mockTest.sections as any[];
      const sectionsWithQuestions = await Promise.all(
        sections.map(async (section) => {
          const questions = await Promise.all(
            section.questionIds.map((id: string) => storage.getQuestion(id))
          );
          return {
            ...section,
            questions: questions.filter(q => q !== undefined)
          };
        })
      );

      res.json({
        ...mockTest,
        sections: sectionsWithQuestions
      });
    } catch (error) {
      console.error("Error fetching mock test:", error);
      res.status(500).json({ message: "Failed to fetch mock test" });
    }
  });

  app.post("/api/mock-tests/:id/attempt", isAuthenticated, async (req: any, res) => {
    try {
      const { answers, timeTaken } = req.body;
      const mockTest = await storage.getMockTest(req.params.id);
      
      if (!mockTest) {
        return res.status(404).json({ message: "Mock test not found" });
      }

      // Calculate section-wise scores
      const sections = mockTest.sections as any[];
      const sectionScores: any = {};
      let totalScore = 0;
      let totalCorrect = 0;
      let totalQuestions = 0;

      for (const section of sections) {
        const questions = await Promise.all(
          section.questionIds.map((id: string) => storage.getQuestion(id))
        );

        let sectionCorrect = 0;
        let sectionScore = 0;

        questions.forEach((question, index) => {
          if (question) {
            totalQuestions++;
            const userAnswer = answers[section.name]?.[index];
            if (userAnswer === question.correctAnswer) {
              sectionCorrect++;
              totalCorrect++;
              const marks = parseFloat(question.marks || "0");
              sectionScore += marks;
              totalScore += marks;
            }
          }
        });

        sectionScores[section.name] = {
          correct: sectionCorrect,
          total: questions.length,
          score: sectionScore,
          percentage: questions.length > 0 ? (sectionCorrect / questions.length) * 100 : 0
        };
      }

      const attempt = await storage.createMockTestAttempt({
        userId: req.user.id,
        mockTestId: req.params.id,
        answers,
        sectionScores,
        totalScore: totalScore.toString(),
        timeTaken,
        isCompleted: true
      });

      res.json({ 
        attempt, 
        sectionScores, 
        totalScore, 
        totalCorrect, 
        totalQuestions,
        percentage: totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0
      });
    } catch (error) {
      console.error("Error submitting mock test attempt:", error);
      res.status(500).json({ message: "Failed to submit mock test attempt" });
    }
  });

  // Progress routes
  app.get("/api/progress", isAuthenticated, async (req: any, res) => {
    try {
      const progress = await storage.getUserProgress(req.user.id);
      res.json(progress);
    } catch (error) {
      console.error("Error fetching progress:", error);
      res.status(500).json({ message: "Failed to fetch progress" });
    }
  });

  app.get("/api/progress/subject/:subjectId", isAuthenticated, async (req: any, res) => {
    try {
      const progress = await storage.getSubjectProgress(req.user.id, req.params.subjectId);
      res.json(progress);
    } catch (error) {
      console.error("Error fetching subject progress:", error);
      res.status(500).json({ message: "Failed to fetch subject progress" });
    }
  });

  // Quiz and Mock test attempts
  app.get("/api/attempts/quiz", isAuthenticated, async (req: any, res) => {
    try {
      const attempts = await storage.getUserQuizAttempts(req.user.id);
      res.json(attempts);
    } catch (error) {
      console.error("Error fetching quiz attempts:", error);
      res.status(500).json({ message: "Failed to fetch quiz attempts" });
    }
  });

  app.get("/api/attempts/mock-test", isAuthenticated, async (req: any, res) => {
    try {
      const attempts = await storage.getUserMockTestAttempts(req.user.id);
      res.json(attempts);
    } catch (error) {
      console.error("Error fetching mock test attempts:", error);
      res.status(500).json({ message: "Failed to fetch mock test attempts" });
    }
  });

  // Study plan routes
  app.get("/api/study-plan", isAuthenticated, async (req: any, res) => {
    try {
      const studyPlan = await storage.getUserStudyPlan(req.user.id);
      res.json(studyPlan);
    } catch (error) {
      console.error("Error fetching study plan:", error);
      res.status(500).json({ message: "Failed to fetch study plan" });
    }
  });

  app.post("/api/study-plan/generate", isAuthenticated, async (req: any, res) => {
    try {
      const { examDate, dailyHours, weakTopics } = req.body;
      const user = await storage.getUser(req.user.id);
      const userProgress = await storage.getUserProgress(req.user.id);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const aiPlan = await generatePersonalizedStudyPlan(
        examDate,
        user.currentLevel || "beginner",
        dailyHours || user.dailyStudyHours || 4,
        weakTopics || [],
        userProgress
      );

      if (!aiPlan) {
        return res.status(500).json({ message: "Failed to generate AI study plan" });
      }

      const studyPlan = await storage.createStudyPlan({
        userId: req.user.id,
        examDate: new Date(examDate),
        weeklySchedule: aiPlan.weeklySchedule,
        aiGenerated: true,
        isActive: true
      });

      res.json(studyPlan);
    } catch (error) {
      console.error("Error generating study plan:", error);
      res.status(500).json({ message: "Failed to generate study plan" });
    }
  });

  // AI recommendations routes
  app.get("/api/ai/recommendations", isAuthenticated, async (req: any, res) => {
    try {
      const recommendations = await storage.getUserRecommendations(req.user.id);
      res.json(recommendations);
    } catch (error) {
      console.error("Error fetching AI recommendations:", error);
      res.status(500).json({ message: "Failed to fetch AI recommendations" });
    }
  });

  app.post("/api/ai/recommendations/generate", isAuthenticated, async (req: any, res) => {
    try {
      const userProgress = await storage.getUserProgress(req.user.id);
      const quizAttempts = await storage.getUserQuizAttempts(req.user.id);
      const mockTestAttempts = await storage.getUserMockTestAttempts(req.user.id);

      // Analyze weak topics
      const weakTopics = await analyzeWeakTopics(
        [...quizAttempts, ...mockTestAttempts],
        userProgress
      );

      // Generate recommendations
      const recommendations = await generateStudyRecommendations(
        userProgress,
        [...quizAttempts.slice(0, 5), ...mockTestAttempts.slice(0, 3)],
        weakTopics
      );

      // Save recommendations to database
      const savedRecommendations = await Promise.all(
        recommendations.map(rec => 
          storage.createRecommendation({
            userId: req.user.id,
            type: rec.type,
            title: rec.title,
            description: rec.description,
            actionUrl: rec.actionUrl,
            priority: rec.priority,
            isRead: false
          })
        )
      );

      res.json(savedRecommendations);
    } catch (error) {
      console.error("Error generating AI recommendations:", error);
      res.status(500).json({ message: "Failed to generate AI recommendations" });
    }
  });

  app.post("/api/ai/recommendations/:id/read", isAuthenticated, async (req, res) => {
    try {
      await storage.markRecommendationAsRead(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking recommendation as read:", error);
      res.status(500).json({ message: "Failed to mark recommendation as read" });
    }
  });

  // Quiz explanation route
  app.post("/api/quiz/explanation", isAuthenticated, async (req, res) => {
    try {
      const { questionId, userAnswer } = req.body;
      const question = await storage.getQuestion(questionId);
      
      if (!question) {
        return res.status(404).json({ message: "Question not found" });
      }

      const explanation = await generateQuizExplanation(
        question.questionText,
        question.options as string[],
        question.correctAnswer,
        userAnswer
      );

      res.json({ explanation });
    } catch (error) {
      console.error("Error generating quiz explanation:", error);
      res.status(500).json({ message: "Failed to generate explanation" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

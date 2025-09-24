import OpenAI from "openai";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY || "default_key"
});

export interface StudyRecommendation {
  type: "weakness" | "strength" | "speed" | "study_plan";
  title: string;
  description: string;
  actionUrl?: string;
  priority: number;
}

export interface WeakTopicAnalysis {
  topicName: string;
  subject: string;
  accuracy: number;
  timeSpent: number;
  recommendedActions: string[];
}

export interface StudyPlanGeneration {
  weeklySchedule: {
    [day: string]: {
      timeSlot: string;
      subject: string;
      topic: string;
      duration: number;
      priority: "high" | "medium" | "low";
    }[];
  };
  examDate: string;
  totalDaysLeft: number;
  focusAreas: string[];
}

// Enhanced error handling types
export interface AIServiceError {
  type: 'quota_exceeded' | 'rate_limit' | 'network_error' | 'parse_error' | 'unknown';
  message: string;
  retryAfter?: number;
  isRetryable: boolean;
}

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 30000,  // 30 seconds
  backoffMultiplier: 2
};

// Service health tracking
let aiServiceHealth = {
  isHealthy: true,
  lastError: null as AIServiceError | null,
  lastSuccessTime: Date.now(),
  consecutiveFailures: 0
};

export function getAIServiceHealth() {
  return { ...aiServiceHealth };
}

// Enhanced error handler
function handleOpenAIError(error: any): AIServiceError {
  console.error("OpenAI API error:", error);
  
  let aiError: AIServiceError;
  
  if (error?.status === 429) {
    aiError = {
      type: 'quota_exceeded',
      message: 'API quota exceeded or rate limit reached',
      retryAfter: error?.headers?.['retry-after'] ? parseInt(error.headers['retry-after']) * 1000 : 60000,
      isRetryable: true
    };
  } else if (error?.status >= 500) {
    aiError = {
      type: 'network_error',
      message: 'OpenAI service temporarily unavailable',
      isRetryable: true
    };
  } else if (error?.message?.includes('JSON')) {
    aiError = {
      type: 'parse_error',
      message: 'Error parsing AI response',
      isRetryable: false
    };
  } else {
    aiError = {
      type: 'unknown',
      message: error?.message || 'Unknown AI service error',
      isRetryable: false
    };
  }
  
  // Update service health
  aiServiceHealth.lastError = aiError;
  aiServiceHealth.consecutiveFailures++;
  aiServiceHealth.isHealthy = aiServiceHealth.consecutiveFailures < 5;
  
  return aiError;
}

// Update service health on success
function markAISuccess() {
  aiServiceHealth.isHealthy = true;
  aiServiceHealth.lastError = null;
  aiServiceHealth.lastSuccessTime = Date.now();
  aiServiceHealth.consecutiveFailures = 0;
}

// Retry with exponential backoff
async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  context: string
): Promise<T> {
  let lastError: AIServiceError;
  
  for (let attempt = 0; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
    try {
      const result = await operation();
      if (attempt > 0) {
        console.log(`${context}: Succeeded on attempt ${attempt + 1}`);
      }
      markAISuccess();
      return result;
    } catch (error) {
      lastError = handleOpenAIError(error);
      
      if (!lastError.isRetryable || attempt === RETRY_CONFIG.maxRetries) {
        console.error(`${context}: Failed after ${attempt + 1} attempts`);
        throw lastError;
      }
      
      const delay = Math.min(
        RETRY_CONFIG.baseDelay * Math.pow(RETRY_CONFIG.backoffMultiplier, attempt),
        RETRY_CONFIG.maxDelay
      );
      
      const retryDelay = lastError.retryAfter || delay;
      console.log(`${context}: Attempt ${attempt + 1} failed, retrying in ${retryDelay}ms`);
      
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
  
  throw lastError!;
}

// Fallback recommendation generators
function generateFallbackRecommendations(
  userProgress: any,
  recentPerformance: any,
  weakTopics: any[]
): StudyRecommendation[] {
  const recommendations: StudyRecommendation[] = [];
  
  // Analyze user progress for fallback recommendations
  if (userProgress && userProgress.length > 0) {
    const avgMastery = userProgress.reduce((acc: number, p: any) => acc + parseFloat(p.mastery || '0'), 0) / userProgress.length;
    
    // Weak areas recommendations
    const weakAreas = userProgress.filter((p: any) => parseFloat(p.mastery || '0') < 60);
    if (weakAreas.length > 0) {
      recommendations.push({
        type: 'weakness',
        title: 'Focus on Weak Areas',
        description: `You have ${weakAreas.length} subjects with mastery below 60%. Dedicate extra time to ${weakAreas[0]?.subjectId || 'these areas'} this week.`,
        actionUrl: '/subjects',
        priority: 1
      });
    }
    
    // Strong areas reinforcement
    const strongAreas = userProgress.filter((p: any) => parseFloat(p.mastery || '0') > 80);
    if (strongAreas.length > 0) {
      recommendations.push({
        type: 'strength',
        title: 'Maintain Your Strengths',
        description: `Great work on ${strongAreas[0]?.subjectId || 'your strong subjects'}! Continue with regular practice to maintain your ${strongAreas.length} strong area(s).`,
        actionUrl: '/quiz',
        priority: 3
      });
    }
    
    // Practice frequency recommendation
    const recentStudy = userProgress.some((p: any) => {
      const lastAccessed = new Date(p.lastAccessed || 0);
      const daysSince = (Date.now() - lastAccessed.getTime()) / (1000 * 60 * 60 * 24);
      return daysSince < 2;
    });
    
    if (!recentStudy) {
      recommendations.push({
        type: 'study_plan',
        title: 'Get Back to Regular Study',
        description: 'It looks like you haven\'t studied recently. Start with a quick 30-minute session to get back on track.',
        actionUrl: '/quiz',
        priority: 2
      });
    }
  }
  
  // Default motivational recommendations if no data
  if (recommendations.length === 0) {
    recommendations.push(
      {
        type: 'study_plan',
        title: 'Start Your SSC CGL Preparation',
        description: 'Begin with taking a diagnostic quiz to understand your current level and identify areas for improvement.',
        actionUrl: '/quiz',
        priority: 1
      },
      {
        type: 'speed',
        title: 'Practice Time Management',
        description: 'SSC CGL success requires speed and accuracy. Take timed mock tests to improve your performance.',
        actionUrl: '/mock-tests',
        priority: 2
      },
      {
        type: 'weakness',
        title: 'Cover All Subjects Equally',
        description: 'Ensure balanced preparation across Mathematics, Reasoning, English, and General Studies.',
        actionUrl: '/subjects',
        priority: 3
      }
    );
  }
  
  return recommendations.slice(0, 5); // Limit to 5 recommendations
}

export async function generateStudyRecommendations(
  userProgress: any,
  recentPerformance: any,
  weakTopics: any[]
): Promise<StudyRecommendation[]> {
  try {
    const recommendations = await retryWithBackoff(async () => {
      const prompt = `
      Based on the following student performance data, generate personalized study recommendations for SSC CGL preparation:

      User Progress:
      ${JSON.stringify(userProgress)}

      Recent Performance:
      ${JSON.stringify(recentPerformance)}

      Weak Topics:
      ${JSON.stringify(weakTopics)}

      Generate 3-5 actionable recommendations with the following format:
      - Identify specific weakness areas that need improvement
      - Recognize strength areas to maintain confidence
      - Suggest speed improvement strategies
      - Recommend specific study actions

      Return response in JSON format with this structure:
      {
        "recommendations": [
          {
            "type": "weakness|strength|speed|study_plan",
            "title": "Brief title",
            "description": "Detailed recommendation",
            "actionUrl": "optional action URL",
            "priority": 1-5
          }
        ]
      }
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          {
            role: "system",
            content: "You are an expert SSC CGL exam preparation tutor. Analyze student performance and provide personalized, actionable study recommendations."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      return result.recommendations || [];
    }, 'Generate Study Recommendations');
    
    return recommendations;
  } catch (error) {
    console.log("OpenAI API unavailable, using fallback recommendations");
    return generateFallbackRecommendations(userProgress, recentPerformance, weakTopics);
  }
}

// Fallback weak topic analysis
function generateFallbackWeakTopics(
  userAttempts: any[],
  topicPerformance: any[]
): WeakTopicAnalysis[] {
  const weakTopics: WeakTopicAnalysis[] = [];
  
  // Analyze topic performance data
  if (topicPerformance && topicPerformance.length > 0) {
    topicPerformance.forEach((topic: any) => {
      const mastery = parseFloat(topic.mastery || '0');
      const accuracy = parseFloat(topic.averageScore || '0');
      
      if (mastery < 60 || accuracy < 70) {
        weakTopics.push({
          topicName: topic.topicId || 'Unknown Topic',
          subject: topic.subjectId || 'Unknown Subject',
          accuracy: accuracy,
          timeSpent: topic.timeSpent || 0,
          recommendedActions: [
            'Review basic concepts and formulas',
            'Practice with easier questions first',
            'Take focused quizzes on this topic',
            'Allocate extra study time this week'
          ]
        });
      }
    });
  }
  
  // Default weak topics if no data
  if (weakTopics.length === 0) {
    weakTopics.push(
      {
        topicName: 'Mathematics - Percentage',
        subject: 'Mathematics',
        accuracy: 45,
        timeSpent: 30,
        recommendedActions: [
          'Review percentage formulas',
          'Practice basic percentage problems',
          'Focus on percentage in profit/loss'
        ]
      },
      {
        topicName: 'Reasoning - Syllogism',
        subject: 'Logical Reasoning',
        accuracy: 50,
        timeSpent: 25,
        recommendedActions: [
          'Learn Venn diagram approach',
          'Practice different syllogism types',
          'Memorize common syllogism patterns'
        ]
      }
    );
  }
  
  return weakTopics.slice(0, 5); // Limit to top 5 weak topics
}

export async function analyzeWeakTopics(
  userAttempts: any[],
  topicPerformance: any[]
): Promise<WeakTopicAnalysis[]> {
  try {
    const weakTopics = await retryWithBackoff(async () => {
      const prompt = `
      Analyze the following quiz and test attempts to identify weak topics for SSC CGL preparation:

      User Attempts:
      ${JSON.stringify(userAttempts)}

      Topic Performance:
      ${JSON.stringify(topicPerformance)}

      Identify topics with:
      - Low accuracy rates (< 70%)
      - High time consumption
      - Consistent errors

      Return response in JSON format:
      {
        "weakTopics": [
          {
            "topicName": "Topic name",
            "subject": "Subject name",
            "accuracy": percentage,
            "timeSpent": minutes,
            "recommendedActions": ["action1", "action2"]
          }
        ]
      }
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          {
            role: "system",
            content: "You are an expert data analyst specializing in educational performance analysis for SSC CGL exam preparation."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      return result.weakTopics || [];
    }, 'Analyze Weak Topics');
    
    return weakTopics;
  } catch (error) {
    console.log("OpenAI API unavailable, using fallback weak topic analysis");
    return generateFallbackWeakTopics(userAttempts, topicPerformance);
  }
}

// Fallback study plan generator
function generateFallbackStudyPlan(
  examDate: string,
  currentLevel: string,
  dailyHours: number,
  weakTopics: string[],
  userProgress: any
): StudyPlanGeneration {
  const subjects = ['Mathematics', 'Logical Reasoning', 'English', 'General Studies'];
  const timePerSubject = Math.floor(dailyHours * 60 / 4); // minutes per subject
  
  const schedule: any = {};
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  days.forEach((day, index) => {
    schedule[day] = [];
    let currentTime = 9; // Start at 9 AM
    
    subjects.forEach((subject, subIndex) => {
      const isWeakTopic = weakTopics.includes(subject.toLowerCase());
      const duration = isWeakTopic ? timePerSubject + 15 : timePerSubject; // Extra time for weak topics
      const endTime = currentTime + (duration / 60);
      
      schedule[day].push({
        timeSlot: `${Math.floor(currentTime)}:${String((currentTime % 1) * 60).padStart(2, '0')} - ${Math.floor(endTime)}:${String((endTime % 1) * 60).padStart(2, '0')}`,
        subject: subject,
        topic: getTopicForSubject(subject, index),
        duration: duration,
        priority: isWeakTopic ? 'high' : 'medium'
      });
      
      currentTime = endTime + 0.25; // 15 min break
    });
    
    // Add mock test on Sunday
    if (day === 'Sunday') {
      schedule[day].push({
        timeSlot: `${Math.floor(currentTime)}:${String((currentTime % 1) * 60).padStart(2, '0')} - ${Math.floor(currentTime + 2)}:${String(((currentTime + 2) % 1) * 60).padStart(2, '0')}`,
        subject: 'Mock Test',
        topic: 'Full Length Mock Test',
        duration: 120,
        priority: 'high'
      });
    }
  });
  
  const examDateObj = new Date(examDate);
  const daysLeft = Math.ceil((examDateObj.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  
  return {
    weeklySchedule: schedule,
    examDate: examDate,
    totalDaysLeft: Math.max(0, daysLeft),
    focusAreas: weakTopics.length > 0 ? weakTopics.slice(0, 3) : ['Mathematics', 'Reasoning', 'English']
  };
}

function getTopicForSubject(subject: string, dayIndex: number): string {
  const topics: { [key: string]: string[] } = {
    'Mathematics': ['Percentage & Ratio', 'Algebra', 'Geometry', 'Number System', 'Data Interpretation', 'Time & Work', 'Speed & Distance'],
    'Logical Reasoning': ['Syllogism', 'Coding-Decoding', 'Blood Relations', 'Direction & Distance', 'Arrangement', 'Analogy', 'Classification'],
    'English': ['Reading Comprehension', 'Grammar', 'Vocabulary', 'Sentence Improvement', 'Error Detection', 'Fill in the Blanks', 'Synonyms & Antonyms'],
    'General Studies': ['History', 'Geography', 'Polity', 'Economics', 'Science', 'Current Affairs', 'Static GK']
  };
  
  const subjectTopics = topics[subject] || ['General Topics'];
  return subjectTopics[dayIndex % subjectTopics.length];
}

export async function generatePersonalizedStudyPlan(
  examDate: string,
  currentLevel: string,
  dailyHours: number,
  weakTopics: string[],
  userProgress: any
): Promise<StudyPlanGeneration | null> {
  try {
    const studyPlan = await retryWithBackoff(async () => {
      const prompt = `
      Generate a personalized weekly study plan for SSC CGL preparation with the following parameters:

      Exam Date: ${examDate}
      Current Level: ${currentLevel}
      Daily Available Hours: ${dailyHours}
      Weak Topics: ${JSON.stringify(weakTopics)}
      Current Progress: ${JSON.stringify(userProgress)}

      Create a 7-day weekly schedule that:
      - Allocates time based on subject weightage (Math: 25%, Reasoning: 25%, English: 25%, GS: 25%)
      - Focuses more time on weak topics
      - Includes regular mock tests
      - Provides adequate revision time
      - Balances difficulty progression

      Return response in JSON format:
      {
        "weeklySchedule": {
          "Monday": [
            {
              "timeSlot": "9:00 - 10:30",
              "subject": "Mathematics",
              "topic": "Percentage & Ratio",
              "duration": 90,
              "priority": "high"
            }
          ],
          ... for all 7 days
        },
        "examDate": "date",
        "totalDaysLeft": number,
        "focusAreas": ["area1", "area2"]
      }
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          {
            role: "system",
            content: "You are an expert SSC CGL exam preparation coach. Create detailed, actionable study plans that maximize learning efficiency."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      return result;
    }, 'Generate Study Plan');
    
    return studyPlan;
  } catch (error) {
    console.log("OpenAI API unavailable, using fallback study plan");
    return generateFallbackStudyPlan(examDate, currentLevel, dailyHours, weakTopics, userProgress);
  }
}

// Fallback explanation generator
function generateFallbackExplanation(
  question: string,
  options: string[],
  correctAnswer: string,
  userAnswer: string
): string {
  const isCorrect = userAnswer === correctAnswer;
  
  let explanation = `**Question Analysis:**\n${question}\n\n`;
  explanation += `**Correct Answer:** ${correctAnswer}\n`;
  explanation += `**Your Answer:** ${userAnswer}\n\n`;
  
  if (isCorrect) {
    explanation += `🎉 **Well Done!** You got this question correct!\n\n`;
    explanation += `**Why this answer is correct:**\n`;
    explanation += `The correct answer is ${correctAnswer}. This demonstrates your understanding of the concept.\n\n`;
  } else {
    explanation += `**Don't worry!** Let's learn from this mistake.\n\n`;
    explanation += `**Why ${correctAnswer} is correct:**\n`;
    explanation += `The correct answer is ${correctAnswer}. Take time to review the related concepts.\n\n`;
    explanation += `**Why ${userAnswer} was not correct:**\n`;
    explanation += `This option might seem plausible but doesn't meet all the requirements of the question.\n\n`;
  }
  
  explanation += `**Key Learning Points:**\n`;
  explanation += `• Review the fundamental concepts related to this topic\n`;
  explanation += `• Practice similar questions to strengthen your understanding\n`;
  explanation += `• Pay attention to keywords in the question\n\n`;
  
  explanation += `**Study Tip:** Practice more questions on this topic to improve your accuracy and speed.`;
  
  return explanation;
}

export async function generateQuizExplanation(
  question: string,
  options: string[],
  correctAnswer: string,
  userAnswer: string
): Promise<string> {
  try {
    const explanation = await retryWithBackoff(async () => {
      const prompt = `
      Provide a detailed explanation for this SSC CGL question:

      Question: ${question}
      Options: ${options.join(', ')}
      Correct Answer: ${correctAnswer}
      User Answer: ${userAnswer}

      Explain:
      1. Why the correct answer is right
      2. Why the user's answer (if different) is wrong
      3. Key concepts to remember
      4. Similar question patterns to watch for

      Keep the explanation clear, educational, and encouraging.
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          {
            role: "system",
            content: "You are an expert SSC CGL tutor. Provide clear, educational explanations that help students learn from their mistakes."
          },
          {
            role: "user",
            content: prompt
          }
        ]
      });

      return response.choices[0].message.content || "Explanation not available.";
    }, 'Generate Quiz Explanation');
    
    return explanation;
  } catch (error) {
    console.log("OpenAI API unavailable, using fallback explanation");
    return generateFallbackExplanation(question, options, correctAnswer, userAnswer);
  }
}
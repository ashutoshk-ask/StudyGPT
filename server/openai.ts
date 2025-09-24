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

export async function generateStudyRecommendations(
  userProgress: any,
  recentPerformance: any,
  weakTopics: any[]
): Promise<StudyRecommendation[]> {
  try {
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
  } catch (error) {
    console.error("Error generating study recommendations:", error);
    return [];
  }
}

export async function analyzeWeakTopics(
  userAttempts: any[],
  topicPerformance: any[]
): Promise<WeakTopicAnalysis[]> {
  try {
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
  } catch (error) {
    console.error("Error analyzing weak topics:", error);
    return [];
  }
}

export async function generatePersonalizedStudyPlan(
  examDate: string,
  currentLevel: string,
  dailyHours: number,
  weakTopics: string[],
  userProgress: any
): Promise<StudyPlanGeneration | null> {
  try {
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
  } catch (error) {
    console.error("Error generating study plan:", error);
    return null;
  }
}

export async function generateQuizExplanation(
  question: string,
  options: string[],
  correctAnswer: string,
  userAnswer: string
): Promise<string> {
  try {
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
  } catch (error) {
    console.error("Error generating quiz explanation:", error);
    return "Unable to generate explanation at this time.";
  }
}

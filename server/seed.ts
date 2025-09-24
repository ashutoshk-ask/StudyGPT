import { db } from "./db";
import { 
  subjects, 
  topics, 
  questions, 
  quizzes, 
  mockTests 
} from "@shared/schema";

const sampleSubjects = [
  {
    name: "Mathematics",
    description: "Quantitative Aptitude covering arithmetic, algebra, geometry, and data interpretation",
    icon: "calculator",
    color: "primary",
    totalTopics: 15,
    weightage: "25.00"
  },
  {
    name: "Reasoning",
    description: "General Intelligence & Reasoning including verbal and non-verbal reasoning",
    icon: "brain", 
    color: "secondary",
    totalTopics: 12,
    weightage: "25.00"
  },
  {
    name: "English",
    description: "English Comprehension covering grammar, vocabulary, and reading comprehension",
    icon: "languages",
    color: "accent", 
    totalTopics: 8,
    weightage: "25.00"
  },
  {
    name: "General Studies",
    description: "General Awareness covering history, geography, polity, economics, and current affairs",
    icon: "globe",
    color: "chart-4",
    totalTopics: 20,
    weightage: "25.00"
  }
];

const sampleTopics = {
  "Mathematics": [
    {
      name: "Percentage",
      description: "Calculation of percentages, percentage increase/decrease, and applications",
      difficulty: "beginner",
      estimatedTime: 90
    },
    {
      name: "Ratio and Proportion", 
      description: "Understanding ratios, proportions, and their applications in problem solving",
      difficulty: "beginner",
      estimatedTime: 120
    },
    {
      name: "Algebra",
      description: "Basic algebraic equations, quadratic equations, and polynomial operations",
      difficulty: "intermediate",
      estimatedTime: 150
    },
    {
      name: "Geometry",
      description: "Mensuration, coordinate geometry, and geometric properties",
      difficulty: "intermediate", 
      estimatedTime: 180
    },
    {
      name: "Data Interpretation",
      description: "Analysis of tables, charts, graphs, and statistical data",
      difficulty: "advanced",
      estimatedTime: 120
    }
  ],
  "Reasoning": [
    {
      name: "Analogies",
      description: "Word analogies and relationship identification",
      difficulty: "beginner",
      estimatedTime: 60
    },
    {
      name: "Classification",
      description: "Odd one out and grouping of similar items",
      difficulty: "beginner", 
      estimatedTime: 45
    },
    {
      name: "Coding-Decoding",
      description: "Letter and number coding patterns",
      difficulty: "intermediate",
      estimatedTime: 90
    },
    {
      name: "Blood Relations",
      description: "Family relationship problems and logical deduction",
      difficulty: "intermediate",
      estimatedTime: 75
    }
  ],
  "English": [
    {
      name: "Grammar",
      description: "Parts of speech, tenses, and sentence construction",
      difficulty: "beginner",
      estimatedTime: 120
    },
    {
      name: "Vocabulary", 
      description: "Synonyms, antonyms, and word meanings",
      difficulty: "beginner",
      estimatedTime: 90
    },
    {
      name: "Reading Comprehension",
      description: "Passage reading and comprehension questions",
      difficulty: "intermediate",
      estimatedTime: 100
    },
    {
      name: "Error Detection",
      description: "Identifying grammatical errors in sentences",
      difficulty: "advanced",
      estimatedTime: 80
    }
  ],
  "General Studies": [
    {
      name: "Indian History",
      description: "Ancient, medieval, and modern Indian history",
      difficulty: "beginner",
      estimatedTime: 180
    },
    {
      name: "Geography",
      description: "Physical and economic geography of India and world",
      difficulty: "beginner", 
      estimatedTime: 150
    },
    {
      name: "Polity",
      description: "Indian constitution, governance, and political system",
      difficulty: "intermediate",
      estimatedTime: 200
    },
    {
      name: "Current Affairs",
      description: "Recent national and international events",
      difficulty: "beginner",
      estimatedTime: 60
    }
  ]
};

const sampleQuestions = {
  "Percentage": [
    {
      questionText: "If 40% of a number is 120, what is 75% of the same number?",
      options: ["225", "250", "300", "280"],
      correctAnswer: "225",
      explanation: "If 40% = 120, then 100% = 300. Therefore, 75% = 225.",
      difficulty: "beginner",
      marks: "2.0",
      negativeMarks: "0.5"
    },
    {
      questionText: "A shopkeeper marks his goods 20% above cost price and gives a discount of 10%. Find his profit percentage.",
      options: ["8%", "10%", "12%", "15%"],
      correctAnswer: "8%", 
      explanation: "Let CP = 100. MP = 120. SP = 120 - 12 = 108. Profit% = 8%.",
      difficulty: "intermediate",
      marks: "2.0",
      negativeMarks: "0.5"
    }
  ],
  "Analogies": [
    {
      questionText: "Book : Author :: Painting : ?",
      options: ["Brush", "Canvas", "Artist", "Color"],
      correctAnswer: "Artist",
      explanation: "As a book is created by an author, a painting is created by an artist.",
      difficulty: "beginner",
      marks: "2.0", 
      negativeMarks: "0.5"
    }
  ],
  "Grammar": [
    {
      questionText: "Choose the correct sentence:",
      options: [
        "He is one of the best player in the team",
        "He is one of the best players in the team", 
        "He is one of the better player in the team",
        "He is one of the good player in the team"
      ],
      correctAnswer: "He is one of the best players in the team",
      explanation: "After 'one of the', we use plural noun form.",
      difficulty: "beginner",
      marks: "2.0",
      negativeMarks: "0.5"
    }
  ],
  "Indian History": [
    {
      questionText: "Who was the founder of the Mauryan Empire?",
      options: ["Ashoka", "Chandragupta Maurya", "Bindusara", "Bimbisara"],
      correctAnswer: "Chandragupta Maurya",
      explanation: "Chandragupta Maurya founded the Mauryan Empire in 321 BCE.",
      difficulty: "beginner",
      marks: "2.0",
      negativeMarks: "0.5"
    }
  ]
};

export async function seedDatabase() {
  try {
    console.log("Starting database seeding...");

    // Clear existing data
    await db.delete(mockTests);
    await db.delete(quizzes);
    await db.delete(questions);
    await db.delete(topics);
    await db.delete(subjects);

    // Insert subjects
    const insertedSubjects = await db.insert(subjects).values(sampleSubjects).returning();
    console.log(`Inserted ${insertedSubjects.length} subjects`);

    // Insert topics
    for (const subject of insertedSubjects) {
      const subjectTopics = sampleTopics[subject.name as keyof typeof sampleTopics] || [];
      const topicsWithSubjectId = subjectTopics.map(topic => ({
        ...topic,
        subjectId: subject.id
      }));
      
      const insertedTopics = await db.insert(topics).values(topicsWithSubjectId).returning();
      console.log(`Inserted ${insertedTopics.length} topics for ${subject.name}`);

      // Insert questions
      for (const topic of insertedTopics) {
        const topicQuestions = sampleQuestions[topic.name as keyof typeof sampleQuestions] || [];
        const questionsWithIds = topicQuestions.map(question => ({
          ...question,
          subjectId: subject.id,
          topicId: topic.id,
          questionType: "mcq"
        }));

        if (questionsWithIds.length > 0) {
          const insertedQuestions = await db.insert(questions).values(questionsWithIds).returning();
          console.log(`Inserted ${insertedQuestions.length} questions for ${topic.name}`);

          // Create a quiz for this topic
          if (insertedQuestions.length >= 5) {
            const quiz = {
              title: `${topic.name} Practice Quiz`,
              description: `Test your knowledge of ${topic.name}`,
              subjectId: subject.id,
              topicId: topic.id,
              questionIds: insertedQuestions.slice(0, 5).map(q => q.id),
              timeLimit: 15,
              totalMarks: "10.0",
              isActive: true
            };

            await db.insert(quizzes).values(quiz);
            console.log(`Created quiz for ${topic.name}`);
          }
        }
      }
    }

    // Create mock tests
    const allQuestions = await db.select().from(questions);
    const mathQuestions = allQuestions.filter(q => q.subjectId === insertedSubjects.find(s => s.name === "Mathematics")?.id).slice(0, 25);
    const reasoningQuestions = allQuestions.filter(q => q.subjectId === insertedSubjects.find(s => s.name === "Reasoning")?.id).slice(0, 25);
    const englishQuestions = allQuestions.filter(q => q.subjectId === insertedSubjects.find(s => s.name === "English")?.id).slice(0, 25);
    const gsQuestions = allQuestions.filter(q => q.subjectId === insertedSubjects.find(s => s.name === "General Studies")?.id).slice(0, 25);

    if (mathQuestions.length >= 10 && reasoningQuestions.length >= 10) {
      const mockTest = {
        title: "SSC CGL Mock Test 2024 - Tier 1",
        description: "Full length mock test as per SSC CGL Tier-1 pattern",
        examPattern: "ssc_cgl_tier1",
        sections: [
          {
            name: "Mathematics",
            timeLimit: 15,
            questionIds: mathQuestions.slice(0, 25).map(q => q.id)
          },
          {
            name: "Reasoning", 
            timeLimit: 15,
            questionIds: reasoningQuestions.slice(0, 25).map(q => q.id)
          },
          {
            name: "English",
            timeLimit: 15,
            questionIds: englishQuestions.slice(0, 25).map(q => q.id)
          },
          {
            name: "General Studies",
            timeLimit: 15,
            questionIds: gsQuestions.slice(0, 25).map(q => q.id)
          }
        ],
        timeLimit: 60,
        totalQuestions: 100,
        totalMarks: "200.0",
        isActive: true
      };

      await db.insert(mockTests).values(mockTest);
      console.log("Created mock test");
    }

    console.log("Database seeding completed successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  }
}

// Run seeding if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase()
    .then(() => {
      console.log("Seeding completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Seeding failed:", error);
      process.exit(1);
    });
}

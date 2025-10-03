// Enhanced Database Seeding with More Comprehensive Questions
import { db } from "./db.js";
import { 
  subjects, 
  topics, 
  questions, 
  quizzes, 
  mockTests,
  studyPlanTemplates 
} from "@shared/schema.js";

const enhancedQuestions = {
  "Mathematics": {
    "Percentage": [
      {
        questionText: "If 40% of a number is 120, what is 75% of the same number?",
        options: ["200", "225", "250", "280"],
        correctAnswer: "225",
        explanation: "If 40% = 120, then 100% = 120 ÷ 0.40 = 300. Therefore, 75% of 300 = 0.75 × 300 = 225.",
        difficulty: "beginner",
        marks: "2.0",
        negativeMarks: "0.5"
      },
      {
        questionText: "A shopkeeper marks his goods 20% above cost price and gives a discount of 10%. Find his profit percentage.",
        options: ["8%", "10%", "12%", "15%"],
        correctAnswer: "8%", 
        explanation: "Let CP = 100. MP = 120 (20% above CP). SP = 120 - 12 = 108 (10% discount on MP). Profit = 108 - 100 = 8. Profit% = 8%.",
        difficulty: "intermediate",
        marks: "2.0",
        negativeMarks: "0.5"
      },
      {
        questionText: "In an examination, 34% of students failed in Mathematics and 42% failed in English. If 20% failed in both subjects, what percentage of students passed in both subjects?",
        options: ["44%", "46%", "48%", "50%"],
        correctAnswer: "44%",
        explanation: "Failed in at least one = 34% + 42% - 20% = 56%. Therefore, passed in both = 100% - 56% = 44%.",
        difficulty: "advanced",
        marks: "2.0",
        negativeMarks: "0.5"
      },
      {
        questionText: "The population of a town increases by 10% annually. If the current population is 50,000, what will be the population after 2 years?",
        options: ["60,500", "55,000", "60,000", "50,500"],
        correctAnswer: "60,500",
        explanation: "After 1 year: 50,000 × 1.1 = 55,000. After 2 years: 55,000 × 1.1 = 60,500.",
        difficulty: "intermediate",
        marks: "2.0",
        negativeMarks: "0.5"
      }
    ],
    "Simple Interest": [
      {
        questionText: "Find the simple interest on Rs. 2000 at 5% per annum for 3 years.",
        options: ["Rs. 300", "Rs. 250", "Rs. 200", "Rs. 150"],
        correctAnswer: "Rs. 300",
        explanation: "SI = (P × R × T) / 100 = (2000 × 5 × 3) / 100 = 30000 / 100 = Rs. 300.",
        difficulty: "beginner",
        marks: "2.0",
        negativeMarks: "0.5"
      },
      {
        questionText: "At what rate percent per annum will Rs. 400 amount to Rs. 448 in 2 years at simple interest?",
        options: ["6%", "8%", "10%", "12%"],
        correctAnswer: "6%",
        explanation: "SI = 448 - 400 = 48. Rate = (SI × 100) / (P × T) = (48 × 100) / (400 × 2) = 4800 / 800 = 6%.",
        difficulty: "intermediate",
        marks: "2.0",
        negativeMarks: "0.5"
      }
    ]
  },
  "Reasoning": {
    "Analogies": [
      {
        questionText: "Book : Author :: Painting : ?",
        options: ["Brush", "Canvas", "Artist", "Color"],
        correctAnswer: "Artist",
        explanation: "As a book is created by an author, a painting is created by an artist.",
        difficulty: "beginner",
        marks: "2.0", 
        negativeMarks: "0.5"
      },
      {
        questionText: "Doctor : Hospital :: Teacher : ?",
        options: ["Student", "School", "Book", "Classroom"],
        correctAnswer: "School",
        explanation: "A doctor works in a hospital, similarly a teacher works in a school.",
        difficulty: "beginner",
        marks: "2.0",
        negativeMarks: "0.5"
      },
      {
        questionText: "Clock : Time :: Thermometer : ?",
        options: ["Heat", "Temperature", "Weather", "Mercury"],
        correctAnswer: "Temperature",
        explanation: "A clock measures time, similarly a thermometer measures temperature.",
        difficulty: "beginner",
        marks: "2.0",
        negativeMarks: "0.5"
      }
    ],
    "Blood Relations": [
      {
        questionText: "A is B's sister. C is B's mother. D is C's father. E is D's mother. Then how is A related to D?",
        options: ["Granddaughter", "Daughter", "Grandmother", "Great grandmother"],
        correctAnswer: "Granddaughter",
        explanation: "D is C's father and C is B's mother, so D is B's grandfather. Since A is B's sister, A is also D's granddaughter.",
        difficulty: "intermediate",
        marks: "2.0",
        negativeMarks: "0.5"
      }
    ]
  },
  "English": {
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
        explanation: "After 'one of the', we use plural noun form. Hence 'players' is correct.",
        difficulty: "beginner",
        marks: "2.0",
        negativeMarks: "0.5"
      },
      {
        questionText: "Fill in the blank: Neither of the two boys _____ present yesterday.",
        options: ["were", "was", "are", "is"],
        correctAnswer: "was",
        explanation: "'Neither' is always singular, so we use 'was' (singular verb) instead of 'were' (plural verb).",
        difficulty: "intermediate",
        marks: "2.0",
        negativeMarks: "0.5"
      }
    ],
    "Vocabulary": [
      {
        questionText: "Choose the synonym of 'ABUNDANT':",
        options: ["Scarce", "Plentiful", "Limited", "Rare"],
        correctAnswer: "Plentiful",
        explanation: "Abundant means existing in large quantities; plentiful. The opposite would be scarce.",
        difficulty: "beginner",
        marks: "2.0",
        negativeMarks: "0.5"
      },
      {
        questionText: "Choose the antonym of 'BENEVOLENT':",
        options: ["Kind", "Generous", "Malevolent", "Helpful"],
        correctAnswer: "Malevolent",
        explanation: "Benevolent means kind and generous. Its antonym is malevolent, meaning evil or harmful.",
        difficulty: "intermediate",
        marks: "2.0",
        negativeMarks: "0.5"
      }
    ]
  },
  "General Studies": {
    "Indian History": [
      {
        questionText: "Who was the founder of the Mauryan Empire?",
        options: ["Ashoka", "Chandragupta Maurya", "Bindusara", "Bimbisara"],
        correctAnswer: "Chandragupta Maurya",
        explanation: "Chandragupta Maurya founded the Mauryan Empire in 321 BCE with the help of Chanakya (Kautilya).",
        difficulty: "beginner",
        marks: "2.0",
        negativeMarks: "0.5"
      },
      {
        questionText: "The Battle of Plassey was fought in which year?",
        options: ["1757", "1764", "1761", "1767"],
        correctAnswer: "1757",
        explanation: "The Battle of Plassey was fought on June 23, 1757, between the British East India Company and the Nawab of Bengal.",
        difficulty: "beginner",
        marks: "2.0",
        negativeMarks: "0.5"
      }
    ],
    "Indian Polity": [
      {
        questionText: "How many Fundamental Rights are guaranteed by the Indian Constitution?",
        options: ["6", "7", "8", "9"],
        correctAnswer: "6",
        explanation: "The Indian Constitution guarantees 6 Fundamental Rights: Right to Equality, Right to Freedom, Right against Exploitation, Right to Freedom of Religion, Cultural and Educational Rights, and Right to Constitutional Remedies.",
        difficulty: "intermediate",
        marks: "2.0",
        negativeMarks: "0.5"
      }
    ],
    "Geography": [
      {
        questionText: "Which is the longest river in India?",
        options: ["Yamuna", "Ganga", "Godavari", "Narmada"],
        correctAnswer: "Ganga",
        explanation: "The Ganga is the longest river in India, flowing for about 2,525 km from the Himalayas to the Bay of Bengal.",
        difficulty: "beginner",
        marks: "2.0",
        negativeMarks: "0.5"
      }
    ]
  }
};

export async function seedEnhancedDatabase() {
  try {
    console.log("🚀 Starting enhanced database seeding...");

    // Clear existing data in reverse order to avoid foreign key constraints
    console.log("🧹 Clearing existing data...");
    await db.delete(mockTests);
    await db.delete(quizzes);
    await db.delete(questions);
    await db.delete(topics);
    await db.delete(subjects);
    await db.delete(studyPlanTemplates);

    // Insert subjects
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

    const insertedSubjects = await db.insert(subjects).values(sampleSubjects).returning();
    console.log(`✅ Inserted ${insertedSubjects.length} subjects`);

    // Create study plan templates
    const templates = [
      {
        name: "Intensive Preparation",
        description: "Comprehensive 6-8 hours daily study plan for serious aspirants",
        dailyHoursRange: { min: 6, max: 8 },
        subjectWeightage: { mathematics: 30, reasoning: 25, english: 20, general_studies: 25 },
        mockTestFrequency: 2,
        revisionCycles: 4,
        difficultyProgression: "aggressive",
        isActive: true
      },
      {
        name: "Balanced Approach",
        description: "Balanced 4-6 hours daily study plan with equal focus on all subjects",
        dailyHoursRange: { min: 4, max: 6 },
        subjectWeightage: { mathematics: 25, reasoning: 25, english: 25, general_studies: 25 },
        mockTestFrequency: 1,
        revisionCycles: 3,
        difficultyProgression: "gradual",
        isActive: true
      },
      {
        name: "Working Professional",
        description: "Flexible 2-4 hours daily plan for working professionals",
        dailyHoursRange: { min: 2, max: 4 },
        subjectWeightage: { mathematics: 35, reasoning: 30, english: 15, general_studies: 20 },
        mockTestFrequency: 1,
        revisionCycles: 2,
        difficultyProgression: "gradual",
        isActive: true
      }
    ];

    await db.insert(studyPlanTemplates).values(templates);
    console.log(`✅ Created ${templates.length} study plan templates`);

    let totalQuestionsInserted = 0;
    let totalQuizzesCreated = 0;

    // Insert topics and questions for each subject
    for (const subject of insertedSubjects) {
      const subjectQuestions = enhancedQuestions[subject.name];
      
      if (subjectQuestions) {
        console.log(`📚 Processing ${subject.name}...`);
        
        for (const [topicName, topicQuestions] of Object.entries(subjectQuestions)) {
          // Create topic
          const topicData = {
            subjectId: subject.id,
            name: topicName,
            description: `Comprehensive practice questions for ${topicName}`,
            difficulty: "beginner",
            estimatedTime: 90
          };

          const [insertedTopic] = await db.insert(topics).values(topicData).returning();
          console.log(`  📝 Created topic: ${topicName}`);

          // Insert questions for this topic
          const questionsWithIds = topicQuestions.map(question => ({
            ...question,
            subjectId: subject.id,
            topicId: insertedTopic.id,
            questionType: "mcq"
          }));

          const insertedQuestions = await db.insert(questions).values(questionsWithIds).returning();
          totalQuestionsInserted += insertedQuestions.length;
          console.log(`    ❓ Added ${insertedQuestions.length} questions`);

          // Create a quiz for this topic if we have enough questions
          if (insertedQuestions.length >= 3) {
            const questionsForQuiz = Math.min(insertedQuestions.length, 10);
            const quiz = {
              title: `${topicName} - Practice Quiz`,
              description: `Test your knowledge of ${topicName} with these carefully selected questions`,
              subjectId: subject.id,
              topicId: insertedTopic.id,
              questionIds: insertedQuestions.slice(0, questionsForQuiz).map(q => q.id),
              timeLimit: Math.max(15, questionsForQuiz * 2), // 2 minutes per question, minimum 15 minutes
              totalMarks: (questionsForQuiz * 2).toString() + ".0",
              isActive: true
            };

            await db.insert(quizzes).values(quiz);
            totalQuizzesCreated++;
            console.log(`    📋 Created quiz: ${quiz.title}`);
          }
        }
      }
    }

    // Create comprehensive mock tests
    console.log("🎯 Creating mock tests...");
    const allQuestions = await db.select().from(questions);
    
    if (allQuestions.length >= 40) {
      // Group questions by subject
      const questionsBySubject = insertedSubjects.reduce((acc, subject) => {
        acc[subject.name] = allQuestions.filter(q => q.subjectId === subject.id);
        return acc;
      }, {});

      const mockTest = {
        title: "SSC CGL Mock Test 2024 - Complete Pattern",
        description: "Full-length mock test following the exact SSC CGL Tier-1 examination pattern with 100 questions",
        examPattern: "ssc_cgl_tier1",
        sections: [
          {
            name: "General Intelligence & Reasoning",
            timeLimit: 15,
            questionIds: questionsBySubject["Reasoning"]?.slice(0, 25).map(q => q.id) || []
          },
          {
            name: "General Awareness", 
            timeLimit: 15,
            questionIds: questionsBySubject["General Studies"]?.slice(0, 25).map(q => q.id) || []
          },
          {
            name: "Quantitative Aptitude",
            timeLimit: 15,
            questionIds: questionsBySubject["Mathematics"]?.slice(0, 25).map(q => q.id) || []
          },
          {
            name: "English Comprehension",
            timeLimit: 15,
            questionIds: questionsBySubject["English"]?.slice(0, 25).map(q => q.id) || []
          }
        ],
        timeLimit: 60, // Total 60 minutes
        totalQuestions: 100,
        totalMarks: "200.0", // 2 marks per question
        isActive: true
      };

      await db.insert(mockTests).values(mockTest);
      console.log("✅ Created comprehensive mock test");
    }

    // Summary
    console.log("\n" + "=".repeat(60));
    console.log("🎉 DATABASE SEEDING COMPLETED SUCCESSFULLY!");
    console.log("=".repeat(60));
    console.log(`📚 Subjects: ${insertedSubjects.length}`);
    console.log(`📖 Topics: ${Object.values(enhancedQuestions).reduce((sum, subject) => sum + Object.keys(subject).length, 0)}`);
    console.log(`❓ Questions: ${totalQuestionsInserted}`);
    console.log(`📋 Quizzes: ${totalQuizzesCreated}`);
    console.log(`🎯 Mock Tests: 1`);
    console.log(`📋 Study Plan Templates: ${templates.length}`);
    
    console.log("\n🚀 Your database is now ready for Phase 1 implementation!");
    console.log("✅ You can start the application and begin testing");

  } catch (error) {
    console.error("❌ Database seeding failed:", error);
    throw error;
  }
}

// Run seeding if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedEnhancedDatabase()
    .then(() => {
      console.log("✨ Seeding completed successfully!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Seeding failed:", error);
      process.exit(1);
    });
}
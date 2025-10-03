// Simple script to check database contents
import { db } from './server/db.js';
import { subjects, topics, questions, quizzes, mockTests } from './shared/schema.js';
import { count, eq } from 'drizzle-orm';

async function checkDatabase() {
  try {
    console.log('🔍 Checking database contents...\n');
    
    // Count subjects
    const subjectCount = await db.select({ count: count() }).from(subjects);
    console.log(`📚 Subjects: ${subjectCount[0]?.count || 0}`);
    
    // List subjects with their topic counts
    const allSubjects = await db.select().from(subjects);
    for (const subject of allSubjects) {
      const topicCount = await db.select({ count: count() })
        .from(topics)
        .where(eq(topics.subjectId, subject.id));
      
      const questionCount = await db.select({ count: count() })
        .from(questions)
        .where(eq(questions.subjectId, subject.id));
        
      console.log(`  └─ ${subject.name}: ${topicCount[0]?.count || 0} topics, ${questionCount[0]?.count || 0} questions`);
    }
    
    // Count total questions
    const questionCount = await db.select({ count: count() }).from(questions);
    console.log(`\n❓ Total Questions: ${questionCount[0]?.count || 0}`);
    
    // Count quizzes
    const quizCount = await db.select({ count: count() }).from(quizzes);
    console.log(`📝 Quizzes: ${quizCount[0]?.count || 0}`);
    
    // Count mock tests
    const mockTestCount = await db.select({ count: count() }).from(mockTests);
    console.log(`🎯 Mock Tests: ${mockTestCount[0]?.count || 0}`);
    
    // Show sample questions
    if (questionCount[0]?.count > 0) {
      console.log('\n📋 Sample Questions:');
      const sampleQuestions = await db.select({
        subject: subjects.name,
        topic: topics.name,
        question: questions.questionText,
        difficulty: questions.difficulty
      })
      .from(questions)
      .leftJoin(subjects, eq(questions.subjectId, subjects.id))
      .leftJoin(topics, eq(questions.topicId, topics.id))
      .limit(5);
      
      sampleQuestions.forEach((q, i) => {
        console.log(`  ${i + 1}. [${q.subject}/${q.topic}] ${q.question?.substring(0, 60)}... (${q.difficulty})`);
      });
    }
    
    console.log('\n✅ Database check completed!');
    
  } catch (error) {
    console.error('❌ Database check failed:', error.message);
    console.log('\n💡 This might mean:');
    console.log('  1. Database is not set up yet');
    console.log('  2. DATABASE_URL environment variable is not set');
    console.log('  3. Database migration needs to be run');
    console.log('  4. Database seeding has not been done');
  }
  
  process.exit(0);
}

checkDatabase();
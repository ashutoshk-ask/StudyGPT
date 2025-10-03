#!/usr/bin/env node

// Database Connection Helper for Replit
// This script helps connect to your Replit database and check the current data

import { config } from 'dotenv';
config(); // Load environment variables

console.log('🔗 SSC CGL Database Connection Helper\n');

// Check if DATABASE_URL is available
const dbUrl = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_mo6jGD5MnqVE@ep-delicate-bar-a6yiv3b0.us-west-2.aws.neon.tech/neondb?sslmode=require";

if (!dbUrl) {
  console.log('❌ DATABASE_URL not found in environment variables.\n');
  console.log('📝 To connect to your Replit database:');
  console.log('   1. Copy your DATABASE_URL from Replit');
  console.log('   2. Create a .env file in the root directory');
  console.log('   3. Add: DATABASE_URL="your-connection-string"');
  console.log('   4. Run this script again\n');
  
  console.log('💡 Your DATABASE_URL should look like:');
  console.log('   postgresql://username:password@host:port/database');
  console.log('   or');
  console.log('   postgres://username:password@host:port/database\n');
  
  process.exit(1);
}

console.log('✅ DATABASE_URL found!');
console.log(`🔗 Connecting to: ${dbUrl.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}\n`);

// Now try to connect and check data
try {
  const { db } = await import('./server/db.js');
  const { subjects, topics, questions, quizzes, mockTests } = await import('./shared/schema.js');
  const { count, eq } = await import('drizzle-orm');
  
  console.log('📊 Checking your current database contents...\n');
  
  // Count subjects
  const subjectCount = await db.select({ count: count() }).from(subjects);
  console.log(`📚 Subjects in database: ${subjectCount[0]?.count || 0}`);
  
  if (subjectCount[0]?.count > 0) {
    // List subjects with their question counts
    const allSubjects = await db.select().from(subjects);
    console.log('\n📋 Subject breakdown:');
    
    let totalQuestions = 0;
    for (const subject of allSubjects) {
      const questionCount = await db.select({ count: count() })
        .from(questions)
        .where(eq(questions.subjectId, subject.id));
      
      const topicCount = await db.select({ count: count() })
        .from(topics)
        .where(eq(topics.subjectId, subject.id));
        
      const qCount = questionCount[0]?.count || 0;
      totalQuestions += qCount;
      
      console.log(`  📖 ${subject.name}: ${qCount} questions across ${topicCount[0]?.count || 0} topics`);
    }
    
    console.log(`\n🎯 Total Questions Available: ${totalQuestions}`);
    
    // Check quizzes and mock tests
    const quizCount = await db.select({ count: count() }).from(quizzes);
    const mockTestCount = await db.select({ count: count() }).from(mockTests);
    
    console.log(`📝 Quizzes: ${quizCount[0]?.count || 0}`);
    console.log(`🎪 Mock Tests: ${mockTestCount[0]?.count || 0}`);
    
    // Show sample questions by subject
    console.log('\n📝 Sample questions by subject:');
    for (const subject of allSubjects) {
      const sampleQuestions = await db.select({
        question: questions.questionText,
        topic: topics.name,
        difficulty: questions.difficulty
      })
      .from(questions)
      .leftJoin(topics, eq(questions.topicId, topics.id))
      .where(eq(questions.subjectId, subject.id))
      .limit(2);
      
      if (sampleQuestions.length > 0) {
        console.log(`\n  🔸 ${subject.name}:`);
        sampleQuestions.forEach((q, i) => {
          const questionPreview = q.question?.substring(0, 80) + (q.question?.length > 80 ? '...' : '');
          console.log(`    ${i + 1}. [${q.topic}] ${questionPreview} (${q.difficulty})`);
        });
      }
    }
    
    // Assessment
    console.log('\n' + '='.repeat(60));
    console.log('📊 DATABASE ASSESSMENT:');
    console.log('='.repeat(60));
    
    if (totalQuestions < 100) {
      console.log('⚠️  LOW QUESTION COUNT: Need more questions for comprehensive testing');
      console.log('   Recommendation: Add 50-100 questions per subject');
    } else if (totalQuestions < 500) {
      console.log('✅ GOOD FOUNDATION: Sufficient for basic functionality');
      console.log('   Recommendation: Gradually expand question bank');
    } else {
      console.log('🎉 EXCELLENT: Rich question bank available!');
    }
    
    console.log('\n🚀 Ready to proceed with Phase 1 implementation!');
    
  } else {
    console.log('📭 Database is empty. Need to seed with initial data.');
    console.log('\n💡 To populate your database:');
    console.log('   1. Run: npm run db:push (to create tables)');
    console.log('   2. Run: npm run seed (to add sample data)');
    console.log('   3. Or: node server/seed.js (direct seeding)');
  }
  
} catch (error) {
  console.error('❌ Connection failed:', error.message);
  console.log('\n🔧 Troubleshooting steps:');
  console.log('   1. Verify DATABASE_URL is correct');
  console.log('   2. Check if database server is running');
  console.log('   3. Ensure database exists and is accessible');
  console.log('   4. Run: npm run db:push (to create/update tables)');
}

process.exit(0);
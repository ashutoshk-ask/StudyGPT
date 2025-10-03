import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { count, eq } from 'drizzle-orm';
import * as schema from './shared/schema.js';

const DATABASE_URL = "postgresql://neondb_owner:npg_mo6jGD5MnqVE@ep-delicate-bar-a6yiv3b0.us-west-2.aws.neon.tech/neondb?sslmode=require";

async function checkYourDatabase() {
  console.log('🔍 Connecting to your Neon database...\n');
  
  try {
    const pool = new Pool({ connectionString: DATABASE_URL });
    const db = drizzle({ client: pool, schema });
    
    console.log('✅ Connection successful!\n');
    
    // Check subjects
    console.log('📚 Checking subjects...');
    const subjects = await db.select().from(schema.subjects);
    console.log(`Found ${subjects.length} subjects:`);
    subjects.forEach(subject => {
      console.log(`  - ${subject.name}: ${subject.description}`);
    });
    
    // Check total questions
    console.log('\n❓ Checking questions...');
    const questionCount = await db.select({ count: count() }).from(schema.questions);
    console.log(`Total questions in database: ${questionCount[0]?.count || 0}`);
    
    // Check questions by subject
    for (const subject of subjects) {
      const subjectQuestions = await db.select({ count: count() })
        .from(schema.questions)
        .where(eq(schema.questions.subjectId, subject.id));
      
      console.log(`  ${subject.name}: ${subjectQuestions[0]?.count || 0} questions`);
    }
    
    // Sample questions
    if (questionCount[0]?.count > 0) {
      console.log('\n📝 Sample questions (first 5):');
      const sampleQuestions = await db.select({
        question: schema.questions.questionText,
        subject: schema.subjects.name,
        difficulty: schema.questions.difficulty,
        options: schema.questions.options
      })
      .from(schema.questions)
      .leftJoin(schema.subjects, eq(schema.questions.subjectId, schema.subjects.id))
      .limit(5);
      
      sampleQuestions.forEach((q, i) => {
        console.log(`\n${i + 1}. [${q.subject}] ${q.question} (${q.difficulty})`);
        if (q.options && Array.isArray(q.options)) {
          q.options.forEach((option, idx) => {
            console.log(`   ${String.fromCharCode(65 + idx)}. ${option}`);
          });
        }
      });
    }
    
    // Check quizzes and mock tests
    const quizCount = await db.select({ count: count() }).from(schema.quizzes);
    const mockTestCount = await db.select({ count: count() }).from(schema.mockTests);
    
    console.log(`\n📊 Assessment Summary:`);
    console.log(`   Quizzes: ${quizCount[0]?.count || 0}`);
    console.log(`   Mock Tests: ${mockTestCount[0]?.count || 0}`);
    
    // Assessment
    const totalQuestions = questionCount[0]?.count || 0;
    console.log('\n' + '='.repeat(50));
    console.log('🎯 PHASE 1 READINESS ASSESSMENT:');
    console.log('='.repeat(50));
    
    if (totalQuestions === 0) {
      console.log('❌ NO QUESTIONS FOUND');
      console.log('   → Need to seed database with sample questions');
      console.log('   → Run database seeding script');
    } else if (totalQuestions < 50) {
      console.log('⚠️  LIMITED QUESTION BANK');
      console.log(`   → Found ${totalQuestions} questions`);
      console.log('   → Need 200+ questions for comprehensive testing');
      console.log('   → Can proceed with basic functionality');
    } else if (totalQuestions < 200) {
      console.log('✅ GOOD FOUNDATION');
      console.log(`   → Found ${totalQuestions} questions`);
      console.log('   → Sufficient for Phase 1 implementation');
      console.log('   → Recommend expanding to 500+ questions over time');
    } else {
      console.log('🎉 EXCELLENT QUESTION BANK');
      console.log(`   → Found ${totalQuestions} questions`);
      console.log('   → Ready for full Phase 1 implementation!');
    }
    
    console.log('\n🚀 Next Steps:');
    if (totalQuestions < 20) {
      console.log('   1. Run database seeding to add sample questions');
      console.log('   2. Implement quiz interface with existing questions');
      console.log('   3. Gradually add more questions by subject');
    } else {
      console.log('   1. ✅ Proceed with Phase 1 implementation');
      console.log('   2. ✅ Complete quiz interface development');
      console.log('   3. ✅ Add performance analytics');
    }
    
    await pool.end();
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.log('\n🔧 Possible issues:');
    console.log('   - Database credentials incorrect');
    console.log('   - Database not accessible');
    console.log('   - Tables not created yet');
    
    if (error.message.includes('relation') && error.message.includes('does not exist')) {
      console.log('\n💡 Solution: Run database migration');
      console.log('   → Tables need to be created first');
    }
  }
}

// Run the check
checkYourDatabase().catch(console.error);
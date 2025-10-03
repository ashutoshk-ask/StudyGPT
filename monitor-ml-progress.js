import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { sql } from 'drizzle-orm';

const DATABASE_CONFIG = {
  connectionString: "postgresql://neondb_owner:npg_mo6jGD5MnqVE@ep-delicate-bar-a6yiv3b0.us-west-2.aws.neon.tech/neondb?sslmode=require"
};

async function monitorMLProgress() {
  console.log('🤖 SSC CGL ML Training Progress Monitor\n');
  
  try {
    const pool = new Pool({ connectionString: DATABASE_CONFIG.connectionString });
    const db = drizzle({ client: pool, schema: {} });
    
    // 1. Current question bank status
    console.log('📊 QUESTION BANK STATUS:');
    console.log('=' * 25);
    
    const questionStats = await db.execute(sql`
      SELECT 
        s.name as subject,
        COUNT(q.id) as total_questions,
        COUNT(CASE WHEN q.difficulty = 'beginner' THEN 1 END) as beginner,
        COUNT(CASE WHEN q.difficulty = 'intermediate' THEN 1 END) as intermediate,
        COUNT(CASE WHEN q.difficulty = 'advanced' THEN 1 END) as advanced,
        COUNT(DISTINCT t.id) as topics_covered
      FROM subjects s
      LEFT JOIN topics t ON s.id = t.subjectId
      LEFT JOIN questions q ON t.id = q.topicId
      GROUP BY s.id, s.name
      ORDER BY total_questions DESC;
    `);
    
    let totalQuestions = 0;
    for (const row of questionStats.rows) {
      const count = parseInt(row.total_questions || 0);
      totalQuestions += count;
      console.log(`📚 ${row.subject}: ${count} questions (${row.topics_covered} topics)`);
      console.log(`   └── Beginner: ${row.beginner} | Intermediate: ${row.intermediate} | Advanced: ${row.advanced}`);
    }
    
    const progressToTarget = ((totalQuestions / 15000) * 100).toFixed(1);
    console.log(`\n🎯 Progress to 15K target: ${totalQuestions}/15,000 (${progressToTarget}%)`);
    
    // 2. Mock test performance
    console.log(`\n🏆 MOCK TEST ANALYTICS:`);
    console.log('=' * 23);
    
    const mockTestStats = await db.execute(sql`
      SELECT 
        mt.title,
        mt.totalQuestions,
        COUNT(mta.id) as attempts,
        ROUND(AVG(mta.percentage), 2) as avg_score,
        ROUND(AVG(mta.timeSpent), 0) as avg_time_minutes
      FROM mockTests mt
      LEFT JOIN mockTestAttempts mta ON mt.id = mta.mockTestId
      WHERE mt.isActive = true
      GROUP BY mt.id, mt.title, mt.totalQuestions
      ORDER BY attempts DESC;
    `);
    
    if (mockTestStats.rows.length > 0) {
      mockTestStats.rows.forEach((row, index) => {
        console.log(`${index + 1}. ${row.title}`);
        console.log(`   📝 Questions: ${row.totalQuestions} | Attempts: ${row.attempts || 0}`);
        if (row.attempts > 0) {
          console.log(`   📊 Avg Score: ${row.avg_score}% | Avg Time: ${row.avg_time_minutes}min`);
        }
      });
    } else {
      console.log('   📝 No mock test attempts yet - ready for first users!');
    }
    
    // 3. ML training data collection
    console.log(`\n🧠 ML TRAINING DATA:`);
    console.log('=' * 19);
    
    try {
      const trainingDataStats = await db.execute(sql`
        SELECT 
          COUNT(*) as total_interactions,
          COUNT(DISTINCT user_id) as unique_users,
          COUNT(DISTINCT question_id) as questions_attempted,
          ROUND(AVG(CASE WHEN is_correct THEN 1.0 ELSE 0.0 END) * 100, 2) as overall_accuracy,
          COUNT(CASE WHEN timestamp > NOW() - INTERVAL '24 hours' THEN 1 END) as recent_interactions
        FROM ml_training_data;
      `);
      
      const stats = trainingDataStats.rows[0];
      if (stats && parseInt(stats.total_interactions) > 0) {
        console.log(`📈 Total Interactions: ${stats.total_interactions}`);
        console.log(`👥 Unique Users: ${stats.unique_users}`);
        console.log(`❓ Questions Attempted: ${stats.questions_attempted}`);
        console.log(`🎯 Overall Accuracy: ${stats.overall_accuracy}%`);
        console.log(`⏰ Recent (24h): ${stats.recent_interactions} interactions`);
        
        // ML model readiness assessment
        const interactions = parseInt(stats.total_interactions);
        const users = parseInt(stats.unique_users);
        
        console.log(`\n🤖 ML MODEL READINESS:`);
        if (interactions >= 1000 && users >= 10) {
          console.log('✅ Knowledge Tracing: Ready for training');
        } else {
          console.log(`⚠️  Knowledge Tracing: Need ${Math.max(0, 1000 - interactions)} more interactions`);
        }
        
        if (interactions >= 500 && users >= 5) {
          console.log('✅ Performance Prediction: Ready for training');
        } else {
          console.log(`⚠️  Performance Prediction: Need ${Math.max(0, 500 - interactions)} more interactions`);
        }
        
        if (interactions >= 2000 && users >= 20) {
          console.log('✅ Adaptive Testing: Ready for deployment');
        } else {
          console.log(`⚠️  Adaptive Testing: Need ${Math.max(0, 2000 - interactions)} more interactions`);
        }
        
      } else {
        console.log('📊 No training data collected yet');
        console.log('💡 Start by having users take mock tests to generate ML training data');
      }
      
    } catch (error) {
      console.log('📊 ML training data table not found - will be created on first user interaction');
    }
    
    // 4. System recommendations
    console.log(`\n💡 RECOMMENDATIONS:`);
    console.log('=' * 17);
    
    if (totalQuestions < 1000) {
      console.log('🔥 HIGH PRIORITY:');
      console.log(`   📚 Add more questions (currently ${totalQuestions}/15,000)`);
      console.log('   🎯 Focus on balanced distribution across subjects and difficulties');
    } else if (totalQuestions < 5000) {
      console.log('🟡 MEDIUM PRIORITY:');
      console.log(`   📚 Continue adding questions (${totalQuestions}/15,000)`);
      console.log('   🤖 Start collecting user interaction data for ML training');
    } else {
      console.log('🟢 GOOD PROGRESS:');
      console.log(`   📚 Excellent question bank (${totalQuestions}/15,000)`);
      console.log('   🚀 Focus on user acquisition and ML model optimization');
    }
    
    // Check for specific gaps
    const subjectGaps = questionStats.rows.filter(row => parseInt(row.total_questions) < 100);
    if (subjectGaps.length > 0) {
      console.log(`\n⚠️  SUBJECT GAPS (< 100 questions):`);
      subjectGaps.forEach(gap => {
        console.log(`   📉 ${gap.subject}: ${gap.total_questions} questions`);
      });
    }
    
    // 5. Next milestones
    console.log(`\n🎯 NEXT MILESTONES:`);
    console.log('=' * 16);
    
    const milestones = [
      { target: 1000, label: 'Basic ML Training Ready' },
      { target: 2500, label: 'Advanced Analytics Ready' }, 
      { target: 5000, label: 'Production ML Models' },
      { target: 10000, label: 'Comprehensive Question Bank' },
      { target: 15000, label: 'Complete SSC CGL Coverage' }
    ];
    
    for (const milestone of milestones) {
      const isComplete = totalQuestions >= milestone.target;
      const remaining = Math.max(0, milestone.target - totalQuestions);
      const status = isComplete ? '✅' : '📋';
      
      console.log(`${status} ${milestone.label}: ${milestone.target} questions ${isComplete ? '(DONE)' : `(+${remaining} needed)`}`);
    }
    
    // 6. Performance insights
    if (totalQuestions >= 450) {
      console.log(`\n📈 CURRENT CAPABILITIES:`);
      console.log('=' * 22);
      console.log('✅ Mock test generation');
      console.log('✅ Basic ML model training');
      console.log('✅ User progress tracking');
      console.log('✅ Performance analytics');
      console.log('✅ Adaptive question selection (basic)');
      
      if (totalQuestions >= 2000) {
        console.log('✅ Advanced personalization');
        console.log('✅ Sophisticated knowledge tracing');
      }
    }
    
    await pool.end();
    
    console.log(`\n🔄 Run 'npm run ml:monitor' anytime to check progress`);
    console.log(`⏰ Last updated: ${new Date().toLocaleString()}`);
    
  } catch (error) {
    console.error('❌ Monitoring failed:', error.message);
  }
}

monitorMLProgress().catch(console.error);
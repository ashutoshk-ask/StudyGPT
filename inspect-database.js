import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { sql } from 'drizzle-orm';

// Your database configuration
const DATABASE_CONFIG = {
  connectionString: "postgresql://neondb_owner:npg_mo6jGD5MnqVE@ep-delicate-bar-a6yiv3b0.us-west-2.aws.neon.tech/neondb?sslmode=require",
  host: "ep-delicate-bar-a6yiv3b0.us-west-2.aws.neon.tech",
  port: 5432,
  database: "neondb",
  user: "neondb_owner",
  password: "npg_mo6jGD5MnqVE",
  ssl: true
};

async function inspectDatabase() {
  console.log('🔍 Inspecting Your SSC CGL Study Buddy Database...\n');
  console.log('🌐 Database: neondb on Neon (AWS US-West-2)');
  console.log('👤 User: neondb_owner\n');
  
  try {
    const pool = new Pool({ connectionString: DATABASE_CONFIG.connectionString });
    const db = drizzle({ client: pool });
    
    console.log('📡 Successfully connected to your database!\n');
    
    // 1. Check what tables exist
    console.log('📋 EXISTING TABLES:');
    console.log('==================');
    
    const tablesResult = await db.execute(sql`
      SELECT table_name, table_type 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    if (tablesResult.rows.length === 0) {
      console.log('   ❌ No tables found - Database is empty');
      console.log('   💡 You need to create tables first\n');
    } else {
      tablesResult.rows.forEach((table, index) => {
        console.log(`   ${index + 1}. ${table.table_name} (${table.table_type})`);
      });
      console.log('');
    }
    
    // 2. If tables exist, check their data
    const tableNames = tablesResult.rows.map(row => row.table_name);
    let totalQuestions = 0;
    
    if (tableNames.includes('subjects')) {
      console.log('📚 SUBJECTS DATA:');
      console.log('================');
      const subjectsData = await db.execute(sql`SELECT * FROM subjects ORDER BY id;`);
      
      if (subjectsData.rows.length === 0) {
        console.log('   📝 No subjects found');
      } else {
        subjectsData.rows.forEach(subject => {
          console.log(`   • ${subject.name}: ${subject.description || 'No description'}`);
        });
      }
      console.log('');
    }
    
    if (tableNames.includes('topics')) {
      console.log('🎯 TOPICS DATA:');
      console.log('===============');
      const topicsData = await db.execute(sql`
        SELECT t.name as topic_name, s.name as subject_name, t.difficulty 
        FROM topics t 
        JOIN subjects s ON t.subject_id = s.id 
        ORDER BY s.name, t.name;
      `);
      
      if (topicsData.rows.length === 0) {
        console.log('   📝 No topics found');
      } else {
        let currentSubject = '';
        topicsData.rows.forEach(topic => {
          if (topic.subject_name !== currentSubject) {
            currentSubject = topic.subject_name;
            console.log(`   📖 ${currentSubject}:`);
          }
          console.log(`      └── ${topic.topic_name} (${topic.difficulty})`);
        });
      }
      console.log('');
    }
    
    if (tableNames.includes('questions')) {
      console.log('❓ QUESTIONS DATA:');
      console.log('=================');
      
      // Count questions by subject
      const questionCounts = await db.execute(sql`
        SELECT s.name as subject_name, COUNT(q.id) as question_count
        FROM subjects s
        LEFT JOIN topics t ON s.id = t.subject_id
        LEFT JOIN questions q ON t.id = q.topic_id
        GROUP BY s.id, s.name
        ORDER BY s.name;
      `);
      
      questionCounts.rows.forEach(subject => {
        console.log(`   📊 ${subject.subject_name}: ${subject.question_count} questions`);
        totalQuestions += parseInt(subject.question_count);
      });
      
      console.log(`   🎯 TOTAL QUESTIONS: ${totalQuestions}\n`);
      
      if (totalQuestions > 0) {
        // Show sample questions
        console.log('📝 SAMPLE QUESTIONS:');
        console.log('===================');
        const sampleQuestions = await db.execute(sql`
          SELECT 
            q.question_text,
            q.options,
            q.correct_answer,
            q.difficulty,
            s.name as subject_name,
            t.name as topic_name
          FROM questions q
          JOIN topics t ON q.topic_id = t.id
          JOIN subjects s ON t.subject_id = s.id
          ORDER BY q.id
          LIMIT 3;
        `);
        
        sampleQuestions.rows.forEach((q, index) => {
          console.log(`   ${index + 1}. [${q.subject_name} - ${q.topic_name}] ${q.difficulty}`);
          console.log(`      Q: ${q.question_text}`);
          console.log(`      Options: ${Array.isArray(q.options) ? q.options.join(', ') : q.options}`);
          console.log(`      Answer: ${q.correct_answer}\n`);
        });
      }
    }
    
    if (tableNames.includes('users')) {
      console.log('👥 USERS DATA:');
      console.log('==============');
      const usersCount = await db.execute(sql`SELECT COUNT(*) as count FROM users;`);
      console.log(`   👤 Total Users: ${usersCount.rows[0].count}`);
      
      if (usersCount.rows[0].count > 0) {
        const recentUsers = await db.execute(sql`
          SELECT username, email, created_at 
          FROM users 
          ORDER BY created_at DESC 
          LIMIT 5;
        `);
        
        console.log('   📅 Recent Users:');
        recentUsers.rows.forEach(user => {
          const date = new Date(user.created_at).toLocaleDateString();
          console.log(`      • ${user.username || 'Anonymous'} (${user.email}) - ${date}`);
        });
      }
      console.log('');
    }
    
    if (tableNames.includes('quiz_attempts')) {
      console.log('🎮 QUIZ ATTEMPTS DATA:');
      console.log('=====================');
      const quizStats = await db.execute(sql`
        SELECT 
          COUNT(*) as total_attempts,
          COUNT(CASE WHEN is_completed = true THEN 1 END) as completed_attempts,
          AVG(score) as avg_score
        FROM quiz_attempts;
      `);
      
      const stats = quizStats.rows[0];
      console.log(`   🎯 Total Attempts: ${stats.total_attempts}`);
      console.log(`   ✅ Completed: ${stats.completed_attempts}`);
      console.log(`   📊 Average Score: ${stats.avg_score ? parseFloat(stats.avg_score).toFixed(1) : 'N/A'}`);
      console.log('');
    }
    
    // 3. Database health check
    console.log('💊 DATABASE HEALTH CHECK:');
    console.log('=========================');
    
    const dbSize = await db.execute(sql`
      SELECT pg_size_pretty(pg_database_size('neondb')) as size;
    `);
    
    console.log(`   💾 Database Size: ${dbSize.rows[0].size}`);
    
    // Check for missing tables that should exist for SSC CGL app
    const expectedTables = ['subjects', 'topics', 'questions', 'users', 'quiz_attempts', 'user_progress'];
    const missingTables = expectedTables.filter(table => !tableNames.includes(table));
    
    if (missingTables.length > 0) {
      console.log(`   ⚠️  Missing Tables: ${missingTables.join(', ')}`);
      console.log('   💡 Run: npm run db:push to create missing tables');
    } else {
      console.log('   ✅ All required tables exist');
    }
    
    await pool.end();
    
    console.log('\n🎉 Database inspection completed!');
    
    // 4. Provide next steps based on what we found
    console.log('\n🚀 NEXT STEPS FOR PHASE 1:');
    console.log('==========================');
    
    if (tableNames.length === 0) {
      console.log('   1. ✅ Create database tables: npm run db:push');
      console.log('   2. ✅ Seed initial data: npm run db:seed');
      console.log('   3. ✅ Start the application: npm run dev');
    } else if (totalQuestions < 10) {
      console.log('   1. ✅ Add more questions for proper testing');
      console.log('   2. ✅ Start ML data collection');
      console.log('   3. ✅ Begin Phase 1 development');
    } else {
      console.log('   1. ✅ Database is ready!');
      console.log('   2. ✅ Start the application: npm run dev');
      console.log('   3. ✅ Begin ML model training');
    }
    
  } catch (error) {
    console.error('❌ Database inspection failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Check internet connection');
    console.log('   2. Verify database credentials');
    console.log('   3. Ensure Neon database is active');
    console.log('\n💡 If connection fails, try:');
    console.log('   • Check Neon dashboard for database status');
    console.log('   • Verify the connection string format');
    console.log('   • Ensure SSL is properly configured');
  }
}

inspectDatabase().catch(console.error);
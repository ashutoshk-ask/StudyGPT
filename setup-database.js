import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { sql } from 'drizzle-orm';
import * as schema from './shared/schema.js';

// Your Neon Database Configuration
const DATABASE_CONFIG = {
  connectionString: "postgresql://neondb_owner:npg_mo6jGD5MnqVE@ep-delicate-bar-a6yiv3b0.us-west-2.aws.neon.tech/neondb?sslmode=require",
  host: "ep-delicate-bar-a6yiv3b0.us-west-2.aws.neon.tech",
  port: 5432,
  database: "neondb",
  user: "neondb_owner",
  password: "npg_mo6jGD5MnqVE"
};

async function setupAndInspectDatabase() {
  console.log('� SSC CGL Study Buddy - Database Inspector & Setup\n');
  console.log('🌐 Database: neondb on Neon (AWS US-West-2)');
  console.log('👤 User: neondb_owner\n');
  
  try {
    const pool = new Pool({ connectionString: DATABASE_CONFIG.connectionString });
    const db = drizzle({ client: pool, schema });
    
    console.log('📡 Successfully connected to your Neon database!\n');
    
    // 1. Check what tables exist
    console.log('📋 EXISTING TABLES:');
    console.log('==================');
    
    const tablesResult = await db.execute(sql`
      SELECT table_name, table_type 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    const tableNames = tablesResult.rows.map(row => row.table_name);
    
    if (tablesResult.rows.length === 0) {
      console.log('   ❌ No tables found - Database is empty');
      console.log('   💡 Need to create tables using Drizzle schema\n');
    } else {
      console.log(`   ✅ Found ${tablesResult.rows.length} tables:`);
      tablesResult.rows.forEach((table, index) => {
        console.log(`   ${index + 1}. ${table.table_name} (${table.table_type})`);
      });
      console.log('');
    }
    
    let totalQuestions = 0;
    let totalUsers = 0;
    let totalQuizzes = 0;
    
    // 2. Check subjects if table exists
    if (tableNames.includes('subjects')) {
      console.log('� SUBJECTS DATA:');
      console.log('================');
      const subjectsData = await db.execute(sql`SELECT * FROM subjects ORDER BY name;`);
      
      if (subjectsData.rows.length === 0) {
        console.log('   📝 No subjects found');
      } else {
        subjectsData.rows.forEach((subject, index) => {
          console.log(`   ${index + 1}. ${subject.name}: ${subject.description || 'No description'}`);
          console.log(`      └── Topics: ${subject.totalTopics || 'Unknown'} | Weightage: ${subject.weightage || 'Unknown'}%`);
        });
      }
      console.log('');
    }
    
    // 3. Check topics if table exists
    if (tableNames.includes('topics')) {
      console.log('🎯 TOPICS DATA:');
      console.log('===============');
      
      try {
        const topicsData = await db.execute(sql`
          SELECT t.name as topic_name, s.name as subject_name, t.difficulty, t.estimatedTime 
          FROM topics t 
          JOIN subjects s ON t.subjectId = s.id 
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
            console.log(`      └── ${topic.topic_name} (${topic.difficulty}) - ${topic.estimatedTime || 0}min`);
          });
        }
      } catch (error) {
        console.log('   ⚠️  Topics table exists but may be empty or have different schema');
      }
      console.log('');
    }
    
    // 4. Check questions if table exists
    if (tableNames.includes('questions')) {
      console.log('❓ QUESTIONS DATA:');
      console.log('=================');
      
      try {
        // Count questions by subject
        const questionCounts = await db.execute(sql`
          SELECT s.name as subject_name, COUNT(q.id) as question_count
          FROM subjects s
          LEFT JOIN topics t ON s.id = t.subjectId
          LEFT JOIN questions q ON t.id = q.topicId
          GROUP BY s.id, s.name
          ORDER BY s.name;
        `);
        
        questionCounts.rows.forEach(subject => {
          const count = parseInt(subject.question_count || 0);
          console.log(`   📊 ${subject.subject_name}: ${count} questions`);
          totalQuestions += count;
        });
        
        console.log(`   🎯 TOTAL QUESTIONS: ${totalQuestions}\n`);
        
        // Show sample questions if any exist
        if (totalQuestions > 0) {
          const sampleQuestions = await db.execute(sql`
            SELECT 
              q.questionText,
              q.options,
              q.correctAnswer,
              q.difficulty,
              s.name as subject_name,
              t.name as topic_name
            FROM questions q
            JOIN topics t ON q.topicId = t.id
            JOIN subjects s ON t.subjectId = s.id
            ORDER BY q.createdAt DESC
            LIMIT 3;
          `);
          
          console.log('📝 SAMPLE QUESTIONS:');
          console.log('===================');
          sampleQuestions.rows.forEach((q, index) => {
            console.log(`   ${index + 1}. [${q.subject_name} - ${q.topic_name}] (${q.difficulty})`);
            console.log(`      Q: ${q.questionText?.substring(0, 80)}${q.questionText?.length > 80 ? '...' : ''}`);
            if (q.options) {
              try {
                const options = JSON.parse(q.options);
                console.log(`      Options: ${options.slice(0, 2).join(', ')}...`);
              } catch {
                console.log(`      Options: ${q.options?.substring(0, 40)}...`);
              }
            }
            console.log(`      Answer: ${q.correctAnswer}\n`);
          });
        }
      } catch (error) {
        console.log('   ⚠️  Questions table exists but may be empty or have different schema');
        console.log(`   Error: ${error.message}`);
      }
    }
    
    // 5. Check users if table exists
    if (tableNames.includes('users')) {
      console.log('👥 USERS DATA:');
      console.log('==============');
      
      try {
        const usersCount = await db.execute(sql`SELECT COUNT(*) as count FROM users;`);
        totalUsers = parseInt(usersCount.rows[0]?.count || 0);
        console.log(`   👤 Total Users: ${totalUsers}`);
        
        if (totalUsers > 0) {
          const recentUsers = await db.execute(sql`
            SELECT username, email, firstName, lastName, createdAt 
            FROM users 
            ORDER BY createdAt DESC 
            LIMIT 3;
          `);
          
          console.log('   📅 Recent Users:');
          recentUsers.rows.forEach((user, index) => {
            const date = user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown';
            const name = user.firstName || user.lastName ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'Unknown';
            console.log(`      ${index + 1}. ${name} (${user.username || user.email}) - ${date}`);
          });
        }
      } catch (error) {
        console.log('   ⚠️  Users table exists but may be empty or have different schema');
      }
      console.log('');
    }
    
    // 6. Check quizzes if table exists
    if (tableNames.includes('quizzes')) {
      console.log('📋 QUIZZES DATA:');
      console.log('===============');
      
      try {
        const quizzesCount = await db.execute(sql`SELECT COUNT(*) as count FROM quizzes;`);
        totalQuizzes = parseInt(quizzesCount.rows[0]?.count || 0);
        console.log(`   📝 Total Quizzes: ${totalQuizzes}`);
        
        if (totalQuizzes > 0) {
          const quizzesData = await db.execute(sql`
            SELECT title, description, timeLimit, totalMarks, isActive
            FROM quizzes 
            ORDER BY createdAt DESC 
            LIMIT 3;
          `);
          
          console.log('   📊 Recent Quizzes:');
          quizzesData.rows.forEach((quiz, index) => {
            console.log(`      ${index + 1}. ${quiz.title} (${quiz.timeLimit}min, ${quiz.totalMarks} marks)`);
            console.log(`         Status: ${quiz.isActive ? 'Active' : 'Inactive'}`);
          });
        }
      } catch (error) {
        console.log('   ⚠️  Quizzes table exists but may be empty');
      }
      console.log('');
    }
    
    // 7. Database health check
    console.log('💊 DATABASE HEALTH CHECK:');
    console.log('=========================');
    
    try {
      const dbSize = await db.execute(sql`
        SELECT pg_size_pretty(pg_database_size('neondb')) as size;
      `);
      console.log(`   💾 Database Size: ${dbSize.rows[0]?.size || 'Unknown'}`);
    } catch (error) {
      console.log('   💾 Database Size: Unable to determine');
    }
    
    // Check for missing tables that should exist for SSC CGL app
    const requiredTables = [
      'users', 'subjects', 'topics', 'questions', 'quizzes', 
      'mockTests', 'quizAttempts', 'mockTestAttempts', 'userProgress',
      'studyPlans', 'aiRecommendations'
    ];
    const missingTables = requiredTables.filter(table => !tableNames.includes(table));
    
    if (missingTables.length > 0) {
      console.log(`   ⚠️  Missing Tables (${missingTables.length}/${requiredTables.length}):`);
      console.log(`      ${missingTables.join(', ')}`);
      console.log('   💡 Run: npm run db:push to create missing tables');
    } else {
      console.log('   ✅ All required tables exist');
    }
    
    await pool.end();
    
    console.log('\n🎉 Database inspection completed!');
    
    // 8. Provide assessment and next steps
    console.log('\n📊 PHASE 1 READINESS ASSESSMENT:');
    console.log('================================');
    
    let readinessScore = 0;
    
    if (tableNames.length >= 5) {
      console.log('   ✅ Database Structure: Good');
      readinessScore += 25;
    } else {
      console.log('   ❌ Database Structure: Needs setup');
    }
    
    if (totalQuestions >= 20) {
      console.log('   ✅ Question Bank: Sufficient for testing');
      readinessScore += 25;
    } else if (totalQuestions > 0) {
      console.log('   ⚠️  Question Bank: Limited (need more questions)');
      readinessScore += 10;
    } else {
      console.log('   ❌ Question Bank: Empty (need to seed questions)');
    }
    
    if (totalUsers > 0) {
      console.log('   ✅ User System: Active');
      readinessScore += 25;
    } else {
      console.log('   ⚠️  User System: No users yet (normal for new system)');
      readinessScore += 15;
    }
    
    if (totalQuizzes > 0) {
      console.log('   ✅ Quiz System: Available');
      readinessScore += 25;
    } else {
      console.log('   ❌ Quiz System: No quizzes created');
    }
    
    console.log(`\n   🎯 Overall Readiness: ${readinessScore}% for Phase 1`);
    
    console.log('\n🚀 IMMEDIATE NEXT STEPS:');
    console.log('=======================');
    
    if (readinessScore < 50) {
      console.log('   1. 🔧 Create missing database tables');
      console.log('      → Run: npm run db:push');
      console.log('   2. 🌱 Seed initial data (subjects, topics, questions)');
      console.log('      → Run: npm run db:seed-enhanced');
      console.log('   3. 🚀 Start the application');
      console.log('      → Run: npm run dev');
    } else if (readinessScore < 75) {
      console.log('   1. 📚 Add more questions for comprehensive testing');
      console.log('   2. 🎯 Create additional quizzes and mock tests');
      console.log('   3. 🚀 Start Phase 1 development');
    } else {
      console.log('   1. 🎉 Database is ready for Phase 1!');
      console.log('   2. 🚀 Start the application: npm run dev');
      console.log('   3. 🤖 Begin ML model training');
      console.log('   4. 📊 Start collecting user performance data');
    }
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Check internet connection');
    console.log('   2. Verify Neon database is active');
    console.log('   3. Confirm database credentials are correct');
    console.log('\n💡 If connection issues persist:');
    console.log('   • Check Neon dashboard for database status');
    console.log('   • Verify SSL/TLS settings');
    console.log('   • Ensure database isn\'t suspended');
  }
}

setupAndInspectDatabase().catch(console.error);
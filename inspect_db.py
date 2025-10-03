import os
import psycopg2
from psycopg2.extras import RealDictCursor
import json
from datetime import datetime

# Database configuration
DATABASE_URL = "postgresql://neondb_owner:npg_mo6jGD5MnqVE@ep-delicate-bar-a6yiv3b0.us-west-2.aws.neon.tech/neondb?sslmode=require"

def inspect_database():
    """Inspect the StudyGPT database and provide detailed analysis"""
    print('🔍 Inspecting Your SSC CGL Study Buddy Database...\n')
    print('🌐 Database: neondb on Neon (AWS US-West-2)')
    print('👤 User: neondb_owner\n')
    
    try:
        # Connect to database
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        print('📡 Successfully connected to your database!\n')
        
        # 1. Check what tables exist
        print('📋 EXISTING TABLES:')
        print('=' * 18)
        
        cursor.execute("""
            SELECT table_name, table_type 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name;
        """)
        
        tables = cursor.fetchall()
        
        if not tables:
            print('   ❌ No tables found - Database is empty')
            print('   💡 You need to create tables first\n')
            return 'empty_database'
        else:
            for i, table in enumerate(tables, 1):
                print(f'   {i}. {table["table_name"]} ({table["table_type"]})')
            print('')
        
        # 2. Check subjects data
        table_names = [table['table_name'] for table in tables]
        total_questions = 0
        
        if 'subjects' in table_names:
            print('📚 SUBJECTS DATA:')
            print('=' * 16)
            cursor.execute("SELECT * FROM subjects ORDER BY id;")
            subjects = cursor.fetchall()
            
            if not subjects:
                print('   📝 No subjects found')
            else:
                for subject in subjects:
                    print(f'   • {subject["name"]}: {subject["description"] or "No description"}')
            print('')
        
        # 3. Check topics data
        if 'topics' in table_names:
            print('🎯 TOPICS DATA:')
            print('=' * 15)
            cursor.execute("""
                SELECT t.name as topic_name, s.name as subject_name, t.difficulty 
                FROM topics t 
                JOIN subjects s ON t.subject_id = s.id 
                ORDER BY s.name, t.name;
            """)
            topics = cursor.fetchall()
            
            if not topics:
                print('   📝 No topics found')
            else:
                current_subject = ''
                for topic in topics:
                    if topic['subject_name'] != current_subject:
                        current_subject = topic['subject_name']
                        print(f'   📖 {current_subject}:')
                    print(f'      └── {topic["topic_name"]} ({topic["difficulty"]})')
            print('')
        
        # 4. Check questions data
        if 'questions' in table_names:
            print('❓ QUESTIONS DATA:')
            print('=' * 17)
            
            # Count questions by subject
            cursor.execute("""
                SELECT s.name as subject_name, COUNT(q.id) as question_count
                FROM subjects s
                LEFT JOIN topics t ON s.id = t.subject_id
                LEFT JOIN questions q ON t.id = q.topic_id
                GROUP BY s.id, s.name
                ORDER BY s.name;
            """)
            question_counts = cursor.fetchall()
            
            for subject in question_counts:
                print(f'   📊 {subject["subject_name"]}: {subject["question_count"]} questions')
                total_questions += subject["question_count"]
            
            print(f'   🎯 TOTAL QUESTIONS: {total_questions}\n')
            
            if total_questions > 0:
                # Show sample questions
                print('📝 SAMPLE QUESTIONS:')
                print('=' * 19)
                cursor.execute("""
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
                """)
                sample_questions = cursor.fetchall()
                
                for i, q in enumerate(sample_questions, 1):
                    print(f'   {i}. [{q["subject_name"]} - {q["topic_name"]}] {q["difficulty"]}')
                    print(f'      Q: {q["question_text"]}')
                    options = q["options"] if isinstance(q["options"], str) else ', '.join(q["options"])
                    print(f'      Options: {options}')
                    print(f'      Answer: {q["correct_answer"]}\n')
        
        # 5. Check users data
        if 'users' in table_names:
            print('👥 USERS DATA:')
            print('=' * 14)
            cursor.execute("SELECT COUNT(*) as count FROM users;")
            users_count = cursor.fetchone()["count"]
            print(f'   👤 Total Users: {users_count}')
            
            if users_count > 0:
                cursor.execute("""
                    SELECT username, email, created_at 
                    FROM users 
                    ORDER BY created_at DESC 
                    LIMIT 5;
                """)
                recent_users = cursor.fetchall()
                
                print('   📅 Recent Users:')
                for user in recent_users:
                    date = user["created_at"].strftime('%Y-%m-%d') if user["created_at"] else 'Unknown'
                    username = user["username"] or 'Anonymous'
                    print(f'      • {username} ({user["email"]}) - {date}')
            print('')
        
        # 6. Database health check
        print('💊 DATABASE HEALTH CHECK:')
        print('=' * 25)
        
        cursor.execute("SELECT pg_size_pretty(pg_database_size('neondb')) as size;")
        db_size = cursor.fetchone()["size"]
        print(f'   💾 Database Size: {db_size}')
        
        # Check for missing tables
        expected_tables = ['subjects', 'topics', 'questions', 'users', 'quiz_attempts', 'user_progress']
        missing_tables = [table for table in expected_tables if table not in table_names]
        
        if missing_tables:
            print(f'   ⚠️  Missing Tables: {", ".join(missing_tables)}')
        else:
            print('   ✅ All core tables present')
        
        print('')
        
        # 7. Phase 1 readiness assessment
        print('🚀 PHASE 1 READINESS:')
        print('=' * 20)
        
        if total_questions == 0:
            print('   🔄 Status: Database needs content')
            print('   📋 Next Steps:')
            print('   1. ✅ Run enhanced seeding script')
            print('   2. ✅ Create initial admin user')  
            print('   3. ✅ Start application development')
            return 'needs_seeding'
        elif total_questions < 10:
            print('   🔄 Status: Minimal content available')
            print('   📋 Next Steps:')
            print('   1. ✅ Add more questions for proper testing')
            print('   2. ✅ Start ML data collection')
            print('   3. ✅ Begin Phase 1 development')
            return 'minimal_content'
        else:
            print('   🎉 Status: Ready for Phase 1!')
            print('   📋 Next Steps:')
            print('   1. ✅ Database is ready!')
            print('   2. ✅ Start the application: npm run dev')
            print('   3. ✅ Begin ML model training')
            return 'ready'
        
    except Exception as error:
        print(f'❌ Database inspection failed: {str(error)}')
        print('\n🔧 Troubleshooting:')
        print('   1. Check internet connection')
        print('   2. Verify database credentials')
        print('   3. Ensure Neon database is active')
        return 'connection_error'
    
    finally:
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    result = inspect_database()
    print(f'\n✅ Inspection complete! Database status: {result}')
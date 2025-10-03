#!/usr/bin/env python3
"""
Neon Database Inspector for SSC CGL Study Buddy App
Connects to your Neon database and provides comprehensive analysis
"""

import psycopg2
from psycopg2.extras import RealDictCursor
import json
import sys
from datetime import datetime

# Your Neon Database Configuration
DATABASE_CONFIG = {
    "host": "ep-delicate-bar-a6yiv3b0.us-west-2.aws.neon.tech",
    "port": 5432,
    "database": "neondb",
    "user": "neondb_owner",
    "password": "npg_mo6jGD5MnqVE",
    "sslmode": "require"
}

def connect_to_database():
    """Establish connection to Neon database"""
    try:
        conn = psycopg2.connect(**DATABASE_CONFIG)
        return conn
    except psycopg2.Error as e:
        print(f"❌ Database connection failed: {e}")
        return None

def inspect_database():
    """Comprehensive database inspection"""
    print("🎓 SSC CGL Study Buddy - Database Inspector")
    print("=" * 50)
    print(f"🌐 Database: {DATABASE_CONFIG['database']} on Neon")
    print(f"👤 User: {DATABASE_CONFIG['user']}")
    print(f"🕒 Inspection Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    conn = connect_to_database()
    if not conn:
        return False
    
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # 1. Check existing tables
        print("📋 EXISTING TABLES:")
        print("=" * 20)
        
        cursor.execute("""
            SELECT table_name, table_type 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name;
        """)
        
        tables = cursor.fetchall()
        table_names = [table['table_name'] for table in tables]
        
        if not tables:
            print("   ❌ No tables found - Database is empty")
            print("   💡 Need to create tables using schema migration")
        else:
            print(f"   ✅ Found {len(tables)} tables:")
            for i, table in enumerate(tables, 1):
                print(f"   {i}. {table['table_name']} ({table['table_type']})")
        print()
        
        # Initialize counters
        total_questions = 0
        total_users = 0
        total_quizzes = 0
        total_subjects = 0
        
        # 2. Check subjects
        if 'subjects' in table_names:
            print("📚 SUBJECTS DATA:")
            print("=" * 17)
            
            cursor.execute("SELECT * FROM subjects ORDER BY name;")
            subjects = cursor.fetchall()
            total_subjects = len(subjects)
            
            if not subjects:
                print("   📝 No subjects found")
            else:
                print(f"   📊 Total Subjects: {total_subjects}")
                for i, subject in enumerate(subjects, 1):
                    print(f"   {i}. {subject['name']}")
                    if subject.get('description'):
                        print(f"      └── {subject['description'][:60]}{'...' if len(subject['description']) > 60 else ''}")
                    if subject.get('totalTopics'):
                        print(f"      └── Topics: {subject['totalTopics']} | Weightage: {subject.get('weightage', 'Unknown')}%")
            print()
        
        # 3. Check topics
        if 'topics' in table_names:
            print("🎯 TOPICS DATA:")
            print("=" * 15)
            
            try:
                cursor.execute("""
                    SELECT t.name as topic_name, s.name as subject_name, 
                           t.difficulty, t.estimatedTime 
                    FROM topics t 
                    LEFT JOIN subjects s ON t.subjectId = s.id 
                    ORDER BY s.name, t.name;
                """)
                topics = cursor.fetchall()
                
                if not topics:
                    print("   📝 No topics found")
                else:
                    print(f"   📊 Total Topics: {len(topics)}")
                    current_subject = ""
                    for topic in topics:
                        if topic['subject_name'] != current_subject:
                            current_subject = topic['subject_name'] or "Unknown Subject"
                            print(f"   📖 {current_subject}:")
                        
                        difficulty = topic['difficulty'] or 'Unknown'
                        time_est = topic['estimatedTime'] or 0
                        print(f"      └── {topic['topic_name']} ({difficulty}) - {time_est}min")
            except Exception as e:
                print(f"   ⚠️  Error reading topics: {e}")
            print()
        
        # 4. Check questions
        if 'questions' in table_names:
            print("❓ QUESTIONS DATA:")
            print("=" * 17)
            
            try:
                # Count questions by subject
                cursor.execute("""
                    SELECT s.name as subject_name, COUNT(q.id) as question_count
                    FROM subjects s
                    LEFT JOIN topics t ON s.id = t.subjectId
                    LEFT JOIN questions q ON t.id = q.topicId
                    GROUP BY s.id, s.name
                    ORDER BY s.name;
                """)
                question_counts = cursor.fetchall()
                
                for subject in question_counts:
                    count = int(subject['question_count'] or 0)
                    print(f"   📊 {subject['subject_name']}: {count} questions")
                    total_questions += count
                
                print(f"   🎯 TOTAL QUESTIONS: {total_questions}")
                print()
                
                # Show sample questions if any exist
                if total_questions > 0:
                    cursor.execute("""
                        SELECT 
                            q.questionText,
                            q.options,
                            q.correctAnswer,
                            q.difficulty,
                            s.name as subject_name,
                            t.name as topic_name
                        FROM questions q
                        LEFT JOIN topics t ON q.topicId = t.id
                        LEFT JOIN subjects s ON t.subjectId = s.id
                        ORDER BY q.createdAt DESC
                        LIMIT 3;
                    """)
                    
                    sample_questions = cursor.fetchall()
                    
                    if sample_questions:
                        print("📝 SAMPLE QUESTIONS:")
                        print("=" * 20)
                        for i, q in enumerate(sample_questions, 1):
                            subject = q['subject_name'] or 'Unknown'
                            topic = q['topic_name'] or 'Unknown'
                            difficulty = q['difficulty'] or 'Unknown'
                            
                            print(f"   {i}. [{subject} - {topic}] ({difficulty})")
                            
                            question_text = q['questionText'] or 'No question text'
                            if len(question_text) > 80:
                                question_text = question_text[:80] + '...'
                            print(f"      Q: {question_text}")
                            
                            if q['options']:
                                try:
                                    if isinstance(q['options'], str):
                                        options = json.loads(q['options'])
                                    else:
                                        options = q['options']
                                    if isinstance(options, list) and len(options) >= 2:
                                        print(f"      Options: {options[0]}, {options[1]}...")
                                    else:
                                        print(f"      Options: {str(options)[:40]}...")
                                except:
                                    print(f"      Options: {str(q['options'])[:40]}...")
                            
                            print(f"      Answer: {q['correctAnswer'] or 'No answer'}")
                            print()
                        
            except Exception as e:
                print(f"   ⚠️  Error reading questions: {e}")
        
        # 5. Check users
        if 'users' in table_names:
            print("👥 USERS DATA:")
            print("=" * 14)
            
            try:
                cursor.execute("SELECT COUNT(*) as count FROM users;")
                users_count = cursor.fetchone()
                total_users = int(users_count['count'] or 0)
                print(f"   👤 Total Users: {total_users}")
                
                if total_users > 0:
                    cursor.execute("""
                        SELECT username, email, firstName, lastName, createdAt 
                        FROM users 
                        ORDER BY createdAt DESC 
                        LIMIT 3;
                    """)
                    
                    recent_users = cursor.fetchall()
                    print("   📅 Recent Users:")
                    for i, user in enumerate(recent_users, 1):
                        created_date = "Unknown"
                        if user['createdAt']:
                            try:
                                created_date = user['createdAt'].strftime('%Y-%m-%d')
                            except:
                                created_date = str(user['createdAt'])[:10]
                        
                        first_name = user.get('firstName') or ''
                        last_name = user.get('lastName') or ''
                        name = f"{first_name} {last_name}".strip() or 'Unknown'
                        
                        username = user.get('username') or user.get('email') or 'Unknown'
                        print(f"      {i}. {name} ({username}) - {created_date}")
            except Exception as e:
                print(f"   ⚠️  Error reading users: {e}")
            print()
        
        # 6. Check quizzes
        if 'quizzes' in table_names:
            print("📋 QUIZZES DATA:")
            print("=" * 16)
            
            try:
                cursor.execute("SELECT COUNT(*) as count FROM quizzes;")
                quizzes_count = cursor.fetchone()
                total_quizzes = int(quizzes_count['count'] or 0)
                print(f"   📝 Total Quizzes: {total_quizzes}")
                
                if total_quizzes > 0:
                    cursor.execute("""
                        SELECT title, description, timeLimit, totalMarks, isActive
                        FROM quizzes 
                        ORDER BY createdAt DESC 
                        LIMIT 3;
                    """)
                    
                    recent_quizzes = cursor.fetchall()
                    print("   📊 Recent Quizzes:")
                    for i, quiz in enumerate(recent_quizzes, 1):
                        title = quiz['title'] or 'Untitled Quiz'
                        time_limit = quiz['timeLimit'] or 0
                        marks = quiz['totalMarks'] or '0'
                        status = 'Active' if quiz.get('isActive') else 'Inactive'
                        print(f"      {i}. {title} ({time_limit}min, {marks} marks)")
                        print(f"         Status: {status}")
            except Exception as e:
                print(f"   ⚠️  Error reading quizzes: {e}")
            print()
        
        # 7. Database health check
        print("💊 DATABASE HEALTH CHECK:")
        print("=" * 25)
        
        try:
            cursor.execute("SELECT pg_size_pretty(pg_database_size(current_database())) as size;")
            db_size = cursor.fetchone()
            print(f"   💾 Database Size: {db_size['size'] if db_size else 'Unknown'}")
        except Exception as e:
            print("   💾 Database Size: Unable to determine")
        
        # Check for required tables
        required_tables = [
            'users', 'subjects', 'topics', 'questions', 'quizzes', 
            'mockTests', 'quizAttempts', 'mockTestAttempts', 'userProgress',
            'studyPlans', 'aiRecommendations'
        ]
        missing_tables = [table for table in required_tables if table not in table_names]
        
        if missing_tables:
            print(f"   ⚠️  Missing Tables ({len(missing_tables)}/{len(required_tables)}):")
            print(f"      {', '.join(missing_tables)}")
            print("   💡 Run database migration to create missing tables")
        else:
            print("   ✅ All required tables exist")
        
        print()
        
        # 8. Phase 1 readiness assessment
        print("📊 PHASE 1 READINESS ASSESSMENT:")
        print("=" * 32)
        
        readiness_score = 0
        
        if len(tables) >= 5:
            print("   ✅ Database Structure: Good")
            readiness_score += 25
        else:
            print("   ❌ Database Structure: Needs setup")
        
        if total_questions >= 20:
            print("   ✅ Question Bank: Sufficient for testing")
            readiness_score += 25
        elif total_questions > 0:
            print("   ⚠️  Question Bank: Limited (need more questions)")
            readiness_score += 10
        else:
            print("   ❌ Question Bank: Empty (need to seed questions)")
        
        if total_users > 0:
            print("   ✅ User System: Active")
            readiness_score += 25
        else:
            print("   ⚠️  User System: No users yet (normal for new system)")
            readiness_score += 15
        
        if total_quizzes > 0:
            print("   ✅ Quiz System: Available")
            readiness_score += 25
        else:
            print("   ❌ Quiz System: No quizzes created")
        
        print(f"\n   🎯 Overall Readiness: {readiness_score}% for Phase 1")
        
        # 9. Next steps recommendations
        print("\n🚀 IMMEDIATE NEXT STEPS:")
        print("=" * 23)
        
        if readiness_score < 50:
            print("   1. 🔧 Set up database schema (create missing tables)")
            print("   2. 🌱 Seed initial data (subjects, topics, questions)")
            print("   3. 🚀 Test the application workflow")
        elif readiness_score < 75:
            print("   1. 📚 Add more questions for comprehensive testing")
            print("   2. 🎯 Create additional quizzes and mock tests")
            print("   3. 🚀 Start Phase 1 development")
        else:
            print("   1. 🎉 Database is ready for Phase 1!")
            print("   2. 🚀 Start the application")
            print("   3. 🤖 Begin ML model training")
            print("   4. 📊 Start collecting user performance data")
        
        return True
        
    except Exception as e:
        print(f"❌ Database inspection failed: {e}")
        return False
        
    finally:
        if conn:
            conn.close()
            print("\n✅ Database connection closed")

def main():
    """Main function"""
    try:
        success = inspect_database()
        if success:
            print("\n🎉 Database inspection completed successfully!")
        else:
            print("\n❌ Database inspection failed!")
            return 1
        return 0
    except KeyboardInterrupt:
        print("\n\n⚠️  Inspection cancelled by user")
        return 1
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main())
"""
ChromaDB Integration for Semantic Search and Vector Embeddings
Implements semantic question similarity and content recommendation
"""

import chromadb
from chromadb.config import Settings
from sentence_transformers import SentenceTransformer
import numpy as np
from typing import List, Dict, Any, Optional
import logging
from config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

class ChromaDBManager:
    """Manages ChromaDB collections for semantic search"""
    
    def __init__(self):
        self.client = None
        self.embedding_model = None
        self.collections = {}
        
    async def initialize(self):
        """Initialize ChromaDB client and embedding model"""
        try:
            # Connect to ChromaDB
            self.client = chromadb.HttpClient(
                host=settings.CHROMA_HOST,
                port=settings.CHROMA_PORT,
                settings=Settings(allow_reset=True, anonymized_telemetry=False)
            )
            
            # Load sentence transformer model
            self.embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
            
            # Initialize collections
            await self.setup_collections()
            
            logger.info("ChromaDB initialized successfully")
            return True
            
        except Exception as e:
            logger.error(f"ChromaDB initialization failed: {e}")
            return False
    
    async def setup_collections(self):
        """Setup required collections for SSC CGL data"""
        
        collections_config = {
            "questions": {
                "metadata": {"hnsw:space": "cosine"},
                "description": "SSC CGL questions with semantic embeddings"
            },
            "explanations": {
                "metadata": {"hnsw:space": "cosine"}, 
                "description": "Answer explanations and learning content"
            },
            "topics": {
                "metadata": {"hnsw:space": "cosine"},
                "description": "Subject topics and concepts"
            },
            "study_materials": {
                "metadata": {"hnsw:space": "cosine"},
                "description": "Study materials and references"
            }
        }
        
        for name, config in collections_config.items():
            try:
                collection = self.client.get_or_create_collection(
                    name=name,
                    metadata=config["metadata"]
                )
                self.collections[name] = collection
                logger.info(f"Collection '{name}' ready")
                
            except Exception as e:
                logger.error(f"Error setting up collection '{name}': {e}")
    
    def generate_embeddings(self, texts: List[str]) -> np.ndarray:
        """Generate embeddings for given texts"""
        if not self.embedding_model:
            raise RuntimeError("Embedding model not initialized")
            
        embeddings = self.embedding_model.encode(texts)
        return embeddings.tolist()
    
    async def add_questions(self, questions_data: List[Dict[str, Any]]):
        """Add questions to ChromaDB with embeddings"""
        if "questions" not in self.collections:
            logger.error("Questions collection not available")
            return False
            
        try:
            # Prepare data for ChromaDB
            texts = []
            metadatas = []
            ids = []
            
            for question in questions_data:
                # Combine question text with options for better embeddings
                full_text = question.get('questionText', '')
                if question.get('options'):
                    options_text = ' '.join(question['options'])
                    full_text += f" Options: {options_text}"
                
                texts.append(full_text)
                
                # Metadata for filtering and retrieval
                metadata = {
                    'subject': question.get('subject', 'unknown'),
                    'topic': question.get('topic', 'unknown'),
                    'difficulty': question.get('difficulty', 'unknown'),
                    'question_type': question.get('questionType', 'mcq'),
                    'marks': float(question.get('marks', 2.0)),
                    'correct_answer': question.get('correctAnswer', ''),
                    'has_explanation': bool(question.get('explanation'))
                }
                
                metadatas.append(metadata)
                ids.append(f"q_{question.get('id', len(ids))}")
            
            # Generate embeddings
            embeddings = self.generate_embeddings(texts)
            
            # Add to ChromaDB
            self.collections["questions"].add(
                embeddings=embeddings,
                metadatas=metadatas,
                documents=texts,
                ids=ids
            )
            
            logger.info(f"Added {len(questions_data)} questions to ChromaDB")
            return True
            
        except Exception as e:
            logger.error(f"Error adding questions to ChromaDB: {e}")
            return False
    
    async def find_similar_questions(
        self,
        query_text: str,
        n_results: int = 10,
        filters: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """Find semantically similar questions"""
        
        if "questions" not in self.collections:
            logger.error("Questions collection not available")
            return []
            
        try:
            # Generate query embedding
            query_embedding = self.generate_embeddings([query_text])[0]
            
            # Build where clause for filtering
            where_clause = {}
            if filters:
                for key, value in filters.items():
                    if isinstance(value, list):
                        where_clause[key] = {"$in": value}
                    else:
                        where_clause[key] = value
            
            # Search ChromaDB
            results = self.collections["questions"].query(
                query_embeddings=[query_embedding],
                n_results=n_results,
                where=where_clause if where_clause else None,
                include=["metadatas", "documents", "distances"]
            )
            
            # Format results
            similar_questions = []
            for i in range(len(results['ids'][0])):
                similar_questions.append({
                    'id': results['ids'][0][i],
                    'question_text': results['documents'][0][i],
                    'similarity_score': 1 - results['distances'][0][i],  # Convert distance to similarity
                    'metadata': results['metadatas'][0][i]
                })
            
            return similar_questions
            
        except Exception as e:
            logger.error(f"Error finding similar questions: {e}")
            return []
    
    async def recommend_questions_for_user(
        self,
        user_profile: Dict[str, Any],
        n_results: int = 20
    ) -> List[Dict[str, Any]]:
        """Recommend questions based on user profile and performance"""
        
        try:
            # Analyze user's weak areas
            weak_subjects = user_profile.get('weak_subjects', [])
            target_difficulty = user_profile.get('target_difficulty', 'intermediate')
            preferred_topics = user_profile.get('preferred_topics', [])
            
            # Build recommendation query
            # Use a mix of weak areas (70%) and preferred topics (30%)
            recommendations = []
            
            # Get questions from weak areas
            if weak_subjects:
                weak_area_filters = {
                    'subject': weak_subjects,
                    'difficulty': [target_difficulty, 'beginner']  # Slightly easier for weak areas
                }
                
                weak_questions = await self.find_similar_questions(
                    query_text=f"practice questions {' '.join(weak_subjects)}",
                    n_results=int(n_results * 0.7),
                    filters=weak_area_filters
                )
                recommendations.extend(weak_questions)
            
            # Get questions from preferred topics
            if preferred_topics:
                topic_filters = {
                    'topic': preferred_topics,
                    'difficulty': [target_difficulty, 'advanced']  # Slightly harder for preferred topics
                }
                
                topic_questions = await self.find_similar_questions(
                    query_text=f"advanced questions {' '.join(preferred_topics)}",
                    n_results=int(n_results * 0.3),
                    filters=topic_filters
                )
                recommendations.extend(topic_questions)
            
            # Remove duplicates and sort by relevance
            seen_ids = set()
            unique_recommendations = []
            
            for question in recommendations:
                if question['id'] not in seen_ids:
                    seen_ids.add(question['id'])
                    unique_recommendations.append(question)
            
            # Sort by similarity score and user relevance
            unique_recommendations.sort(
                key=lambda x: x['similarity_score'] + 
                             (0.1 if x['metadata']['subject'] in weak_subjects else 0),
                reverse=True
            )
            
            return unique_recommendations[:n_results]
            
        except Exception as e:
            logger.error(f"Error generating question recommendations: {e}")
            return []
    
    async def create_adaptive_mock_test(
        self,
        user_profile: Dict[str, Any],
        test_config: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Create an adaptive mock test using semantic similarity"""
        
        try:
            total_questions = test_config.get('total_questions', 100)
            subjects = test_config.get('subjects', ['Mathematics', 'Reasoning', 'English', 'General Studies'])
            difficulty_distribution = test_config.get('difficulty_distribution', {
                'beginner': 0.3,
                'intermediate': 0.5, 
                'advanced': 0.2
            })
            
            mock_test_questions = []
            questions_per_subject = total_questions // len(subjects)
            
            for subject in subjects:
                subject_questions = []
                
                # Get questions for each difficulty level
                for difficulty, ratio in difficulty_distribution.items():
                    questions_needed = int(questions_per_subject * ratio)
                    
                    if questions_needed > 0:
                        filters = {
                            'subject': [subject],
                            'difficulty': [difficulty]
                        }
                        
                        difficulty_questions = await self.find_similar_questions(
                            query_text=f"{subject} {difficulty} practice questions",
                            n_results=questions_needed + 2,  # Get a few extra
                            filters=filters
                        )
                        
                        subject_questions.extend(difficulty_questions[:questions_needed])
                
                mock_test_questions.extend(subject_questions)
            
            # Shuffle questions while maintaining balance
            np.random.shuffle(mock_test_questions)
            
            # Calculate estimated time and marks
            estimated_time = len(mock_test_questions) * 1.2  # 1.2 minutes per question average
            total_marks = len(mock_test_questions) * 2  # 2 marks per question
            
            return {
                'questions': mock_test_questions[:total_questions],
                'total_questions': len(mock_test_questions[:total_questions]),
                'estimated_time_minutes': int(estimated_time),
                'total_marks': total_marks,
                'difficulty_distribution': difficulty_distribution,
                'subjects_covered': subjects,
                'creation_method': 'semantic_adaptive'
            }
            
        except Exception as e:
            logger.error(f"Error creating adaptive mock test: {e}")
            return {}
    
    async def get_collection_stats(self) -> Dict[str, Any]:
        """Get statistics about ChromaDB collections"""
        
        stats = {}
        
        try:
            for name, collection in self.collections.items():
                count = collection.count()
                stats[name] = {
                    'document_count': count,
                    'status': 'active' if count > 0 else 'empty'
                }
            
            return stats
            
        except Exception as e:
            logger.error(f"Error getting collection stats: {e}")
            return {}

# Global ChromaDB manager instance
chroma_manager = ChromaDBManager()
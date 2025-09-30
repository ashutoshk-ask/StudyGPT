from typing import List, Dict, Optional, Tuple
import numpy as np
from sentence_transformers import SentenceTransformer
import chromadb
from chromadb.config import Settings as ChromaSettings
import re

class SemanticSearchEngine:
    """
    Semantic search using sentence embeddings and ChromaDB
    """

    def __init__(
        self,
        model_name: str = "sentence-transformers/all-MiniLM-L6-v2",
        persist_directory: str = "./chroma_db"
    ):
        self.embedding_model = SentenceTransformer(model_name)
        self.chroma_client = chromadb.Client(ChromaSettings(
            persist_directory=persist_directory,
            anonymized_telemetry=False
        ))

        # Collections for different content types
        self.questions_collection = self._get_or_create_collection("questions")
        self.explanations_collection = self._get_or_create_collection("explanations")
        self.concepts_collection = self._get_or_create_collection("concepts")

    def _get_or_create_collection(self, name: str):
        """Get or create a ChromaDB collection"""
        try:
            return self.chroma_client.get_collection(name)
        except Exception:
            return self.chroma_client.create_collection(
                name=name,
                metadata={"hnsw:space": "cosine"}
            )

    def add_questions(self, questions: List[Dict]):
        """
        Add questions to the vector database
        Args:
            questions: List of question dicts with 'id', 'text', 'subject', etc.
        """
        ids = [str(q['id']) for q in questions]
        texts = [q['text'] for q in questions]
        metadatas = [
            {
                "subject": q.get('subject', ''),
                "topic": q.get('topic', ''),
                "difficulty": q.get('difficulty', '')
            }
            for q in questions
        ]

        embeddings = self.embedding_model.encode(texts).tolist()

        self.questions_collection.add(
            ids=ids,
            embeddings=embeddings,
            documents=texts,
            metadatas=metadatas
        )

    def search_similar_questions(
        self,
        query: str,
        n_results: int = 5,
        subject_filter: Optional[str] = None
    ) -> List[Dict]:
        """
        Search for similar questions using semantic similarity
        """
        query_embedding = self.embedding_model.encode([query])[0].tolist()

        where_filter = None
        if subject_filter:
            where_filter = {"subject": subject_filter}

        results = self.questions_collection.query(
            query_embeddings=[query_embedding],
            n_results=n_results,
            where=where_filter
        )

        return self._format_results(results)

    def add_concepts(self, concepts: List[Dict]):
        """Add concept explanations to vector database"""
        ids = [str(c['id']) for c in concepts]
        texts = [c['explanation'] for c in concepts]
        metadatas = [
            {
                "concept_name": c.get('name', ''),
                "subject": c.get('subject', ''),
                "difficulty": c.get('difficulty', '')
            }
            for c in concepts
        ]

        embeddings = self.embedding_model.encode(texts).tolist()

        self.concepts_collection.add(
            ids=ids,
            embeddings=embeddings,
            documents=texts,
            metadatas=metadatas
        )

    def search_concepts(
        self,
        query: str,
        n_results: int = 3
    ) -> List[Dict]:
        """Search for relevant concepts"""
        query_embedding = self.embedding_model.encode([query])[0].tolist()

        results = self.concepts_collection.query(
            query_embeddings=[query_embedding],
            n_results=n_results
        )

        return self._format_results(results)

    def _format_results(self, results: Dict) -> List[Dict]:
        """Format ChromaDB results"""
        formatted = []

        if not results['ids'] or not results['ids'][0]:
            return formatted

        for i in range(len(results['ids'][0])):
            formatted.append({
                'id': results['ids'][0][i],
                'text': results['documents'][0][i] if results['documents'] else '',
                'metadata': results['metadatas'][0][i] if results['metadatas'] else {},
                'distance': results['distances'][0][i] if results['distances'] else 0
            })

        return formatted

    def calculate_similarity(self, text1: str, text2: str) -> float:
        """Calculate cosine similarity between two texts"""
        embeddings = self.embedding_model.encode([text1, text2])
        similarity = np.dot(embeddings[0], embeddings[1]) / (
            np.linalg.norm(embeddings[0]) * np.linalg.norm(embeddings[1])
        )
        return float(similarity)


class NLPQueryProcessor:
    """
    Process natural language queries for study assistance
    """

    def __init__(self, semantic_search: SemanticSearchEngine):
        self.semantic_search = semantic_search
        self.intent_keywords = {
            "explanation": ["explain", "what is", "define", "meaning", "understand"],
            "example": ["example", "show me", "demonstrate", "instance"],
            "practice": ["practice", "quiz", "test", "questions on"],
            "comparison": ["difference", "compare", "versus", "vs"],
            "procedure": ["how to", "steps", "process", "method"]
        }

    def parse_query(self, query: str) -> Dict:
        """
        Parse natural language query
        Returns intent and entities
        """
        query_lower = query.lower()

        # Detect intent
        intent = "general"
        for intent_type, keywords in self.intent_keywords.items():
            if any(keyword in query_lower for keyword in keywords):
                intent = intent_type
                break

        # Extract subject/topic
        subjects = ["mathematics", "math", "reasoning", "english", "general studies"]
        detected_subject = None
        for subject in subjects:
            if subject in query_lower:
                detected_subject = subject
                break

        return {
            "intent": intent,
            "subject": detected_subject,
            "original_query": query
        }

    def generate_response(self, query: str) -> Dict:
        """
        Generate response to natural language query
        """
        parsed = self.parse_query(query)
        intent = parsed["intent"]

        if intent == "explanation":
            return self._handle_explanation_query(query, parsed)
        elif intent == "example":
            return self._handle_example_query(query, parsed)
        elif intent == "practice":
            return self._handle_practice_query(query, parsed)
        elif intent == "comparison":
            return self._handle_comparison_query(query, parsed)
        elif intent == "procedure":
            return self._handle_procedure_query(query, parsed)
        else:
            return self._handle_general_query(query, parsed)

    def _handle_explanation_query(self, query: str, parsed: Dict) -> Dict:
        """Handle requests for explanations"""
        concepts = self.semantic_search.search_concepts(query, n_results=3)

        return {
            "type": "explanation",
            "concepts": concepts,
            "related_questions": self.semantic_search.search_similar_questions(
                query,
                n_results=3,
                subject_filter=parsed.get("subject")
            )
        }

    def _handle_example_query(self, query: str, parsed: Dict) -> Dict:
        """Handle requests for examples"""
        questions = self.semantic_search.search_similar_questions(
            query,
            n_results=5,
            subject_filter=parsed.get("subject")
        )

        return {
            "type": "example",
            "examples": questions
        }

    def _handle_practice_query(self, query: str, parsed: Dict) -> Dict:
        """Handle practice requests"""
        questions = self.semantic_search.search_similar_questions(
            query,
            n_results=10,
            subject_filter=parsed.get("subject")
        )

        return {
            "type": "practice",
            "practice_questions": questions,
            "recommendation": "Start with easier questions and progress to harder ones"
        }

    def _handle_comparison_query(self, query: str, parsed: Dict) -> Dict:
        """Handle comparison queries"""
        # Extract terms to compare
        terms = self._extract_comparison_terms(query)

        concepts = []
        for term in terms:
            concept_results = self.semantic_search.search_concepts(term, n_results=1)
            concepts.extend(concept_results)

        return {
            "type": "comparison",
            "terms": terms,
            "concepts": concepts
        }

    def _handle_procedure_query(self, query: str, parsed: Dict) -> Dict:
        """Handle procedural queries"""
        concepts = self.semantic_search.search_concepts(query, n_results=2)
        questions = self.semantic_search.search_similar_questions(query, n_results=5)

        return {
            "type": "procedure",
            "concepts": concepts,
            "example_questions": questions
        }

    def _handle_general_query(self, query: str, parsed: Dict) -> Dict:
        """Handle general queries"""
        return {
            "type": "general",
            "suggestions": self.semantic_search.search_concepts(query, n_results=5)
        }

    def _extract_comparison_terms(self, query: str) -> List[str]:
        """Extract terms from comparison query"""
        # Simple extraction - can be improved with NER
        patterns = [
            r"difference between (.*?) and (.*?)[\?\.]",
            r"compare (.*?) and (.*?)[\?\.]",
            r"(.*?) vs (.*?)[\?\.]",
            r"(.*?) versus (.*?)[\?\.]"
        ]

        for pattern in patterns:
            match = re.search(pattern, query.lower())
            if match:
                return [match.group(1).strip(), match.group(2).strip()]

        return []


class QuestionDifficultyEstimator:
    """
    Estimate question difficulty using NLP features
    """

    def __init__(self, embedding_model: SentenceTransformer):
        self.embedding_model = embedding_model

    def estimate_difficulty(self, question_text: str) -> Dict:
        """
        Estimate question difficulty
        Returns difficulty score and category
        """
        # Linguistic features
        word_count = len(question_text.split())
        sentence_count = len(re.split(r'[.!?]', question_text))
        avg_word_length = np.mean([len(word) for word in question_text.split()])

        # Complexity indicators
        has_numbers = bool(re.search(r'\d', question_text))
        has_technical_terms = self._count_technical_terms(question_text)
        nested_clauses = question_text.count(',') + question_text.count(';')

        # Calculate difficulty score (0-1)
        difficulty_score = (
            (word_count / 100) * 0.2 +
            (avg_word_length / 10) * 0.2 +
            (has_numbers * 0.1) +
            (has_technical_terms / 10) * 0.3 +
            (nested_clauses / 5) * 0.2
        )

        difficulty_score = min(1.0, difficulty_score)

        # Categorize
        if difficulty_score < 0.3:
            category = "easy"
        elif difficulty_score < 0.6:
            category = "medium"
        else:
            category = "hard"

        return {
            "difficulty_score": round(difficulty_score, 2),
            "category": category,
            "features": {
                "word_count": word_count,
                "avg_word_length": round(avg_word_length, 2),
                "has_numbers": has_numbers,
                "technical_terms": has_technical_terms,
                "complexity": nested_clauses
            }
        }

    def _count_technical_terms(self, text: str) -> int:
        """Count technical/advanced terms"""
        technical_indicators = [
            "therefore", "consequently", "moreover", "furthermore",
            "hypothesis", "theorem", "equation", "probability",
            "ratio", "proportion", "analysis", "derivative"
        ]

        count = sum(1 for term in technical_indicators if term in text.lower())
        return count

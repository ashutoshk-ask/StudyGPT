"""
Multi-modal Learning Support System
Implements visual, auditory, and kinesthetic learning preferences
"""

from typing import Dict, List, Any, Optional
from enum import Enum
import numpy as np
import logging
from datetime import datetime
import json

logger = logging.getLogger(__name__)

class LearningModalityType(Enum):
    VISUAL = "visual"
    AUDITORY = "auditory"  
    KINESTHETIC = "kinesthetic"
    READING_WRITING = "reading_writing"

class ContentType(Enum):
    TEXT = "text"
    IMAGE = "image"
    DIAGRAM = "diagram"
    VIDEO = "video"
    AUDIO = "audio"
    INTERACTIVE = "interactive"
    ANIMATION = "animation"

class MultiModalLearningEngine:
    """Manages multi-modal learning preferences and content adaptation"""
    
    def __init__(self):
        self.user_modality_profiles = {}
        self.content_library = {}
        self.modality_effectiveness = {}
        
    def detect_learning_modality(
        self,
        user_id: str,
        interaction_data: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Detect user's preferred learning modality from interaction patterns"""
        
        try:
            # Analyze different types of interactions
            modality_scores = {
                LearningModalityType.VISUAL: 0,
                LearningModalityType.AUDITORY: 0,
                LearningModalityType.KINESTHETIC: 0,
                LearningModalityType.READING_WRITING: 0
            }
            
            total_interactions = len(interaction_data)
            
            for interaction in interaction_data:
                content_type = interaction.get('content_type')
                engagement_score = interaction.get('engagement_score', 0.5)
                accuracy = interaction.get('accuracy', 0.5)
                time_spent = interaction.get('time_spent', 60)  # seconds
                
                # Calculate performance metric
                performance = (engagement_score * 0.4 + accuracy * 0.6)
                
                # Map content types to learning modalities
                if content_type in ['image', 'diagram', 'chart', 'graph']:
                    modality_scores[LearningModalityType.VISUAL] += performance
                
                elif content_type in ['audio', 'narration', 'explanation_audio']:
                    modality_scores[LearningModalityType.AUDITORY] += performance
                
                elif content_type in ['interactive', 'simulation', 'drag_drop']:
                    modality_scores[LearningModalityType.KINESTHETIC] += performance
                
                elif content_type in ['text', 'notes', 'reading']:
                    modality_scores[LearningModalityType.READING_WRITING] += performance
                
                # Analyze interaction patterns
                # Quick interactions might indicate visual preference
                if time_spent < 30:
                    modality_scores[LearningModalityType.VISUAL] += 0.1
                
                # Longer interactions might indicate reading preference  
                elif time_spent > 120:
                    modality_scores[LearningModalityType.READING_WRITING] += 0.1
                
                # Repeated interactions might indicate kinesthetic preference
                if interaction.get('repeat_count', 0) > 1:
                    modality_scores[LearningModalityType.KINESTHETIC] += 0.15
            
            # Normalize scores
            if total_interactions > 0:
                for modality in modality_scores:
                    modality_scores[modality] /= total_interactions
            
            # Determine primary and secondary modalities
            sorted_modalities = sorted(
                modality_scores.items(),
                key=lambda x: x[1],
                reverse=True
            )
            
            primary_modality = sorted_modalities[0][0].value
            secondary_modality = sorted_modalities[1][0].value if len(sorted_modalities) > 1 else None
            
            # Store user profile
            self.user_modality_profiles[user_id] = {
                'primary_modality': primary_modality,
                'secondary_modality': secondary_modality,
                'modality_scores': {m.value: score for m, score in modality_scores.items()},
                'confidence': sorted_modalities[0][1],
                'total_interactions': total_interactions,
                'last_updated': datetime.now().isoformat()
            }
            
            return self.user_modality_profiles[user_id]
            
        except Exception as e:
            logger.error(f"Error detecting learning modality: {e}")
            return {}
    
    def get_adaptive_content_recommendations(
        self,
        user_id: str,
        topic: str,
        difficulty: str = 'intermediate'
    ) -> List[Dict[str, Any]]:
        """Get content recommendations adapted to user's learning modality"""
        
        try:
            # Get user's modality profile
            if user_id not in self.user_modality_profiles:
                # Default balanced approach for new users
                primary_modality = LearningModalityType.VISUAL.value
                secondary_modality = LearningModalityType.READING_WRITING.value
            else:
                profile = self.user_modality_profiles[user_id]
                primary_modality = profile['primary_modality']
                secondary_modality = profile['secondary_modality']
            
            recommendations = []
            
            # Generate content recommendations based on primary modality
            if primary_modality == LearningModalityType.VISUAL.value:
                recommendations.extend([
                    {
                        'content_type': ContentType.DIAGRAM.value,
                        'title': f'{topic} - Visual Diagram',
                        'description': f'Interactive diagram explaining {topic} concepts',
                        'estimated_time': 5,
                        'modality_match': 1.0,
                        'recommendation_reason': 'Matches your visual learning preference'
                    },
                    {
                        'content_type': ContentType.IMAGE.value,
                        'title': f'{topic} - Concept Images',
                        'description': f'Visual examples and illustrations for {topic}',
                        'estimated_time': 3,
                        'modality_match': 0.9,
                        'recommendation_reason': 'Visual content for better understanding'
                    },
                    {
                        'content_type': ContentType.VIDEO.value,
                        'title': f'{topic} - Animated Explanation',
                        'description': f'Animated video explaining {topic} step-by-step',
                        'estimated_time': 8,
                        'modality_match': 0.8,
                        'recommendation_reason': 'Visual learning with motion'
                    }
                ])
            
            elif primary_modality == LearningModalityType.AUDITORY.value:
                recommendations.extend([
                    {
                        'content_type': ContentType.AUDIO.value,
                        'title': f'{topic} - Audio Explanation',
                        'description': f'Detailed audio explanation of {topic} concepts',
                        'estimated_time': 10,
                        'modality_match': 1.0,
                        'recommendation_reason': 'Matches your auditory learning preference'
                    },
                    {
                        'content_type': ContentType.VIDEO.value,
                        'title': f'{topic} - Lecture Video',
                        'description': f'Expert lecture on {topic} with clear narration',
                        'estimated_time': 15,
                        'modality_match': 0.9,
                        'recommendation_reason': 'Audio-rich content with explanations'
                    }
                ])
            
            elif primary_modality == LearningModalityType.KINESTHETIC.value:
                recommendations.extend([
                    {
                        'content_type': ContentType.INTERACTIVE.value,
                        'title': f'{topic} - Interactive Simulator',
                        'description': f'Hands-on simulator for practicing {topic}',
                        'estimated_time': 12,
                        'modality_match': 1.0,
                        'recommendation_reason': 'Interactive practice matches your learning style'
                    },
                    {
                        'content_type': ContentType.INTERACTIVE.value,
                        'title': f'{topic} - Practice Exercises',
                        'description': f'Step-by-step interactive exercises for {topic}',
                        'estimated_time': 8,
                        'modality_match': 0.9,
                        'recommendation_reason': 'Hands-on learning approach'
                    }
                ])
            
            elif primary_modality == LearningModalityType.READING_WRITING.value:
                recommendations.extend([
                    {
                        'content_type': ContentType.TEXT.value,
                        'title': f'{topic} - Detailed Notes',
                        'description': f'Comprehensive written material on {topic}',
                        'estimated_time': 15,
                        'modality_match': 1.0,
                        'recommendation_reason': 'Detailed text matches your reading preference'
                    },
                    {
                        'content_type': ContentType.TEXT.value,
                        'title': f'{topic} - Practice Worksheets',
                        'description': f'Written exercises and practice problems for {topic}',
                        'estimated_time': 10,
                        'modality_match': 0.9,
                        'recommendation_reason': 'Written practice reinforces learning'
                    }
                ])
            
            # Add secondary modality content
            if secondary_modality and secondary_modality != primary_modality:
                secondary_content = self._get_secondary_modality_content(topic, secondary_modality)
                recommendations.extend(secondary_content)
            
            # Sort by modality match and return
            recommendations.sort(key=lambda x: x['modality_match'], reverse=True)
            
            return recommendations[:6]  # Return top 6 recommendations
            
        except Exception as e:
            logger.error(f"Error getting adaptive content recommendations: {e}")
            return []
    
    def _get_secondary_modality_content(self, topic: str, modality: str) -> List[Dict[str, Any]]:
        """Get content for secondary learning modality"""
        
        secondary_content = []
        
        if modality == LearningModalityType.VISUAL.value:
            secondary_content.append({
                'content_type': ContentType.DIAGRAM.value,
                'title': f'{topic} - Supporting Visuals',
                'description': f'Additional visual aids for {topic}',
                'estimated_time': 4,
                'modality_match': 0.7,
                'recommendation_reason': 'Complements your secondary visual preference'
            })
        
        elif modality == LearningModalityType.AUDITORY.value:
            secondary_content.append({
                'content_type': ContentType.AUDIO.value,
                'title': f'{topic} - Summary Audio',
                'description': f'Audio summary of key {topic} points',
                'estimated_time': 6,
                'modality_match': 0.7,
                'recommendation_reason': 'Audio reinforcement for better retention'
            })
        
        elif modality == LearningModalityType.KINESTHETIC.value:
            secondary_content.append({
                'content_type': ContentType.INTERACTIVE.value,
                'title': f'{topic} - Quick Practice',
                'description': f'Interactive quiz on {topic}',
                'estimated_time': 5,
                'modality_match': 0.7,
                'recommendation_reason': 'Interactive reinforcement'
            })
        
        elif modality == LearningModalityType.READING_WRITING.value:
            secondary_content.append({
                'content_type': ContentType.TEXT.value,
                'title': f'{topic} - Key Points',
                'description': f'Written summary of {topic} essentials',
                'estimated_time': 7,
                'modality_match': 0.7,
                'recommendation_reason': 'Written reinforcement'
            })
        
        return secondary_content
    
    def create_multimodal_study_plan(
        self,
        user_id: str,
        topics: List[str],
        study_duration_minutes: int = 60
    ) -> Dict[str, Any]:
        """Create a study plan that incorporates multiple learning modalities"""
        
        try:
            if user_id not in self.user_modality_profiles:
                return {'error': 'User modality profile not found'}
            
            profile = self.user_modality_profiles[user_id]
            primary_modality = profile['primary_modality']
            secondary_modality = profile['secondary_modality']
            
            study_plan = {
                'user_id': user_id,
                'total_duration_minutes': study_duration_minutes,
                'primary_modality': primary_modality,
                'secondary_modality': secondary_modality,
                'sessions': []
            }
            
            time_per_topic = study_duration_minutes // len(topics)
            
            for i, topic in enumerate(topics):
                # Allocate time based on modality preferences
                primary_time = int(time_per_topic * 0.7)  # 70% primary modality
                secondary_time = int(time_per_topic * 0.3)  # 30% secondary modality
                
                session = {
                    'topic': topic,
                    'total_time_minutes': time_per_topic,
                    'activities': []
                }
                
                # Primary modality activity
                primary_activity = self._create_activity_for_modality(
                    topic, primary_modality, primary_time, is_primary=True
                )
                session['activities'].append(primary_activity)
                
                # Secondary modality activity
                if secondary_modality:
                    secondary_activity = self._create_activity_for_modality(
                        topic, secondary_modality, secondary_time, is_primary=False
                    )
                    session['activities'].append(secondary_activity)
                
                study_plan['sessions'].append(session)
            
            return study_plan
            
        except Exception as e:
            logger.error(f"Error creating multimodal study plan: {e}")
            return {}
    
    def _create_activity_for_modality(
        self,
        topic: str,
        modality: str,
        duration_minutes: int,
        is_primary: bool = True
    ) -> Dict[str, Any]:
        """Create a learning activity for specific modality"""
        
        activity_templates = {
            LearningModalityType.VISUAL.value: {
                'primary': {
                    'type': 'visual_study',
                    'content_types': ['diagram', 'image', 'chart'],
                    'description': f'Visual exploration of {topic} concepts'
                },
                'secondary': {
                    'type': 'visual_review',
                    'content_types': ['infographic', 'summary_visual'],
                    'description': f'Visual review of {topic}'
                }
            },
            LearningModalityType.AUDITORY.value: {
                'primary': {
                    'type': 'audio_lesson',
                    'content_types': ['audio', 'lecture', 'explanation'],
                    'description': f'Audio lesson on {topic}'
                },
                'secondary': {
                    'type': 'audio_review',
                    'content_types': ['summary_audio', 'discussion'],
                    'description': f'Audio review of {topic}'
                }
            },
            LearningModalityType.KINESTHETIC.value: {
                'primary': {
                    'type': 'interactive_practice',
                    'content_types': ['simulation', 'interactive_exercise'],
                    'description': f'Hands-on practice with {topic}'
                },
                'secondary': {
                    'type': 'quick_practice',
                    'content_types': ['interactive_quiz', 'drag_drop'],
                    'description': f'Interactive practice exercises for {topic}'
                }
            },
            LearningModalityType.READING_WRITING.value: {
                'primary': {
                    'type': 'reading_study',
                    'content_types': ['text', 'notes', 'detailed_explanation'],
                    'description': f'Detailed reading on {topic}'
                },
                'secondary': {
                    'type': 'writing_practice',
                    'content_types': ['worksheet', 'practice_problems'],
                    'description': f'Written exercises for {topic}'
                }
            }
        }
        
        activity_key = 'primary' if is_primary else 'secondary'
        template = activity_templates.get(modality, {}).get(activity_key, {})
        
        return {
            'modality': modality,
            'duration_minutes': duration_minutes,
            'activity_type': template.get('type', 'general_study'),
            'content_types': template.get('content_types', ['text']),
            'description': template.get('description', f'Study {topic}'),
            'is_primary_modality': is_primary
        }
    
    def track_modality_effectiveness(
        self,
        user_id: str,
        content_type: str,
        modality: str,
        performance_metrics: Dict[str, float]
    ):
        """Track how effective different modalities are for the user"""
        
        try:
            if user_id not in self.modality_effectiveness:
                self.modality_effectiveness[user_id] = {}
            
            if modality not in self.modality_effectiveness[user_id]:
                self.modality_effectiveness[user_id][modality] = {
                    'total_sessions': 0,
                    'total_accuracy': 0,
                    'total_engagement': 0,
                    'content_type_performance': {}
                }
            
            modality_data = self.modality_effectiveness[user_id][modality]
            
            # Update overall metrics
            modality_data['total_sessions'] += 1
            modality_data['total_accuracy'] += performance_metrics.get('accuracy', 0)
            modality_data['total_engagement'] += performance_metrics.get('engagement', 0)
            
            # Update content type specific performance
            if content_type not in modality_data['content_type_performance']:
                modality_data['content_type_performance'][content_type] = {
                    'sessions': 0,
                    'accuracy': 0,
                    'engagement': 0
                }
            
            content_perf = modality_data['content_type_performance'][content_type]
            content_perf['sessions'] += 1
            content_perf['accuracy'] += performance_metrics.get('accuracy', 0)
            content_perf['engagement'] += performance_metrics.get('engagement', 0)
            
        except Exception as e:
            logger.error(f"Error tracking modality effectiveness: {e}")
    
    def get_modality_analytics(self, user_id: str) -> Dict[str, Any]:
        """Get analytics on user's modality effectiveness"""
        
        try:
            if user_id not in self.modality_effectiveness:
                return {'message': 'No modality data available'}
            
            user_data = self.modality_effectiveness[user_id]
            analytics = {}
            
            for modality, data in user_data.items():
                total_sessions = data['total_sessions']
                if total_sessions > 0:
                    avg_accuracy = data['total_accuracy'] / total_sessions
                    avg_engagement = data['total_engagement'] / total_sessions
                    
                    analytics[modality] = {
                        'total_sessions': total_sessions,
                        'average_accuracy': round(avg_accuracy, 3),
                        'average_engagement': round(avg_engagement, 3),
                        'effectiveness_score': round((avg_accuracy + avg_engagement) / 2, 3),
                        'content_type_breakdown': {}
                    }
                    
                    # Content type breakdown
                    for content_type, content_data in data['content_type_performance'].items():
                        if content_data['sessions'] > 0:
                            analytics[modality]['content_type_breakdown'][content_type] = {
                                'sessions': content_data['sessions'],
                                'avg_accuracy': round(content_data['accuracy'] / content_data['sessions'], 3),
                                'avg_engagement': round(content_data['engagement'] / content_data['sessions'], 3)
                            }
            
            # Rank modalities by effectiveness
            if analytics:
                sorted_modalities = sorted(
                    analytics.items(),
                    key=lambda x: x[1]['effectiveness_score'],
                    reverse=True
                )
                
                analytics['_summary'] = {
                    'most_effective_modality': sorted_modalities[0][0] if sorted_modalities else None,
                    'least_effective_modality': sorted_modalities[-1][0] if sorted_modalities else None,
                    'total_modalities_tested': len(analytics)
                }
            
            return analytics
            
        except Exception as e:
            logger.error(f"Error getting modality analytics: {e}")
            return {}

# Global multi-modal learning engine
multimodal_engine = MultiModalLearningEngine()
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import QuizInterface from "@/components/quiz/quiz-interface";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, BookOpen, ArrowLeft } from "lucide-react";

export default function Quiz() {
  const [location, navigate] = useLocation();
  const [selectedQuiz, setSelectedQuiz] = useState<any>(null);
  const [showQuizInterface, setShowQuizInterface] = useState(false);
  
  // Get query parameters
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const subjectId = urlParams.get('subject');
  const topicId = urlParams.get('topic');

  const { data: quizzes, isLoading } = useQuery({
    queryKey: ["/api/quizzes", { subjectId, topicId }],
  });

  const { data: subject } = useQuery({
    queryKey: ["/api/subjects", subjectId],
    enabled: !!subjectId,
  });

  const { data: topic } = useQuery({
    queryKey: ["/api/topics", topicId],
    enabled: !!topicId,
  });

  const handleQuizComplete = (results: any) => {
    setShowQuizInterface(false);
    setSelectedQuiz(null);
    // Navigate to results or back to subjects
    navigate('/subjects');
  };

  const startQuiz = (quiz: any) => {
    setSelectedQuiz(quiz);
    setShowQuizInterface(true);
  };

  if (showQuizInterface && selectedQuiz) {
    return <QuizInterface quiz={selectedQuiz} onComplete={handleQuizComplete} />;
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <main className="flex-1 overflow-hidden">
        <Header 
          title="Take Quiz" 
          subtitle={
            subject ? `${subject.name} ${topic ? `- ${topic.name}` : ''}` : 
            topic ? `${topic.name} Quiz` : 
            "Select a quiz to begin"
          } 
        />
        
        <div className="p-4 lg:p-6 overflow-y-auto h-full">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Back Button */}
            <Button 
              variant="outline" 
              onClick={() => navigate('/subjects')}
              data-testid="button-back-to-subjects"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Subjects
            </Button>

            {/* Quiz Selection */}
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground mt-4">Loading quizzes...</p>
              </div>
            ) : Array.isArray(quizzes) && quizzes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {quizzes.map((quiz: any) => (
                  <Card key={quiz.id} className="hover:shadow-md transition-all" data-testid={`card-quiz-${quiz.id}`}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{quiz.title}</CardTitle>
                        <Badge variant="outline">{quiz.difficulty || 'Mixed'}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground text-sm mb-4">
                        {quiz.description}
                      </p>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Questions</span>
                          <span className="font-medium">{Array.isArray(quiz.questionIds) ? quiz.questionIds.length : 0}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Time Limit</span>
                          <span className="font-medium flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {quiz.timeLimit} min
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Total Marks</span>
                          <span className="font-medium">{quiz.totalMarks}</span>
                        </div>
                      </div>
                      
                      <Button 
                        className="w-full" 
                        onClick={() => startQuiz(quiz)}
                        data-testid={`button-start-quiz-${quiz.id}`}
                      >
                        Start Quiz
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="text-center py-12" data-testid="card-no-quizzes">
                <CardContent>
                  <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No Quizzes Available</h3>
                  <p className="text-muted-foreground mb-4">
                    {subject || topic ? 
                      `No quizzes found for ${subject?.name || ''} ${topic?.name || ''}` : 
                      'No quizzes available at the moment'
                    }
                  </p>
                  <Button variant="outline" onClick={() => navigate('/subjects')}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Subjects
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Flag, ChevronLeft, ChevronRight } from "lucide-react";
import { QuizWithQuestions, Question } from "@shared/schema";
import QuestionPalette from "./question-palette";

interface QuizInterfaceProps {
  quiz: QuizWithQuestions | null;
  onComplete: (results: any) => void;
}

export default function QuizInterface({ quiz, onComplete }: QuizInterfaceProps) {
  const { toast } = useToast();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});
  const [flagged, setFlagged] = useState<{ [key: number]: boolean }>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [showResults, setShowResults] = useState(false);

  // Initialize timer when quiz data is available
  useEffect(() => {
    if (quiz?.timeLimit) {
      setTimeLeft(quiz.timeLimit * 60);
    }
  }, [quiz?.timeLimit]);

  useEffect(() => {
    if (!quiz || timeLeft === 0) return;
    
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [quiz, timeLeft]);

  const submitQuizMutation = useMutation({
    mutationFn: async (data: { answers: any; timeTaken: number }) => {
      if (!quiz?.id) throw new Error("Quiz not found");
      const response = await fetch(`/api/quizzes/${quiz.id}/attempt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to submit quiz");
      return response.json();
    },
    onSuccess: (results) => {
      setShowResults(true);
      toast({
        title: "Quiz Completed!",
        description: `You scored ${results.score.toFixed(1)}%`,
      });
      onComplete(results);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!quiz?.timeLimit) return;
    const timeTaken = (quiz.timeLimit * 60) - timeLeft;
    const formattedAnswers = Object.keys(answers).map(key => answers[parseInt(key)]);
    
    submitQuizMutation.mutate({
      answers: formattedAnswers,
      timeTaken,
    });
  };

  const selectAnswer = (questionIndex: number, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionIndex]: answer }));
  };

  const toggleFlag = (questionIndex: number) => {
    setFlagged(prev => ({ ...prev, [questionIndex]: !prev[questionIndex] }));
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Early return for loading state
  if (!quiz || !quiz.questions || quiz.questions.length === 0) {
    return (
      <div className="space-y-6" data-testid="quiz-loading">
        <Card>
          <CardContent className="p-8">
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="text-lg">Loading quiz...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const progress = ((currentQuestion + 1) / quiz.questions.length) * 100;
  const currentQ = quiz.questions[currentQuestion];

  if (showResults) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-bold mb-4">Quiz Completed!</h2>
        <p>Results will be displayed here...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="quiz-interface">
      {/* Quiz Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-foreground" data-testid="quiz-title">
                {quiz?.title || 'Quiz'}
              </h2>
              <p className="text-muted-foreground">{quiz?.description || ''}</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <p className={`text-2xl font-bold ${timeLeft < 300 ? 'text-destructive' : 'text-primary'}`} data-testid="time-left">
                  {formatTime(timeLeft)}
                </p>
                <p className="text-xs text-muted-foreground">Time Left</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-foreground" data-testid="question-progress">
                  {currentQuestion + 1}/{quiz?.questions?.length || 0}
                </p>
                <p className="text-xs text-muted-foreground">Questions</p>
              </div>
            </div>
          </div>

          <Progress value={progress} className="h-2" data-testid="quiz-progress" />
        </CardContent>
      </Card>

      {/* Current Question */}
      <Card>
        <CardContent className="p-6">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground" data-testid="question-text">
                Q{currentQuestion + 1}. {currentQ?.questionText || 'Loading question...'}
              </h3>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" data-testid="question-difficulty">
                  {currentQ?.difficulty || 'N/A'}
                </Badge>
                <Badge variant="secondary" data-testid="question-marks">
                  +{currentQ?.marks || '0'} / -{currentQ?.negativeMarks || '0'}
                </Badge>
              </div>
            </div>
            
            <div className="space-y-3">
              {currentQ?.options?.map((option, index) => {
                const optionLetter = String.fromCharCode(65 + index); // A, B, C, D
                const isSelected = answers[currentQuestion] === option;
                
                return (
                  <div
                    key={index}
                    className={`quiz-option border border-border rounded-lg p-4 cursor-pointer transition-all ${
                      isSelected ? 'selected bg-primary text-primary-foreground border-primary' : ''
                    }`}
                    onClick={() => selectAnswer(currentQuestion, option)}
                    data-testid={`option-${optionLetter}`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-6 h-6 border rounded-full flex items-center justify-center ${
                        isSelected ? 'border-primary-foreground bg-primary-foreground' : 'border-muted-foreground'
                      }`}>
                        <span className={`text-sm font-semibold ${
                          isSelected ? 'text-primary' : ''
                        }`}>
                          {optionLetter}
                        </span>
                      </div>
                      <span>{option}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => toggleFlag(currentQuestion)}
              data-testid="button-flag"
            >
              <Flag className={`h-4 w-4 mr-2 ${flagged[currentQuestion] ? 'fill-current' : ''}`} />
              {flagged[currentQuestion] ? 'Unflag' : 'Flag'} for Review
            </Button>
            
            <div className="space-x-3">
              <Button
                variant="outline"
                onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                disabled={currentQuestion === 0}
                data-testid="button-previous"
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
              
              {currentQuestion === (quiz?.questions?.length || 1) - 1 ? (
                <Button
                  onClick={handleSubmit}
                  disabled={submitQuizMutation.isPending}
                  data-testid="button-submit"
                >
                  {submitQuizMutation.isPending ? "Submitting..." : "Submit Quiz"}
                </Button>
              ) : (
                <Button
                  onClick={() => setCurrentQuestion(Math.min((quiz?.questions?.length || 1) - 1, currentQuestion + 1))}
                  data-testid="button-next"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Question Palette */}
      <QuestionPalette
        questions={quiz?.questions || []}
        currentQuestion={currentQuestion}
        answers={answers}
        flagged={flagged}
        onQuestionSelect={setCurrentQuestion}
      />
    </div>
  );
}

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Clock,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  XCircle,
  BookOpen,
  Target,
  Timer,
  Flag,
  RotateCcw,
  FileText
} from "lucide-react";

interface Question {
  id: string;
  questionText: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
  difficulty: string;
  marks: string;
  negativeMarks: string;
  timeLimit?: number;
}

interface QuizAttempt {
  id: string;
  quizId: string;
  answers: Record<string, string>;
  score: number;
  timeTaken: number;
  isCompleted: boolean;
}

export default function QuizTaking({ quizId, onComplete }: { quizId: string; onComplete: () => void }) {
  const { toast } = useToast();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isTimerActive, setIsTimerActive] = useState(true);
  const [markedForReview, setMarkedForReview] = useState<Set<string>>(new Set());
  const [quizStartTime, setQuizStartTime] = useState<Date>(new Date());

  // Fetch quiz with questions
  const { data: quiz, isLoading } = useQuery({
    queryKey: [`/api/quizzes/${quizId}/with-questions`],
  });

  // Create quiz attempt mutation
  const createAttemptMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/attempts/quiz`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          quizId,
          answers: {},
          isCompleted: false
        })
      });
      if (!response.ok) throw new Error("Failed to create quiz attempt");
      return response.json();
    }
  });

  // Submit quiz attempt mutation
  const submitAttemptMutation = useMutation({
    mutationFn: async (finalAnswers: Record<string, string>) => {
      const timeTaken = Math.floor((new Date().getTime() - quizStartTime.getTime()) / 1000);
      
      const response = await fetch(`/api/attempts/quiz/${createAttemptMutation.data?.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          answers: finalAnswers,
          timeTaken,
          isCompleted: true
        })
      });
      if (!response.ok) throw new Error("Failed to submit quiz");
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Quiz Completed!",
        description: `Your score: ${data.score}%`,
        variant: "default"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/progress"] });
      onComplete();
    }
  });

  const questions = quiz?.questions || [];
  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;

  // Initialize quiz attempt
  useEffect(() => {
    if (quiz && !createAttemptMutation.data) {
      createAttemptMutation.mutate();
      setTimeLeft((quiz.timeLimit || 30) * 60); // Convert minutes to seconds
      setQuizStartTime(new Date());
    }
  }, [quiz]);

  // Timer effect
  useEffect(() => {
    if (!isTimerActive || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsTimerActive(false);
          handleSubmitQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isTimerActive, timeLeft]);

  // Load saved answer for current question
  useEffect(() => {
    if (currentQuestion) {
      setSelectedAnswer(answers[currentQuestion.id] || "");
    }
  }, [currentQuestionIndex, currentQuestion, answers]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer);
    if (currentQuestion) {
      setAnswers(prev => ({
        ...prev,
        [currentQuestion.id]: answer
      }));
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleMarkForReview = () => {
    if (currentQuestion) {
      const newMarked = new Set(markedForReview);
      if (newMarked.has(currentQuestion.id)) {
        newMarked.delete(currentQuestion.id);
      } else {
        newMarked.add(currentQuestion.id);
      }
      setMarkedForReview(newMarked);
    }
  };

  const handleSubmitQuiz = () => {
    if (Object.keys(answers).length === 0) {
      toast({
        title: "No Answers",
        description: "Please answer at least one question before submitting.",
        variant: "destructive"
      });
      return;
    }

    setIsTimerActive(false);
    submitAttemptMutation.mutate(answers);
  };

  const getQuestionStatus = (question: Question) => {
    const isAnswered = answers[question.id];
    const isMarked = markedForReview.has(question.id);
    
    if (isAnswered && isMarked) return "answered-marked";
    if (isAnswered) return "answered";
    if (isMarked) return "marked";
    return "not-visited";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "answered": return "bg-green-500 text-white";
      case "marked": return "bg-yellow-500 text-white";
      case "answered-marked": return "bg-blue-500 text-white";
      default: return "bg-gray-200 text-gray-700";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (!quiz || questions.length === 0) {
    return (
      <Alert className="m-6">
        <XCircle className="h-4 w-4" />
        <AlertDescription>
          Quiz not found or no questions available.
        </AlertDescription>
      </Alert>
    );
  }

  const answeredCount = Object.keys(answers).length;
  const progressPercentage = (answeredCount / totalQuestions) * 100;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Question Panel */}
      <div className="flex-1 p-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{quiz.title}</h1>
              <p className="text-gray-600">{quiz.description}</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{formatTime(timeLeft)}</div>
                <div className="text-sm text-gray-500">Time Left</div>
              </div>
            </div>
          </div>
          
          {/* Progress */}
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>Question {currentQuestionIndex + 1} of {totalQuestions}</span>
            <span>{answeredCount} answered</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        {/* Question Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                Question {currentQuestionIndex + 1}
              </CardTitle>
              <div className="flex items-center space-x-2">
                <Badge variant={currentQuestion?.difficulty === 'advanced' ? 'destructive' : 
                              currentQuestion?.difficulty === 'intermediate' ? 'default' : 'secondary'}>
                  {currentQuestion?.difficulty}
                </Badge>
                <Badge variant="outline">
                  +{currentQuestion?.marks} marks
                </Badge>
                {parseFloat(currentQuestion?.negativeMarks || "0") > 0 && (
                  <Badge variant="outline" className="text-red-600">
                    -{currentQuestion?.negativeMarks} penalty
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <p className="text-lg text-gray-800 leading-relaxed">
                {currentQuestion?.questionText}
              </p>
            </div>

            <RadioGroup value={selectedAnswer} onValueChange={handleAnswerSelect}>
              <div className="space-y-3">
                {currentQuestion?.options.map((option, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                    <RadioGroupItem value={option} id={`option-${index}`} />
                    <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer text-base">
                      <span className="font-medium mr-2">
                        {String.fromCharCode(65 + index)}.
                      </span>
                      {option}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between mt-8">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>

              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  onClick={handleMarkForReview}
                  className={markedForReview.has(currentQuestion?.id || "") ? "bg-yellow-100" : ""}
                >
                  <Flag className="h-4 w-4 mr-2" />
                  {markedForReview.has(currentQuestion?.id || "") ? "Unmark" : "Mark for Review"}
                </Button>

                <Button
                  onClick={handleNext}
                  disabled={currentQuestionIndex === totalQuestions - 1}
                >
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="text-center">
          <Button
            onClick={handleSubmitQuiz}
            size="lg"
            disabled={submitAttemptMutation.isPending}
            className="px-8"
          >
            {submitAttemptMutation.isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Submitting...
              </>
            ) : (
              <>
                <CheckCircle className="h-5 w-5 mr-2" />
                Submit Quiz
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Question Palette */}
      <div className="w-80 bg-white border-l p-6">
        <div className="sticky top-6">
          <h3 className="font-semibold text-lg mb-4">Question Palette</h3>
          
          {/* Legend */}
          <div className="mb-6 space-y-2 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span>Answered</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-yellow-500 rounded"></div>
              <span>Marked for Review</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <span>Answered & Marked</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-gray-200 rounded"></div>
              <span>Not Visited</span>
            </div>
          </div>

          {/* Question Grid */}
          <div className="grid grid-cols-5 gap-2">
            {questions.map((question, index) => (
              <button
                key={question.id}
                onClick={() => setCurrentQuestionIndex(index)}
                className={`
                  w-10 h-10 rounded text-sm font-medium transition-all
                  ${getStatusColor(getQuestionStatus(question))}
                  ${currentQuestionIndex === index ? 'ring-2 ring-primary ring-offset-2' : ''}
                  hover:scale-105
                `}
              >
                {index + 1}
              </button>
            ))}
          </div>

          {/* Summary */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium mb-3">Summary</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Total Questions:</span>
                <span className="font-medium">{totalQuestions}</span>
              </div>
              <div className="flex justify-between">
                <span>Answered:</span>
                <span className="font-medium text-green-600">{answeredCount}</span>
              </div>
              <div className="flex justify-between">
                <span>Not Answered:</span>
                <span className="font-medium text-red-600">{totalQuestions - answeredCount}</span>
              </div>
              <div className="flex justify-between">
                <span>Marked for Review:</span>
                <span className="font-medium text-yellow-600">{markedForReview.size}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
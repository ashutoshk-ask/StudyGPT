import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircle, 
  XCircle, 
  Trophy, 
  Clock, 
  Target,
  ArrowRight,
  RefreshCw
} from "lucide-react";

interface QuizResult {
  attempt: any;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  timeTaken?: number;
}

interface QuizResultsProps {
  results: QuizResult;
  quiz: any;
  onRetry: () => void;
  onViewExplanations: () => void;
  onClose: () => void;
}

export default function QuizResults({ 
  results, 
  quiz, 
  onRetry, 
  onViewExplanations, 
  onClose 
}: QuizResultsProps) {
  const { score, correctAnswers, totalQuestions, timeTaken } = results;
  const percentage = (correctAnswers / totalQuestions) * 100;
  const avgTimePerQuestion = timeTaken ? Math.floor(timeTaken / totalQuestions) : 0;
  const incorrectAnswers = totalQuestions - correctAnswers;
  const accuracy = (correctAnswers / totalQuestions) * 100;

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-accent";
    if (score >= 60) return "text-primary";
    return "text-destructive";
  };

  const getScoreBadge = (score: number) => {
    if (score >= 90) return { text: "Outstanding! 🏆", variant: "default" as const };
    if (score >= 80) return { text: "Excellent! 🌟", variant: "default" as const };
    if (score >= 70) return { text: "Great Job! 👍", variant: "secondary" as const };
    if (score >= 60) return { text: "Keep Improving", variant: "secondary" as const };
    return { text: "Needs Practice", variant: "destructive" as const };
  };

  const scoreBadge = getScoreBadge(percentage);

  return (
    <div className="max-w-2xl mx-auto space-y-6" data-testid="quiz-results">
      {/* Results Header */}
      <Card className="text-center">
        <CardHeader>
          <div className="w-16 h-16 mx-auto mb-4">
            {percentage >= 70 ? (
              <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center">
                <Trophy className="h-8 w-8 text-accent-foreground" />
              </div>
            ) : percentage >= 50 ? (
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
                <Target className="h-8 w-8 text-primary-foreground" />
              </div>
            ) : (
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                <RefreshCw className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
          </div>
          
          <CardTitle className="text-2xl mb-2" data-testid="quiz-title">
            {quiz.title} - Results
          </CardTitle>
          
          <Badge variant={scoreBadge.variant} className="text-base px-4 py-1">
            {scoreBadge.text}
          </Badge>
        </CardHeader>
      </Card>

      {/* Score Overview */}
      <Card data-testid="score-overview">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="text-center">
              <p className={`text-4xl font-bold ${getScoreColor(percentage)}`} data-testid="final-score">
                {percentage.toFixed(1)}%
              </p>
              <p className="text-muted-foreground">Final Score</p>
            </div>

            <div className="text-center">
              <p className="text-4xl font-bold text-foreground" data-testid="correct-answers">
                {correctAnswers}/{totalQuestions}
              </p>
              <p className="text-muted-foreground">Correct Answers</p>
            </div>

            <div className="text-center">
              <p className="text-4xl font-bold text-foreground" data-testid="time-taken">
                {timeTaken ? Math.floor(timeTaken / 60) : 0}m {timeTaken ? timeTaken % 60 : 0}s
              </p>
              <p className="text-muted-foreground">Time Taken</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span>Progress</span>
              <span>{percentage.toFixed(1)}%</span>
            </div>
            <Progress value={percentage} className="h-3" />
          </div>

          {/* Detailed Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-accent" />
              <span className="text-muted-foreground">Correct: {correctAnswers}</span>
            </div>
            <div className="flex items-center space-x-2">
              <XCircle className="h-4 w-4 text-destructive" />
              <span className="text-muted-foreground">Wrong: {totalQuestions - correctAnswers}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-primary" />
              <span className="text-muted-foreground">Avg: {avgTimePerQuestion}s</span>
            </div>
            <div className="flex items-center space-x-2">
              <Target className="h-4 w-4 text-chart-4" />
              <span className="text-muted-foreground">Accuracy: {percentage.toFixed(0)}%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Analysis */}
      <Card data-testid="performance-analysis">
        <CardHeader>
          <CardTitle>Performance Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {percentage >= 80 ? (
              <div className="p-4 bg-accent/5 border border-accent/20 rounded-lg">
                <h4 className="font-semibold text-accent mb-2">Excellent Performance! 🎉</h4>
                <p className="text-sm text-muted-foreground">
                  You've demonstrated strong understanding of this topic. Keep up the great work and 
                  consider moving to more advanced questions.
                </p>
              </div>
            ) : percentage >= 60 ? (
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                <h4 className="font-semibold text-primary mb-2">Good Progress! 👍</h4>
                <p className="text-sm text-muted-foreground">
                  You're on the right track. Review the explanations for incorrect answers 
                  to strengthen your understanding.
                </p>
              </div>
            ) : (
              <div className="p-4 bg-destructive/5 border border-destructive/20 rounded-lg">
                <h4 className="font-semibold text-destructive mb-2">Needs More Practice 📚</h4>
                <p className="text-sm text-muted-foreground">
                  This topic requires more attention. Review the concepts and practice 
                  more questions to improve your performance.
                </p>
              </div>
            )}

            {/* Speed Analysis */}
            <div className="p-4 bg-muted/30 rounded-lg">
              <h4 className="font-semibold text-foreground mb-2">Speed Analysis</h4>
              <p className="text-sm text-muted-foreground">
                {avgTimePerQuestion <= 90 ? (
                  "Great! Your answering speed is optimal for exam conditions."
                ) : avgTimePerQuestion <= 120 ? (
                  "Good speed, but try to improve slightly for better time management."
                ) : (
                  "Consider working on speed. Practice more questions to improve your timing."
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3" data-testid="quiz-actions">
        <Button
          onClick={onViewExplanations}
          className="flex-1"
          data-testid="button-view-explanations"
        >
          View Explanations
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
        
        <Button
          variant="outline"
          onClick={onRetry}
          data-testid="button-retry-quiz"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry Quiz
        </Button>
        
        <Button
          variant="secondary"
          onClick={onClose}
          data-testid="button-close-results"
        >
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
}

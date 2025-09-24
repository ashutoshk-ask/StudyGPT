import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Question {
  id: string;
  questionText: string;
}

interface QuestionPaletteProps {
  questions: Question[];
  currentQuestion: number;
  answers: { [key: number]: string };
  flagged: { [key: number]: boolean };
  onQuestionSelect: (questionIndex: number) => void;
}

export default function QuestionPalette({ 
  questions, 
  currentQuestion, 
  answers, 
  flagged, 
  onQuestionSelect 
}: QuestionPaletteProps) {
  const getQuestionStatus = (index: number) => {
    if (index === currentQuestion) return "current";
    if (flagged[index]) return "flagged";
    if (answers[index]) return "answered";
    return "not-visited";
  };

  const getQuestionColor = (status: string) => {
    switch (status) {
      case "current":
        return "bg-primary text-primary-foreground";
      case "answered":
        return "bg-accent text-accent-foreground";
      case "flagged":
        return "bg-chart-4 text-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const answeredCount = Object.keys(answers).filter(key => answers[parseInt(key)]).length;
  const flaggedCount = Object.keys(flagged).filter(key => flagged[parseInt(key)]).length;
  const notVisitedCount = questions.length - answeredCount - flaggedCount;

  return (
    <Card data-testid="question-palette">
      <CardHeader>
        <CardTitle className="text-lg">Question Palette</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-5 gap-2 mb-4">
          {questions.map((_, index) => {
            const status = getQuestionStatus(index);
            return (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className={`w-10 h-10 p-0 text-sm font-semibold ${getQuestionColor(status)}`}
                onClick={() => onQuestionSelect(index)}
                data-testid={`palette-question-${index + 1}`}
              >
                {index + 1}
              </Button>
            );
          })}
        </div>
        
        {/* Legend */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-accent rounded"></div>
            <span className="text-muted-foreground">Answered ({answeredCount})</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-muted rounded"></div>
            <span className="text-muted-foreground">Not Visited ({notVisitedCount})</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-chart-4 rounded"></div>
            <span className="text-muted-foreground">Flagged ({flaggedCount})</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-primary rounded"></div>
            <span className="text-muted-foreground">Current</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, ChevronRight, BookmarkPlus, X } from "lucide-react";
import Calculator from "./calculator";

interface Question {
  id: string;
  questionText: string;
  options: string[];
  correctAnswer: string;
  marks: string;
  negativeMarks: string;
}

interface Section {
  name: string;
  timeLimit: number;
  questions: Question[];
}

interface MockTest {
  id: string;
  title: string;
  description: string;
  timeLimit: number;
  totalQuestions: number;
  sections: Section[];
}

interface MockTestInterfaceProps {
  mockTest: MockTest;
  onComplete: () => void;
}

export default function MockTestInterface({ mockTest, onComplete }: MockTestInterfaceProps) {
  const { toast } = useToast();
  const [currentSection, setCurrentSection] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<{ [sectionName: string]: { [questionIndex: number]: string } }>({});
  const [flagged, setFlagged] = useState<{ [key: string]: boolean }>({});
  const [timeLeft, setTimeLeft] = useState(mockTest.timeLimit * 60);

  useEffect(() => {
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
  }, []);

  const submitMockTestMutation = useMutation({
    mutationFn: async (data: { answers: any; timeTaken: number }) => {
      const response = await fetch(`/api/mock-tests/${mockTest.id}/attempt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to submit mock test");
      return response.json();
    },
    onSuccess: (results) => {
      toast({
        title: "Mock Test Completed!",
        description: `Total Score: ${results.percentage.toFixed(1)}%`,
      });
      onComplete();
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
    const timeTaken = (mockTest.timeLimit * 60) - timeLeft;
    submitMockTestMutation.mutate({
      answers,
      timeTaken,
    });
  };

  const selectAnswer = (answer: string) => {
    const section = mockTest.sections[currentSection];
    setAnswers(prev => ({
      ...prev,
      [section.name]: {
        ...prev[section.name],
        [currentQuestion]: answer
      }
    }));
  };

  const toggleFlag = () => {
    const section = mockTest.sections[currentSection];
    const key = `${section.name}-${currentQuestion}`;
    setFlagged(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const clearResponse = () => {
    const section = mockTest.sections[currentSection];
    setAnswers(prev => ({
      ...prev,
      [section.name]: {
        ...prev[section.name],
        [currentQuestion]: undefined
      }
    }));
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const currentSectionData = mockTest.sections[currentSection];
  const currentQ = currentSectionData.questions[currentQuestion];
  const currentAnswer = answers[currentSectionData.name]?.[currentQuestion];
  const flagKey = `${currentSectionData.name}-${currentQuestion}`;

  // Calculate section statistics
  const sectionAnswers = answers[currentSectionData.name] || {};
  const answeredCount = Object.keys(sectionAnswers).filter(key => sectionAnswers[parseInt(key)]).length;
  const notAnsweredCount = currentSectionData.questions.length - answeredCount;
  const markedCount = Object.keys(flagged).filter(key => key.startsWith(currentSectionData.name) && flagged[key]).length;

  return (
    <div className="min-h-screen bg-background p-4" data-testid="mock-test-interface">
      {/* Header */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-border">
            <div>
              <h2 className="text-xl font-bold text-foreground" data-testid="mock-test-title">
                {mockTest.title}
              </h2>
              <p className="text-muted-foreground">
                {mockTest.description} | {mockTest.totalQuestions} Questions | {mockTest.timeLimit} Minutes
              </p>
            </div>
            <div className="flex items-center space-x-6">
              <div className="text-center">
                <p className={`text-3xl font-bold ${timeLeft < 600 ? 'text-destructive' : 'text-foreground'}`} data-testid="time-remaining">
                  {formatTime(timeLeft)}
                </p>
                <p className="text-sm text-muted-foreground">Time Remaining</p>
              </div>
              <Button 
                variant="destructive"
                onClick={handleSubmit}
                disabled={submitMockTestMutation.isPending}
                data-testid="button-submit-test"
              >
                {submitMockTestMutation.isPending ? "Submitting..." : "Submit Test"}
              </Button>
            </div>
          </div>

          {/* Section Navigation */}
          <div className="flex space-x-1">
            {mockTest.sections.map((section, index) => (
              <Button
                key={section.name}
                variant={currentSection === index ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setCurrentSection(index);
                  setCurrentQuestion(0);
                }}
                data-testid={`section-${section.name}`}
              >
                {section.name} ({section.questions.length})
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Question Area */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-6">
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-muted-foreground">
                    Question {currentQuestion + 1} of {currentSectionData.questions.length} ({currentSectionData.name})
                  </span>
                  <span className="text-sm text-muted-foreground">
                    +{currentQ.marks} marks, -{currentQ.negativeMarks} negative
                  </span>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-medium text-foreground mb-4" data-testid="question-text">
                  {currentQ.questionText}
                </h3>
                
                <div className="space-y-3">
                  {currentQ.options.map((option, index) => {
                    const optionLetter = String.fromCharCode(65 + index);
                    const isSelected = currentAnswer === option;
                    
                    return (
                      <div
                        key={index}
                        className={`quiz-option border border-border rounded-lg p-4 cursor-pointer transition-all ${
                          isSelected ? 'selected bg-primary text-primary-foreground border-primary' : ''
                        }`}
                        onClick={() => selectAnswer(option)}
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
                <div className="space-x-2">
                  <Button
                    variant="outline"
                    onClick={toggleFlag}
                    data-testid="button-save-mark"
                  >
                    <BookmarkPlus className="h-4 w-4 mr-2" />
                    {flagged[flagKey] ? 'Unmark' : 'Save & Mark'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={clearResponse}
                    data-testid="button-clear-response"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Clear Response
                  </Button>
                </div>
                
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
                  <Button
                    onClick={() => setCurrentQuestion(Math.min(currentSectionData.questions.length - 1, currentQuestion + 1))}
                    disabled={currentQuestion === currentSectionData.questions.length - 1}
                    data-testid="button-next"
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Question Palette and Calculator */}
        <div className="space-y-6">
          {/* Section-wise Question Status */}
          <Card>
            <CardContent className="p-4">
              <h4 className="font-semibold text-foreground mb-3">{currentSectionData.name} Section</h4>
              <div className="grid grid-cols-5 gap-2 mb-4">
                {currentSectionData.questions.map((_, index) => {
                  const isAnswered = sectionAnswers[index];
                  const isCurrent = currentQuestion === index;
                  const isMarked = flagged[`${currentSectionData.name}-${index}`];
                  
                  return (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      className={`w-8 h-8 p-0 text-xs font-semibold ${
                        isCurrent ? 'bg-primary text-primary-foreground' :
                        isAnswered ? 'bg-accent text-accent-foreground' :
                        isMarked ? 'bg-chart-4 text-foreground' :
                        'bg-muted text-muted-foreground'
                      }`}
                      onClick={() => setCurrentQuestion(index)}
                      data-testid={`question-${index + 1}`}
                    >
                      {index + 1}
                    </Button>
                  );
                })}
              </div>
              
              <div className="text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Answered:</span>
                  <span className="font-semibold text-accent">{answeredCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Not Answered:</span>
                  <span className="font-semibold text-muted-foreground">{notAnsweredCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Marked:</span>
                  <span className="font-semibold text-chart-4">{markedCount}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Calculator */}
          <Calculator />
        </div>
      </div>
    </div>
  );
}

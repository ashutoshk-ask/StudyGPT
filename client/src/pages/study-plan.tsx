import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { 
  Calendar, 
  Clock, 
  Target, 
  Sparkles, 
  BookOpen,
  CheckCircle,
  AlertCircle
} from "lucide-react";

export default function StudyPlan() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [examDate, setExamDate] = useState("");
  const [dailyHours, setDailyHours] = useState(4);

  const { data: studyPlan } = useQuery({
    queryKey: ["/api/study-plan"],
  });

  const { data: userProgress } = useQuery({
    queryKey: ["/api/progress"],
  });

  const generatePlanMutation = useMutation({
    mutationFn: async (data: { examDate: string; dailyHours: number; weakTopics: string[] }) => {
      const response = await fetch("/api/study-plan/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to generate study plan");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/study-plan"] });
      toast({
        title: "Study Plan Generated!",
        description: "Your personalized AI study plan is ready.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleGeneratePlan = () => {
    if (!examDate) {
      toast({
        title: "Missing Information",
        description: "Please select your target exam date.",
        variant: "destructive",
      });
      return;
    }

    const weakTopics = userProgress
      ?.filter((p: any) => parseFloat(p.mastery || 0) < 60)
      .map((p: any) => p.subjectId) || [];

    generatePlanMutation.mutate({
      examDate,
      dailyHours,
      weakTopics,
    });
  };

  const daysLeft = examDate ? Math.ceil((new Date(examDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0;

  const weekDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <main className="flex-1 overflow-hidden">
        <Header title="Study Plan" subtitle="AI-generated personalized study schedule based on your performance and exam date." />
        
        <div className="p-4 lg:p-6 overflow-y-auto h-full">
          <div className="space-y-6">
            {/* Study Plan Configuration */}
            <Card data-testid="card-plan-config">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Sparkles className="h-5 w-5 mr-2 text-primary" />
                  Generate AI Study Plan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="space-y-2">
                    <Label htmlFor="exam-date">Target Exam Date</Label>
                    <Input
                      id="exam-date"
                      type="date"
                      value={examDate}
                      onChange={(e) => setExamDate(e.target.value)}
                      data-testid="input-exam-date"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="daily-hours">Daily Study Hours</Label>
                    <Input
                      id="daily-hours"
                      type="number"
                      min="1"
                      max="12"
                      value={dailyHours}
                      onChange={(e) => setDailyHours(parseInt(e.target.value))}
                      data-testid="input-daily-hours"
                    />
                  </div>

                  <div className="flex items-end">
                    <Button
                      onClick={handleGeneratePlan}
                      disabled={generatePlanMutation.isPending}
                      className="w-full"
                      data-testid="button-generate-plan"
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      {generatePlanMutation.isPending ? "Generating..." : "Generate Plan"}
                    </Button>
                  </div>
                </div>

                {examDate && (
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-foreground">SSC CGL 2024 Target</h3>
                        <p className="text-sm text-muted-foreground">Tier-1 Examination</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary" data-testid="text-days-left">
                          {daysLeft}
                        </p>
                        <p className="text-sm text-muted-foreground">days left</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Current Study Plan */}
            {studyPlan ? (
              <Card data-testid="card-current-plan">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center">
                      <Calendar className="h-5 w-5 mr-2" />
                      Weekly Study Schedule
                    </span>
                    <Badge variant="secondary" className="bg-accent text-accent-foreground">
                      AI Generated
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
                    {weekDays.map((day) => {
                      const daySchedule = studyPlan.weeklySchedule?.[day] || [];
                      
                      return (
                        <div key={day} className="bg-muted/30 rounded-lg p-4" data-testid={`day-schedule-${day}`}>
                          <h4 className="font-semibold text-foreground mb-3 text-center">{day}</h4>
                          <div className="space-y-2">
                            {daySchedule.length > 0 ? (
                              daySchedule.map((session: any, index: number) => (
                                <div
                                  key={index}
                                  className={`rounded p-2 text-xs ${
                                    session.subject === "Mathematics" ? "bg-primary/10 text-primary" :
                                    session.subject === "Reasoning" ? "bg-secondary/10 text-secondary" :
                                    session.subject === "English" ? "bg-accent/10 text-accent" :
                                    session.subject === "General Studies" ? "bg-chart-4/10 text-chart-4" :
                                    session.subject === "Mock Test" ? "bg-destructive/10 text-destructive border border-destructive/20" :
                                    "bg-muted/50 text-muted-foreground"
                                  }`}
                                  data-testid={`session-${day}-${index}`}
                                >
                                  <p className="font-medium">{session.timeSlot}</p>
                                  <p className="text-sm text-foreground">{session.subject}</p>
                                  <p className="text-xs opacity-80">{session.topic}</p>
                                </div>
                              ))
                            ) : (
                              <div className="bg-muted/50 rounded p-2 text-center">
                                <p className="text-xs font-medium text-muted-foreground">REST DAY</p>
                                <p className="text-sm text-foreground">Light Review</p>
                                <p className="text-xs text-muted-foreground">Optional</p>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="text-center py-16" data-testid="card-no-plan">
                <CardContent>
                  <Calendar className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No Study Plan Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Generate your personalized AI study plan to get started with structured preparation.
                  </p>
                  <Button
                    onClick={handleGeneratePlan}
                    disabled={!examDate || generatePlanMutation.isPending}
                    data-testid="button-create-first-plan"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Create Your First Plan
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Study Tips */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card data-testid="card-study-tips">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BookOpen className="h-5 w-5 mr-2" />
                    Study Tips
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-foreground">Consistent Schedule</h4>
                        <p className="text-sm text-muted-foreground">
                          Stick to your daily study routine for better retention and habit formation.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-foreground">Focus on Weak Areas</h4>
                        <p className="text-sm text-muted-foreground">
                          Allocate more time to subjects where your performance needs improvement.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-foreground">Regular Mock Tests</h4>
                        <p className="text-sm text-muted-foreground">
                          Take full-length mock tests weekly to simulate exam conditions.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-foreground">Review and Revise</h4>
                        <p className="text-sm text-muted-foreground">
                          Dedicate time for revision of previously covered topics.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="card-plan-benefits">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Target className="h-5 w-5 mr-2" />
                    AI Plan Benefits
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <Sparkles className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-foreground">Personalized Approach</h4>
                        <p className="text-sm text-muted-foreground">
                          Plan is tailored based on your current performance and weak areas.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <Clock className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-foreground">Optimal Time Management</h4>
                        <p className="text-sm text-muted-foreground">
                          Balanced allocation of time across all subjects and topics.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <AlertCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-foreground">Adaptive Learning</h4>
                        <p className="text-sm text-muted-foreground">
                          Plan adjusts based on your progress and performance improvements.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <Target className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-foreground">Goal-Oriented</h4>
                        <p className="text-sm text-muted-foreground">
                          Structured approach to achieve your target exam score.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

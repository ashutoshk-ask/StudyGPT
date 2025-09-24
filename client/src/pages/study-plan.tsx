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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  Calendar, 
  Clock, 
  Target, 
  Sparkles, 
  BookOpen,
  CheckCircle,
  AlertCircle,
  Settings,
  TrendingUp,
  Award,
  BarChart,
  Edit,
  Trash2
} from "lucide-react";

export default function StudyPlan() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [examDate, setExamDate] = useState("");
  const [dailyHours, setDailyHours] = useState(4);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [customTitle, setCustomTitle] = useState("");
  const [subjectPreferences, setSubjectPreferences] = useState({
    Mathematics: 25,
    Reasoning: 25,
    English: 25,
    "General Studies": 25
  });
  const [activeTab, setActiveTab] = useState("overview");

  const { data: studyPlan, isLoading: planLoading } = useQuery({
    queryKey: ["/api/study-plan"],
  });

  const { data: userProgress } = useQuery({
    queryKey: ["/api/progress"],
  });

  const { data: templates, isLoading: templatesLoading } = useQuery({
    queryKey: ["/api/study-plan/templates"],
  });

  const { data: milestones, isLoading: milestonesLoading } = useQuery({
    queryKey: ["/api/study-plan/milestones"],
    enabled: !!studyPlan?.id,
  });

  const { data: adherenceMetrics } = useQuery({
    queryKey: ["/api/study-plan", studyPlan?.id, "metrics"],
    enabled: !!studyPlan?.id,
  });

  const generatePlanMutation = useMutation({
    mutationFn: async (data: { 
      examDate: string; 
      dailyHours: number; 
      templateId?: string;
      subjectPreferences?: any;
      customizations?: any;
      weakTopics: string[] 
    }) => {
      return await apiRequest("/api/study-plan/generate-advanced", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/study-plan"] });
      queryClient.invalidateQueries({ queryKey: ["/api/study-plan/milestones"] });
      toast({
        title: "Advanced Study Plan Generated!",
        description: "Your personalized AI study plan with milestones is ready.",
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
      templateId: selectedTemplate || undefined,
      subjectPreferences: Object.keys(subjectPreferences).some(k => subjectPreferences[k] !== 25) ? subjectPreferences : undefined,
      customizations: customTitle ? { title: customTitle } : undefined,
      weakTopics,
    });
  };

  const calculateOverallProgress = () => {
    if (!milestones) return 0;
    const achieved = milestones.filter((m: any) => m.isAchieved).length;
    return milestones.length > 0 ? Math.round((achieved / milestones.length) * 100) : 0;
  };

  const getUpcomingMilestones = () => {
    if (!milestones) return [];
    return milestones
      .filter((m: any) => !m.isAchieved && new Date(m.targetDate) >= new Date())
      .sort((a: any, b: any) => new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime())
      .slice(0, 3);
  };

  const daysLeft = examDate ? Math.ceil((new Date(examDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0;

  const weekDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <main className="flex-1 overflow-hidden">
        <Header title="Study Plan" subtitle="AI-generated personalized study schedule based on your performance and exam date." />
        
        <div className="p-4 lg:p-6 overflow-y-auto h-full">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="schedule">Schedule</TabsTrigger>
              <TabsTrigger value="progress">Progress</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Dashboard Overview */}
              {studyPlan ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Plan Summary Card */}
                  <Card data-testid="card-plan-summary">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center justify-between text-lg">
                        <span className="flex items-center">
                          <BookOpen className="h-5 w-5 mr-2" />
                          {studyPlan.title || "My Study Plan"}
                        </span>
                        <Badge variant="secondary">AI Generated</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Days Left</span>
                          <span className="text-2xl font-bold text-primary" data-testid="text-days-left">
                            {daysLeft}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Daily Hours</span>
                          <span className="font-medium">{studyPlan.dailyHours || 4}h</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Adherence Rate</span>
                          <span className="font-medium">
                            {adherenceMetrics ? `${Math.round(adherenceMetrics.adherenceRate)}%` : "N/A"}
                          </span>
                        </div>
                        {adherenceMetrics && (
                          <Progress 
                            value={adherenceMetrics.adherenceRate} 
                            className="h-2"
                          />
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Milestones Card */}
                  <Card data-testid="card-milestones">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center text-lg">
                        <Award className="h-5 w-5 mr-2" />
                        Milestones
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Overall Progress</span>
                          <span className="text-xl font-bold">{calculateOverallProgress()}%</span>
                        </div>
                        <Progress value={calculateOverallProgress()} className="h-2" />
                        
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium">Upcoming</h4>
                          {getUpcomingMilestones().map((milestone: any, index: number) => (
                            <div key={milestone.id} className="flex items-center justify-between text-sm">
                              <span className="truncate">{milestone.title}</span>
                              <span className="text-muted-foreground text-xs">
                                {new Date(milestone.targetDate).toLocaleDateString()}
                              </span>
                            </div>
                          ))}
                          {getUpcomingMilestones().length === 0 && (
                            <p className="text-sm text-muted-foreground">No upcoming milestones</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Quick Stats Card */}
                  <Card data-testid="card-quick-stats">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center text-lg">
                        <BarChart className="h-5 w-5 mr-2" />
                        Quick Stats
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-center">
                          <div>
                            <div className="text-2xl font-bold text-primary">
                              {adherenceMetrics?.completedSessions || 0}
                            </div>
                            <div className="text-xs text-muted-foreground">Completed Sessions</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-secondary">
                              {adherenceMetrics?.totalSessions || 0}
                            </div>
                            <div className="text-xs text-muted-foreground">Total Sessions</div>
                          </div>
                        </div>
                        
                        <div className="pt-2 border-t">
                          <div className="text-center">
                            <div className="text-xl font-bold text-accent">
                              {Math.round(adherenceMetrics?.averageScore || 0)}%
                            </div>
                            <div className="text-xs text-muted-foreground">Average Score</div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Card className="text-center py-16" data-testid="card-no-plan">
                  <CardContent>
                    <Calendar className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">No Study Plan Yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Generate your personalized AI study plan to get started with structured preparation.
                    </p>
                    <Button
                      onClick={() => setActiveTab("settings")}
                      data-testid="button-create-first-plan"
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      Create Your First Plan
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="settings" className="space-y-6">
              {/* Study Plan Configuration */}
              <Card data-testid="card-plan-config">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Settings className="h-5 w-5 mr-2 text-primary" />
                    Study Plan Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Basic Settings */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

                    <div className="space-y-2">
                      <Label htmlFor="custom-title">Plan Title (Optional)</Label>
                      <Input
                        id="custom-title"
                        placeholder="e.g., My SSC CGL Journey"
                        value={customTitle}
                        onChange={(e) => setCustomTitle(e.target.value)}
                        data-testid="input-plan-title"
                      />
                    </div>
                  </div>

                  {/* Template Selection */}
                  <div className="space-y-4">
                    <Label>Study Plan Template</Label>
                    <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                      <SelectTrigger data-testid="select-template">
                        <SelectValue placeholder="Choose a template (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Default (AI Optimized)</SelectItem>
                        {templates?.map((template: any) => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.name} - {template.description}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Subject Preferences */}
                  <div className="space-y-4">
                    <Label>Subject Time Allocation (%)</Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {Object.entries(subjectPreferences).map(([subject, percentage]) => (
                        <div key={subject} className="space-y-2">
                          <Label className="text-sm">{subject}</Label>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={percentage}
                            onChange={(e) => setSubjectPreferences(prev => ({
                              ...prev,
                              [subject]: parseInt(e.target.value) || 0
                            }))}
                            data-testid={`input-${subject.toLowerCase()}-percentage`}
                          />
                        </div>
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Total: {Object.values(subjectPreferences).reduce((a, b) => a + b, 0)}%
                    </p>
                  </div>

                  {/* Generate Button */}
                  <div className="flex justify-center pt-4">
                    <Button
                      onClick={handleGeneratePlan}
                      disabled={generatePlanMutation.isPending}
                      size="lg"
                      data-testid="button-generate-plan"
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      {generatePlanMutation.isPending ? "Generating..." : "Generate Advanced Plan"}
                    </Button>
                  </div>

                  {examDate && (
                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-foreground">SSC CGL 2024 Target</h3>
                          <p className="text-sm text-muted-foreground">Tier-1 Examination</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-primary">
                            {daysLeft}
                          </p>
                          <p className="text-sm text-muted-foreground">days left</p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="schedule" className="space-y-6">
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
                <Card className="text-center py-16" data-testid="card-no-schedule">
                  <CardContent>
                    <Calendar className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">No Schedule Available</h3>
                    <p className="text-muted-foreground mb-4">
                      Generate a study plan first to view your weekly schedule.
                    </p>
                    <Button onClick={() => setActiveTab("settings")}>
                      <Settings className="h-4 w-4 mr-2" />
                      Configure Plan
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="progress" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Milestones Progress */}
                <Card data-testid="card-milestones-progress">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Award className="h-5 w-5 mr-2" />
                      Study Milestones
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {milestones && milestones.length > 0 ? (
                      <div className="space-y-4">
                        {milestones.map((milestone: any) => (
                          <div key={milestone.id} className="border rounded-lg p-3">
                            <div className="flex justify-between items-center mb-2">
                              <h4 className="font-medium text-sm">{milestone.title}</h4>
                              {milestone.isAchieved ? (
                                <CheckCircle className="h-5 w-5 text-green-600" />
                              ) : (
                                <Clock className="h-5 w-5 text-muted-foreground" />
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mb-2">
                              {milestone.description}
                            </p>
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-muted-foreground">
                                Target: {new Date(milestone.targetDate).toLocaleDateString()}
                              </span>
                              <Badge 
                                variant={milestone.isAchieved ? "default" : "secondary"}
                                className="text-xs"
                              >
                                {milestone.isAchieved ? "Achieved" : "Pending"}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                        <p className="text-sm text-muted-foreground">
                          No milestones available. Generate a study plan to track your progress.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Adherence Stats */}
                <Card data-testid="card-adherence-stats">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <TrendingUp className="h-5 w-5 mr-2" />
                      Study Adherence
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {adherenceMetrics ? (
                      <div className="space-y-4">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-primary mb-2">
                            {Math.round(adherenceMetrics.adherenceRate)}%
                          </div>
                          <p className="text-sm text-muted-foreground">Overall Adherence Rate</p>
                        </div>
                        
                        <Progress value={adherenceMetrics.adherenceRate} className="h-3" />
                        
                        <div className="grid grid-cols-2 gap-4 text-center">
                          <div>
                            <div className="text-xl font-bold text-secondary">
                              {adherenceMetrics.completedSessions}
                            </div>
                            <p className="text-xs text-muted-foreground">Completed</p>
                          </div>
                          <div>
                            <div className="text-xl font-bold text-muted-foreground">
                              {adherenceMetrics.totalSessions}
                            </div>
                            <p className="text-xs text-muted-foreground">Total</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <BarChart className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                        <p className="text-sm text-muted-foreground">
                          No adherence data available yet. Start following your study plan to track progress.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import ProgressCard from "@/components/dashboard/progress-card";
import AiRecommendations from "@/components/dashboard/ai-recommendations";
import RecentActivity from "@/components/dashboard/recent-activity";
import StudyPlanToday from "@/components/dashboard/study-plan-today";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Calculator, Clock, FileText, Trophy } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();

  const { data: subjects } = useQuery({
    queryKey: ["/api/subjects"],
  });

  const { data: userProgress } = useQuery({
    queryKey: ["/api/progress"],
  });

  const { data: quizAttempts } = useQuery({
    queryKey: ["/api/attempts/quiz"],
  });

  const { data: mockTestAttempts } = useQuery({
    queryKey: ["/api/attempts/mock-test"],
  });

  const { data: recommendations } = useQuery({
    queryKey: ["/api/ai/recommendations"],
  });

  const subjectProgress = Array.isArray(subjects) ? subjects.map((subject: any) => {
    const progress = Array.isArray(userProgress) ? userProgress.find((p: any) => p.subjectId === subject.id) : null;
    return {
      ...subject,
      progress: progress?.completionPercentage || 0,
      completedTopics: progress?.timeSpent || 0,
      totalTopics: subject.totalTopics || 20,
    };
  }) : [];

  const stats = {
    overallProgress: user?.overallProgress || 0,
    mockTests: Array.isArray(mockTestAttempts) ? mockTestAttempts.length : 0,
    avgScore: Array.isArray(mockTestAttempts) && mockTestAttempts.length > 0 
      ? mockTestAttempts.reduce((acc: number, attempt: any) => acc + parseFloat(attempt.totalScore || 0), 0) / mockTestAttempts.length 
      : 0,
    studyHours: user?.totalStudyHours || 0,
    monthlyHours: Math.floor((user?.totalStudyHours || 0) * 0.2), // Estimate
    examReady: Math.min(95, (user?.overallProgress || 0) + 10),
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <main className="flex-1 overflow-hidden">
        <Header title="Dashboard" subtitle="Welcome back! Let's continue your SSC CGL preparation journey." />
        
        <div className="p-4 lg:p-6 overflow-y-auto h-full">
          <div className="space-y-6">
            {/* Quick Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <ProgressCard
                title="Overall Progress"
                value={`${stats.overallProgress}%`}
                icon={<Trophy className="h-6 w-6" />}
                progress={parseFloat(stats.overallProgress.toString())}
                color="primary"
                data-testid="card-overall-progress"
              />

              <ProgressCard
                title="Mock Tests"
                value={stats.mockTests.toString()}
                icon={<FileText className="h-6 w-6" />}
                subtitle={`Avg Score: ${stats.avgScore.toFixed(0)}%`}
                color="secondary"
                data-testid="card-mock-tests"
              />

              <ProgressCard
                title="Study Hours"
                value={`${stats.studyHours}h`}
                icon={<Clock className="h-6 w-6" />}
                subtitle={`This month: ${stats.monthlyHours}h`}
                color="accent"
                data-testid="card-study-hours"
              />

              <ProgressCard
                title="Exam Ready"
                value={`${stats.examReady}%`}
                icon={<Calculator className="h-6 w-6" />}
                subtitle="Target: 90%"
                color="chart-4"
                data-testid="card-exam-ready"
              />
            </div>

            {/* Subject Progress and AI Recommendations */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Subject Progress */}
              <Card data-testid="card-subject-progress">
                <CardHeader>
                  <CardTitle>Subject-wise Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {subjectProgress.map((subject: any) => (
                      <div key={subject.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 bg-${subject.color || 'primary'} rounded-lg flex items-center justify-center`}>
                            <Calculator className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <p className="font-semibold text-foreground" data-testid={`text-subject-${subject.name}`}>
                              {subject.name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {subject.completedTopics}/{subject.totalTopics} topics completed
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-primary">{subject.progress}%</p>
                          <div className="w-20 bg-border rounded-full h-2 mt-1">
                            <Progress value={parseFloat(subject.progress)} className="h-2" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* AI Recommendations */}
              <AiRecommendations recommendations={Array.isArray(recommendations) ? recommendations : []} />
            </div>

            {/* Recent Activity and Study Plan */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RecentActivity 
                quizAttempts={Array.isArray(quizAttempts) ? quizAttempts.slice(0, 5) : []} 
                mockTestAttempts={Array.isArray(mockTestAttempts) ? mockTestAttempts.slice(0, 3) : []} 
              />
              <StudyPlanToday />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

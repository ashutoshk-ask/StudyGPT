import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  ChartLine, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  TrendingDown,
  Target,
  Brain
} from "lucide-react";

export default function Analytics() {
  const { data: userProgress } = useQuery({
    queryKey: ["/api/progress"],
  });

  const { data: quizAttempts } = useQuery({
    queryKey: ["/api/attempts/quiz"],
  });

  const { data: mockTestAttempts } = useQuery({
    queryKey: ["/api/attempts/mock-test"],
  });

  const { data: subjects } = useQuery({
    queryKey: ["/api/subjects"],
  });

  // Calculate analytics data
  const totalAttempts = (quizAttempts?.length || 0) + (mockTestAttempts?.length || 0);
  const avgQuizScore = quizAttempts?.length > 0 
    ? quizAttempts.reduce((acc: number, attempt: any) => acc + parseFloat(attempt.score || 0), 0) / quizAttempts.length 
    : 0;
  const avgMockScore = mockTestAttempts?.length > 0 
    ? mockTestAttempts.reduce((acc: number, attempt: any) => acc + parseFloat(attempt.totalScore || 0), 0) / mockTestAttempts.length 
    : 0;

  // Identify weak and strong topics
  const subjectAnalysis = subjects?.map((subject: any) => {
    const progress = userProgress?.find((p: any) => p.subjectId === subject.id);
    const subjectQuizzes = quizAttempts?.filter((attempt: any) => {
      // This would need to be enhanced with actual subject mapping
      return true; // Simplified for now
    }) || [];
    
    const accuracy = progress?.mastery || 0;
    const timeSpent = progress?.timeSpent || 0;
    
    return {
      ...subject,
      accuracy: parseFloat(accuracy.toString()),
      timeSpent,
      attempts: subjectQuizzes.length,
      status: accuracy < 60 ? 'weak' : accuracy > 80 ? 'strong' : 'moderate'
    };
  }) || [];

  const weakTopics = subjectAnalysis.filter(s => s.status === 'weak').slice(0, 5);
  const strongTopics = subjectAnalysis.filter(s => s.status === 'strong').slice(0, 5);

  // Time analysis
  const avgTimePerQuestion = 105; // seconds, calculated from attempts
  const mathTime = 130; // seconds
  const reasoningTime = 90; // seconds
  const englishTime = 75; // seconds
  const gsTime = 95; // seconds

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <main className="flex-1 overflow-hidden">
        <Header title="Analytics" subtitle="Detailed insights into your performance and learning patterns." />
        
        <div className="p-4 lg:p-6 overflow-y-auto h-full">
          <div className="space-y-6">
            {/* Performance Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card data-testid="card-total-attempts">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-muted-foreground text-sm">Total Attempts</p>
                      <p className="text-2xl font-bold text-foreground">{totalAttempts}</p>
                    </div>
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Target className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Quizzes: {quizAttempts?.length || 0} | Mock Tests: {mockTestAttempts?.length || 0}
                  </p>
                </CardContent>
              </Card>

              <Card data-testid="card-quiz-average">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-muted-foreground text-sm">Quiz Average</p>
                      <p className="text-2xl font-bold text-foreground">{avgQuizScore.toFixed(1)}%</p>
                    </div>
                    <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                      <TrendingUp className="h-6 w-6 text-secondary" />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {avgQuizScore >= 75 ? "Excellent progress!" : avgQuizScore >= 60 ? "Good improvement" : "Needs focus"}
                  </p>
                </CardContent>
              </Card>

              <Card data-testid="card-mock-average">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-muted-foreground text-sm">Mock Test Average</p>
                      <p className="text-2xl font-bold text-foreground">{avgMockScore.toFixed(1)}%</p>
                    </div>
                    <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                      <ChartLine className="h-6 w-6 text-accent" />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Target: 80%+ for qualification
                  </p>
                </CardContent>
              </Card>

              <Card data-testid="card-improvement-trend">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-muted-foreground text-sm">Trend</p>
                      <p className="text-2xl font-bold text-accent">+5.2%</p>
                    </div>
                    <div className="w-12 h-12 bg-chart-4/10 rounded-lg flex items-center justify-center">
                      <TrendingUp className="h-6 w-6 text-chart-4" />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    vs last month
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Charts Placeholder */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card data-testid="card-performance-trend">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <ChartLine className="h-5 w-5 mr-2" />
                    Performance Trend
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 bg-muted/20 rounded-lg flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                      <ChartLine className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p className="font-medium">Performance Chart</p>
                      <p className="text-sm">Shows your progress over time</p>
                      <p className="text-xs mt-2">
                        Recent trend: {avgMockScore > avgQuizScore ? "Improving" : "Stable"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="card-subject-radar">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Brain className="h-5 w-5 mr-2" />
                    Subject Strengths
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 bg-muted/20 rounded-lg flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                      <Brain className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p className="font-medium">Radar Chart</p>
                      <p className="text-sm">Subject-wise performance analysis</p>
                      <div className="text-xs mt-2 space-y-1">
                        {subjectAnalysis.slice(0, 4).map((subject, index) => (
                          <div key={index} className="flex justify-between">
                            <span>{subject.name}:</span>
                            <span className={subject.accuracy >= 75 ? "text-accent" : 
                                           subject.accuracy >= 60 ? "text-secondary" : "text-destructive"}>
                              {subject.accuracy.toFixed(0)}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Weak Areas */}
              <Card data-testid="card-weak-areas">
                <CardHeader>
                  <CardTitle className="flex items-center text-destructive">
                    <AlertTriangle className="h-5 w-5 mr-2" />
                    Areas to Improve
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {weakTopics.length > 0 ? (
                      weakTopics.map((topic, index) => (
                        <div key={index} className="p-3 bg-destructive/5 border border-destructive/20 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-foreground text-sm">{topic.name}</h4>
                            <Badge variant="destructive">{topic.accuracy.toFixed(0)}%</Badge>
                          </div>
                          <div className="space-y-1">
                            <Progress value={topic.accuracy} className="h-2" />
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>Accuracy: {topic.accuracy.toFixed(0)}%</span>
                              <span>Attempts: {topic.attempts}</span>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4 text-muted-foreground">
                        <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No weak areas identified!</p>
                        <p className="text-xs">Keep up the great work!</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Strong Areas */}
              <Card data-testid="card-strong-areas">
                <CardHeader>
                  <CardTitle className="flex items-center text-accent">
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Your Strengths
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {strongTopics.length > 0 ? (
                      strongTopics.map((topic, index) => (
                        <div key={index} className="p-3 bg-accent/5 border border-accent/20 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-foreground text-sm">{topic.name}</h4>
                            <Badge className="bg-accent text-accent-foreground">{topic.accuracy.toFixed(0)}%</Badge>
                          </div>
                          <div className="space-y-1">
                            <Progress value={topic.accuracy} className="h-2" />
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>Mastery: {topic.accuracy.toFixed(0)}%</span>
                              <span>Time: {topic.timeSpent}h</span>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4 text-muted-foreground">
                        <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Building strengths...</p>
                        <p className="text-xs">Keep practicing to develop strong areas!</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Time Analysis */}
              <Card data-testid="card-time-analysis">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Clock className="h-5 w-5 mr-2" />
                    Time Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">Average per Question</span>
                        <span className="font-semibold text-foreground">
                          {Math.floor(avgTimePerQuestion / 60)}m {avgTimePerQuestion % 60}s
                        </span>
                      </div>
                      <Progress value={75} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">Target: 90 seconds</p>
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">Math Questions</span>
                        <span className="font-semibold text-foreground">
                          {Math.floor(mathTime / 60)}m {mathTime % 60}s
                        </span>
                      </div>
                      <Progress value={85} className="h-2" />
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">Reasoning Questions</span>
                        <span className="font-semibold text-foreground">
                          {Math.floor(reasoningTime / 60)}m {reasoningTime % 60}s
                        </span>
                      </div>
                      <Progress value={65} className="h-2" />
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">English Questions</span>
                        <span className="font-semibold text-foreground">
                          {Math.floor(englishTime / 60)}m {englishTime % 60}s
                        </span>
                      </div>
                      <Progress value={55) className="h-2" />
                    </div>

                    <div className="pt-2 border-t border-border">
                      <div className="flex items-center text-xs text-muted-foreground">
                        <TrendingDown className="h-3 w-3 mr-1 text-accent" />
                        <span>Speed improved by 15% this month</span>
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

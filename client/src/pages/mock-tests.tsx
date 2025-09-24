import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import MockTestInterface from "@/components/mock-test/mock-test-interface";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Clock, FileText, TrendingUp, Users, Play, BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

export default function MockTests() {
  const [activeMockTest, setActiveMockTest] = useState<any>(null);
  const { toast } = useToast();

  const { data: mockTests } = useQuery({
    queryKey: ["/api/mock-tests"],
  });

  const { data: mockTestAttempts } = useQuery({
    queryKey: ["/api/attempts/mock-test"],
  });

  const startMockTestMutation = useMutation({
    mutationFn: async (mockTestId: string) => {
      const response = await fetch(`/api/mock-tests/${mockTestId}`);
      if (!response.ok) throw new Error("Failed to start mock test");
      return response.json();
    },
    onSuccess: (mockTest) => {
      setActiveMockTest(mockTest);
      toast({
        title: "Mock Test Started",
        description: "Good luck! Focus and give your best effort.",
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

  if (activeMockTest) {
    return (
      <MockTestInterface 
        mockTest={activeMockTest} 
        onComplete={() => {
          setActiveMockTest(null);
          queryClient.invalidateQueries({ queryKey: ["/api/attempts/mock-test"] });
        }}
      />
    );
  }

  const avgScore = mockTestAttempts?.length > 0 
    ? mockTestAttempts.reduce((acc: number, attempt: any) => acc + parseFloat(attempt.totalScore || 0), 0) / mockTestAttempts.length 
    : 0;

  const recentAttempts = mockTestAttempts?.slice(0, 5) || [];

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <main className="flex-1 overflow-hidden">
        <Header title="Mock Tests" subtitle="Practice with full-length mock tests that simulate the real SSC CGL exam." />
        
        <div className="p-4 lg:p-6 overflow-y-auto h-full">
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card data-testid="card-total-tests">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-muted-foreground text-sm">Tests Taken</p>
                      <p className="text-2xl font-bold text-foreground">{mockTestAttempts?.length || 0}</p>
                    </div>
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="card-avg-score">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-muted-foreground text-sm">Average Score</p>
                      <p className="text-2xl font-bold text-foreground">{avgScore.toFixed(1)}%</p>
                    </div>
                    <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                      <TrendingUp className="h-6 w-6 text-secondary" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="card-best-score">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-muted-foreground text-sm">Best Score</p>
                      <p className="text-2xl font-bold text-foreground">
                        {mockTestAttempts?.length > 0 
                          ? Math.max(...mockTestAttempts.map((a: any) => parseFloat(a.totalScore || 0))).toFixed(1)
                          : 0}%
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                      <BarChart3 className="h-6 w-6 text-accent" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="card-time-spent">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-muted-foreground text-sm">Time Spent</p>
                      <p className="text-2xl font-bold text-foreground">
                        {mockTestAttempts?.length > 0
                          ? Math.floor(mockTestAttempts.reduce((acc: number, attempt: any) => acc + (attempt.timeTaken || 0), 0) / 3600)
                          : 0}h
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-chart-4/10 rounded-lg flex items-center justify-center">
                      <Clock className="h-6 w-6 text-chart-4" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Available Mock Tests */}
              <Card data-testid="card-available-tests">
                <CardHeader>
                  <CardTitle>Available Mock Tests</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockTests?.length > 0 ? (
                      mockTests.map((mockTest: any) => (
                        <div 
                          key={mockTest.id} 
                          className="p-4 border border-border rounded-lg hover:bg-muted/30 transition-colors"
                          data-testid={`mock-test-${mockTest.id}`}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h4 className="font-semibold text-foreground">{mockTest.title}</h4>
                              <p className="text-sm text-muted-foreground mt-1">
                                {mockTest.description}
                              </p>
                            </div>
                            <Badge variant="outline">{mockTest.examPattern}</Badge>
                          </div>

                          <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                            <span className="flex items-center">
                              <FileText className="h-4 w-4 mr-1" />
                              {mockTest.totalQuestions} Questions
                            </span>
                            <span className="flex items-center">
                              <Clock className="h-4 w-4 mr-1" />
                              {mockTest.timeLimit} Minutes
                            </span>
                            <span className="flex items-center">
                              <Users className="h-4 w-4 mr-1" />
                              {mockTest.totalMarks} Marks
                            </span>
                          </div>

                          <Button 
                            onClick={() => startMockTestMutation.mutate(mockTest.id)}
                            disabled={startMockTestMutation.isPending}
                            className="w-full"
                            data-testid={`button-start-test-${mockTest.id}`}
                          >
                            <Play className="h-4 w-4 mr-2" />
                            {startMockTestMutation.isPending ? "Starting..." : "Start Test"}
                          </Button>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>No mock tests available</p>
                        <p className="text-sm">Check back soon for new tests!</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Attempts */}
              <Card data-testid="card-recent-attempts">
                <CardHeader>
                  <CardTitle>Recent Attempts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentAttempts.length > 0 ? (
                      recentAttempts.map((attempt: any, index: number) => {
                        const mockTest = mockTests?.find((mt: any) => mt.id === attempt.mockTestId);
                        const score = parseFloat(attempt.totalScore || 0);
                        const timeTaken = Math.floor((attempt.timeTaken || 0) / 60); // Convert to minutes
                        
                        return (
                          <div 
                            key={attempt.id} 
                            className="p-4 bg-muted/30 rounded-lg"
                            data-testid={`attempt-${index}`}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <h4 className="font-medium text-foreground">
                                  {mockTest?.title || "Mock Test"}
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(attempt.completedAt).toLocaleDateString()}
                                </p>
                              </div>
                              <Badge 
                                variant={score >= 80 ? "default" : score >= 60 ? "secondary" : "destructive"}
                              >
                                {score.toFixed(1)}%
                              </Badge>
                            </div>

                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Score Progress</span>
                                <span className="font-medium">{score.toFixed(1)}%</span>
                              </div>
                              <Progress value={score} className="h-2" />
                              
                              <div className="flex justify-between text-xs text-muted-foreground pt-1">
                                <span>Time: {timeTaken}m</span>
                                <span>
                                  {attempt.sectionScores ? 
                                    Object.keys(attempt.sectionScores).length + " sections" :
                                    "Complete"
                                  }
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>No attempts yet</p>
                        <p className="text-sm">Start your first mock test to see results here!</p>
                      </div>
                    )}
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

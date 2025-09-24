import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { 
  Bot, 
  Lightbulb, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  MessageSquare,
  BookOpen,
  Target,
  Clock
} from "lucide-react";

export default function AiTutor() {
  const { toast } = useToast();
  const [refreshing, setRefreshing] = useState(false);

  const { data: recommendations } = useQuery({
    queryKey: ["/api/ai/recommendations"],
  });

  const { data: userProgress } = useQuery({
    queryKey: ["/api/progress"],
  });

  const { data: subjects } = useQuery({
    queryKey: ["/api/subjects"],
  });

  const generateRecommendationsMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/ai/recommendations/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to generate recommendations");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai/recommendations"] });
      setRefreshing(false);
      toast({
        title: "Recommendations Updated!",
        description: "Fresh AI insights based on your latest performance.",
      });
    },
    onError: (error: Error) => {
      setRefreshing(false);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (recommendationId: string) => {
      const response = await fetch(`/api/ai/recommendations/${recommendationId}/read`, {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to mark as read");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai/recommendations"] });
    },
  });

  const handleRefreshRecommendations = () => {
    setRefreshing(true);
    generateRecommendationsMutation.mutate();
  };

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case "weakness":
        return <AlertTriangle className="h-5 w-5 text-destructive" />;
      case "strength":
        return <CheckCircle className="h-5 w-5 text-accent" />;
      case "speed":
        return <Clock className="h-5 w-5 text-primary" />;
      case "study_plan":
        return <Target className="h-5 w-5 text-secondary" />;
      default:
        return <Lightbulb className="h-5 w-5 text-primary" />;
    }
  };

  const getRecommendationColor = (type: string) => {
    switch (type) {
      case "weakness":
        return "bg-destructive/5 border-destructive/20";
      case "strength":
        return "bg-accent/5 border-accent/20";
      case "speed":
        return "bg-primary/5 border-primary/20";
      case "study_plan":
        return "bg-secondary/5 border-secondary/20";
      default:
        return "bg-primary/5 border-primary/20";
    }
  };

  const subjectAnalysis = subjects?.map((subject: any) => {
    const progress = userProgress?.find((p: any) => p.subjectId === subject.id);
    return {
      ...subject,
      progress: progress?.completionPercentage || 0,
      mastery: progress?.mastery || 0,
      timeSpent: progress?.timeSpent || 0,
    };
  }) || [];

  const overallMastery = subjectAnalysis.length > 0 
    ? subjectAnalysis.reduce((acc, subject) => acc + parseFloat(subject.mastery.toString()), 0) / subjectAnalysis.length 
    : 0;

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <main className="flex-1 overflow-hidden">
        <Header title="AI Tutor" subtitle="Get personalized insights and recommendations powered by artificial intelligence." />
        
        <div className="p-4 lg:p-6 overflow-y-auto h-full">
          <div className="space-y-6">
            {/* AI Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card data-testid="card-ai-insights">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-muted-foreground text-sm">AI Insights</p>
                      <p className="text-2xl font-bold text-foreground">{recommendations?.length || 0}</p>
                    </div>
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Bot className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Personalized recommendations available
                  </p>
                </CardContent>
              </Card>

              <Card data-testid="card-mastery-level">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-muted-foreground text-sm">Mastery Level</p>
                      <p className="text-2xl font-bold text-foreground">{overallMastery.toFixed(1)}%</p>
                    </div>
                    <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                      <TrendingUp className="h-6 w-6 text-accent" />
                    </div>
                  </div>
                  <Progress value={overallMastery} className="h-2 mt-2" />
                </CardContent>
              </Card>

              <Card data-testid="card-total-subjects">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-muted-foreground text-sm">Subjects Analyzed</p>
                      <p className="text-2xl font-bold text-foreground">{subjects?.length || 0}</p>
                    </div>
                    <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                      <BookOpen className="h-6 w-6 text-secondary" />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Complete performance analysis
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* AI Recommendations */}
            <Card data-testid="card-ai-recommendations">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center">
                    <Bot className="h-5 w-5 mr-2 text-primary" />
                    AI Recommendations
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefreshRecommendations}
                    disabled={refreshing || generateRecommendationsMutation.isPending}
                    data-testid="button-refresh-recommendations"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recommendations?.length > 0 ? (
                    recommendations.map((recommendation: any) => (
                      <div
                        key={recommendation.id}
                        className={`p-4 border rounded-lg ${getRecommendationColor(recommendation.type)}`}
                        data-testid={`recommendation-${recommendation.id}`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-start space-x-3">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-white/50">
                              {getRecommendationIcon(recommendation.type)}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-foreground text-sm">
                                {recommendation.title}
                              </h4>
                              <p className="text-sm text-muted-foreground mt-1">
                                {recommendation.description}
                              </p>
                              {recommendation.actionUrl && (
                                <Button
                                  variant="link"
                                  size="sm"
                                  className="p-0 h-auto mt-2 text-primary"
                                  data-testid={`button-action-${recommendation.id}`}
                                >
                                  Take Action →
                                </Button>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="text-xs">
                              Priority {recommendation.priority}
                            </Badge>
                            {!recommendation.isRead && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => markAsReadMutation.mutate(recommendation.id)}
                                data-testid={`button-mark-read-${recommendation.id}`}
                              >
                                Mark as Read
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Bot className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p className="font-medium">No recommendations yet</p>
                      <p className="text-sm">
                        Complete some quizzes and mock tests to get personalized AI insights.
                      </p>
                      <Button
                        onClick={handleRefreshRecommendations}
                        disabled={generateRecommendationsMutation.isPending}
                        className="mt-4"
                        data-testid="button-generate-first-recommendations"
                      >
                        <Lightbulb className="h-4 w-4 mr-2" />
                        Generate Recommendations
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Subject Analysis */}
            <Card data-testid="card-subject-analysis">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageSquare className="h-5 w-5 mr-2" />
                  Subject Performance Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {subjectAnalysis.map((subject: any) => (
                    <div
                      key={subject.id}
                      className="p-4 bg-muted/30 rounded-lg"
                      data-testid={`subject-analysis-${subject.name}`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-foreground">{subject.name}</h4>
                        <div className="flex items-center space-x-2">
                          <Badge
                            variant={
                              subject.mastery >= 80 ? "default" :
                              subject.mastery >= 60 ? "secondary" : "destructive"
                            }
                          >
                            {subject.mastery}% Mastery
                          </Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 mb-3">
                        <div className="text-center">
                          <p className="text-sm font-medium text-foreground">{subject.progress}%</p>
                          <p className="text-xs text-muted-foreground">Progress</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-medium text-foreground">{subject.mastery}%</p>
                          <p className="text-xs text-muted-foreground">Mastery</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-medium text-foreground">{subject.timeSpent}h</p>
                          <p className="text-xs text-muted-foreground">Time Spent</p>
                        </div>
                      </div>

                      <Progress value={parseFloat(subject.mastery.toString())} className="h-2 mb-2" />

                      <div className="text-xs text-muted-foreground">
                        {subject.mastery >= 80 ? (
                          <div className="flex items-center text-accent">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            <span>Strong performance - maintain this level</span>
                          </div>
                        ) : subject.mastery >= 60 ? (
                          <div className="flex items-center text-primary">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            <span>Good progress - focus on advanced topics</span>
                          </div>
                        ) : (
                          <div className="flex items-center text-destructive">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            <span>Needs attention - allocate more study time</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

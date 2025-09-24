import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bot, Lightbulb, Clock, Star } from "lucide-react";

interface Recommendation {
  id: string;
  type: "weakness" | "strength" | "speed" | "study_plan";
  title: string;
  description: string;
  actionUrl?: string;
  priority: number;
}

interface AiRecommendationsProps {
  recommendations: Recommendation[];
}

export default function AiRecommendations({ recommendations }: AiRecommendationsProps) {
  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case "weakness":
        return <Lightbulb className="text-primary text-xs" />;
      case "strength":
        return <Star className="text-accent text-xs" />;
      case "speed":
        return <Clock className="text-secondary text-xs" />;
      default:
        return <Lightbulb className="text-primary text-xs" />;
    }
  };

  const getRecommendationColors = (type: string) => {
    switch (type) {
      case "weakness":
        return "bg-primary/5 border-primary/20";
      case "strength":
        return "bg-accent/5 border-accent/20";
      case "speed":
        return "bg-secondary/5 border-secondary/20";
      default:
        return "bg-primary/5 border-primary/20";
    }
  };

  return (
    <Card data-testid="card-ai-recommendations">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Bot className="h-5 w-5 text-primary mr-2" />
          AI Recommendations
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recommendations.length > 0 ? (
            recommendations.slice(0, 3).map((recommendation) => (
              <div
                key={recommendation.id}
                className={`p-4 border rounded-lg ${getRecommendationColors(recommendation.type)}`}
                data-testid={`recommendation-${recommendation.id}`}
              >
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
                        className="p-0 h-auto mt-2 text-primary hover:underline"
                        data-testid={`button-action-${recommendation.id}`}
                      >
                        Start Practice →
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
                Complete some quizzes to get personalized AI insights.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

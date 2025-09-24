import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Play, BookOpen } from "lucide-react";

interface QuizAttempt {
  id: string;
  quizId: string;
  score: string;
  completedAt: string;
}

interface MockTestAttempt {
  id: string;
  mockTestId: string;
  totalScore: string;
  completedAt: string;
}

interface RecentActivityProps {
  quizAttempts: QuizAttempt[];
  mockTestAttempts: MockTestAttempt[];
}

export default function RecentActivity({ quizAttempts, mockTestAttempts }: RecentActivityProps) {
  // Combine and sort activities by date
  const activities = [
    ...quizAttempts.map(attempt => ({
      ...attempt,
      type: 'quiz',
      title: 'Completed Quiz',
      score: attempt.score,
      icon: CheckCircle,
      color: 'text-accent'
    })),
    ...mockTestAttempts.map(attempt => ({
      ...attempt,
      type: 'mock-test',
      title: 'Started Mock Test',
      score: attempt.totalScore,
      icon: Play,
      color: 'text-primary'
    }))
  ].sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()).slice(0, 5);

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} days ago`;
  };

  return (
    <Card data-testid="card-recent-activity">
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {activities.length > 0 ? (
            activities.map((activity, index) => {
              const IconComponent = activity.icon;
              return (
                <div
                  key={`${activity.type}-${activity.id}-${index}`}
                  className="flex items-center space-x-3 p-3 hover:bg-muted/50 rounded-lg transition-colors"
                  data-testid={`activity-${index}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-accent/10`}>
                    <IconComponent className={`text-xs ${activity.color}`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">
                      {activity.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Score: {parseFloat(activity.score).toFixed(0)}% • {formatTimeAgo(activity.completedAt)}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No recent activity</p>
              <p className="text-sm">Start studying to see your progress here!</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

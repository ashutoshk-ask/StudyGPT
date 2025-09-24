import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "lucide-react";

interface StudyTask {
  id: string;
  title: string;
  duration: string;
  subject: string;
  completed: boolean;
  priority?: "high" | "medium" | "low";
}

export default function StudyPlanToday() {
  const [tasks, setTasks] = useState<StudyTask[]>([
    {
      id: "1",
      title: "Complete Ratio & Proportion Quiz",
      duration: "30 minutes",
      subject: "Mathematics",
      completed: true
    },
    {
      id: "2", 
      title: "Practice Coding-Decoding",
      duration: "45 minutes",
      subject: "Reasoning",
      completed: false,
      priority: "high"
    },
    {
      id: "3",
      title: "Review Current Affairs",
      duration: "20 minutes", 
      subject: "General Studies",
      completed: false
    },
    {
      id: "4",
      title: "Mock Test Analysis",
      duration: "30 minutes",
      subject: "Review",
      completed: false
    }
  ]);

  const toggleTask = (taskId: string) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, completed: !task.completed } : task
    ));
  };

  return (
    <Card data-testid="card-study-plan-today">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Calendar className="h-5 w-5 mr-2" />
          Today's Study Plan
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {tasks.map((task) => (
            <div
              key={task.id}
              className={`flex items-center space-x-3 p-3 rounded-lg transition-all ${
                task.completed 
                  ? "bg-muted/30 opacity-60" 
                  : task.priority === "high"
                  ? "bg-primary/5 border border-primary/20"
                  : "bg-muted/30"
              }`}
              data-testid={`task-${task.id}`}
            >
              <Checkbox
                checked={task.completed}
                onCheckedChange={() => toggleTask(task.id)}
                className="flex-shrink-0"
                data-testid={`checkbox-task-${task.id}`}
              />
              <div className="flex-1">
                <p className={`text-sm font-medium ${
                  task.completed ? "line-through text-muted-foreground" : "text-foreground"
                }`}>
                  {task.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  {task.duration} • {task.subject}
                </p>
              </div>
              {task.priority === "high" && !task.completed && (
                <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center pulse-dot">
                  <span className="text-xs text-primary-foreground">!</span>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-border">
          <div className="text-xs text-muted-foreground text-center">
            {tasks.filter(t => t.completed).length} of {tasks.length} tasks completed
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

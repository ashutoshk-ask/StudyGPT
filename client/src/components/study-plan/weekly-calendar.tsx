import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, BookOpen, FileText, Users } from "lucide-react";

interface StudySession {
  timeSlot: string;
  subject: string;
  topic: string;
  duration: number;
  priority: "high" | "medium" | "low";
}

interface WeeklyCalendarProps {
  weeklySchedule: {
    [day: string]: StudySession[];
  };
  onSessionClick?: (session: StudySession, day: string) => void;
}

const weekDays = [
  "Monday",
  "Tuesday", 
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday"
];

export default function WeeklyCalendar({ weeklySchedule, onSessionClick }: WeeklyCalendarProps) {
  const getSessionColor = (subject: string) => {
    const colors = {
      "Mathematics": "bg-primary/10 text-primary border-primary/20",
      "Reasoning": "bg-secondary/10 text-secondary border-secondary/20",
      "English": "bg-accent/10 text-accent border-accent/20",
      "General Studies": "bg-chart-4/10 text-chart-4 border-chart-4/20",
      "Mock Test": "bg-destructive/10 text-destructive border-destructive/20",
      "Revision": "bg-chart-5/10 text-chart-5 border-chart-5/20",
      "Practice": "bg-primary/10 text-primary border-primary/20",
    };
    
    return colors[subject as keyof typeof colors] || "bg-muted/30 text-muted-foreground border-border";
  };

  const getSessionIcon = (subject: string) => {
    if (subject === "Mock Test") return <FileText className="h-3 w-3" />;
    if (subject === "Revision") return <BookOpen className="h-3 w-3" />;
    if (subject === "Practice") return <Users className="h-3 w-3" />;
    return <Clock className="h-3 w-3" />;
  };

  return (
    <Card data-testid="weekly-calendar">
      <CardHeader>
        <CardTitle className="flex items-center">
          <BookOpen className="h-5 w-5 mr-2" />
          Weekly Study Schedule
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
          {weekDays.map((day) => {
            const daySchedule = weeklySchedule[day] || [];
            const isToday = new Date().toLocaleDateString('en-US', { weekday: 'long' }) === day;
            
            return (
              <div
                key={day}
                className={`rounded-lg p-4 ${
                  isToday ? 'bg-primary/5 border-2 border-primary/20' : 'bg-muted/30'
                }`}
                data-testid={`day-${day.toLowerCase()}`}
              >
                <h4 className={`font-semibold text-center mb-3 ${
                  isToday ? 'text-primary' : 'text-foreground'
                }`}>
                  {day}
                  {isToday && (
                    <Badge variant="default" className="ml-2 text-xs">
                      Today
                    </Badge>
                  )}
                </h4>
                
                <div className="space-y-2">
                  {daySchedule.length > 0 ? (
                    daySchedule.map((session, index) => (
                      <div
                        key={index}
                        className={`border rounded-lg p-3 text-xs transition-all hover:shadow-sm cursor-pointer ${getSessionColor(session.subject)}`}
                        onClick={() => onSessionClick?.(session, day)}
                        data-testid={`session-${day}-${index}`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center space-x-1">
                            {getSessionIcon(session.subject)}
                            <span className="font-medium text-xs">{session.timeSlot}</span>
                          </div>
                          {session.priority === "high" && (
                            <div className="w-2 h-2 bg-destructive rounded-full"></div>
                          )}
                        </div>
                        
                        <div className="space-y-1">
                          <p className="font-semibold text-sm">{session.subject}</p>
                          <p className="text-xs opacity-90">{session.topic}</p>
                          <div className="flex items-center justify-between pt-1">
                            <span className="text-xs opacity-75">
                              {session.duration} min
                            </span>
                            {session.priority && (
                              <Badge 
                                variant="outline" 
                                className="text-xs px-1 py-0"
                              >
                                {session.priority}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="bg-muted/50 rounded-lg p-3 text-center">
                      <p className="text-xs font-medium text-muted-foreground">REST DAY</p>
                      <p className="text-xs text-muted-foreground mt-1">Light Review</p>
                      <p className="text-xs text-muted-foreground opacity-75">Optional</p>
                    </div>
                  )}
                </div>

                {/* Daily Summary */}
                {daySchedule.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-border/50">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Sessions: {daySchedule.length}</span>
                      <span>
                        {daySchedule.reduce((total, session) => total + session.duration, 0)}m
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Weekly Summary */}
        <div className="mt-6 p-4 bg-muted/30 rounded-lg">
          <h4 className="font-semibold text-foreground mb-3">Weekly Summary</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <p className="font-semibold text-primary">
                {Object.values(weeklySchedule).flat().length}
              </p>
              <p className="text-muted-foreground">Total Sessions</p>
            </div>
            <div className="text-center">
              <p className="font-semibold text-secondary">
                {Math.floor(Object.values(weeklySchedule).flat().reduce((total, session) => total + session.duration, 0) / 60)}h
              </p>
              <p className="text-muted-foreground">Study Hours</p>
            </div>
            <div className="text-center">
              <p className="font-semibold text-accent">
                {Object.values(weeklySchedule).flat().filter(s => s.priority === "high").length}
              </p>
              <p className="text-muted-foreground">High Priority</p>
            </div>
            <div className="text-center">
              <p className="font-semibold text-chart-4">
                {Object.values(weeklySchedule).flat().filter(s => s.subject === "Mock Test").length}
              </p>
              <p className="text-muted-foreground">Mock Tests</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

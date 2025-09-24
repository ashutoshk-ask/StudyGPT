import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calculator, Brain, Languages, Globe, BookOpen, Play } from "lucide-react";

const subjectIcons = {
  Mathematics: Calculator,
  Reasoning: Brain,
  English: Languages,
  "General Studies": Globe,
};

export default function Subjects() {
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

  const { data: subjects } = useQuery({
    queryKey: ["/api/subjects"],
  });

  const { data: userProgress } = useQuery({
    queryKey: ["/api/progress"],
  });

  const { data: topics } = useQuery({
    queryKey: ["/api/subjects", selectedSubject, "topics"],
    enabled: !!selectedSubject,
  });

  const subjectWithProgress = Array.isArray(subjects) ? subjects.map((subject: any) => {
    const progress = Array.isArray(userProgress) ? userProgress.find((p: any) => p.subjectId === subject.id) : null;
    const IconComponent = subjectIcons[subject.name as keyof typeof subjectIcons] || BookOpen;
    
    return {
      ...subject,
      progress: progress?.completionPercentage || 0,
      mastery: progress?.mastery || 0,
      timeSpent: progress?.timeSpent || 0,
      icon: IconComponent,
    };
  }) : [];

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <main className="flex-1 overflow-hidden">
        <Header title="Subjects" subtitle="Explore subject-wise content and track your learning progress." />
        
        <div className="p-4 lg:p-6 overflow-y-auto h-full">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Subjects List */}
            <div className="lg:col-span-1 space-y-4">
              <h3 className="text-lg font-semibold text-foreground">All Subjects</h3>
              {subjectWithProgress.map((subject: any) => {
                const IconComponent = subject.icon;
                return (
                  <Card 
                    key={subject.id} 
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedSubject === subject.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => setSelectedSubject(subject.id)}
                    data-testid={`card-subject-${subject.name}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                          <IconComponent className="h-5 w-5 text-primary-foreground" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-foreground">{subject.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {subject.totalTopics || 20} topics
                          </p>
                        </div>
                        <Badge variant="secondary">{subject.progress}%</Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-medium">{subject.progress}%</span>
                        </div>
                        <Progress value={parseFloat(subject.progress)} className="h-2" />
                        
                        <div className="flex justify-between text-xs text-muted-foreground pt-1">
                          <span>Mastery: {subject.mastery}%</span>
                          <span>Time: {subject.timeSpent}h</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Subject Details */}
            <div className="lg:col-span-2">
              {selectedSubject ? (
                <div className="space-y-6">
                  {/* Subject Overview */}
                  <Card data-testid="card-subject-details">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-3">
                        {(() => {
                          const subject = subjectWithProgress.find((s: any) => s.id === selectedSubject);
                          if (!subject) return null;
                          const IconComponent = subject.icon;
                          return (
                            <>
                              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                                <IconComponent className="h-5 w-5 text-primary-foreground" />
                              </div>
                              <span>{subject.name}</span>
                            </>
                          );
                        })()}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground mb-4">
                        {(() => {
                          const subject = subjectWithProgress.find((s: any) => s.id === selectedSubject);
                          return subject?.description || "Master the fundamental concepts and advanced topics.";
                        })()}
                      </p>
                      
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-primary">
                            {(() => {
                              const subject = subjectWithProgress.find((s: any) => s.id === selectedSubject);
                              return subject?.progress || 0;
                            })()}%
                          </p>
                          <p className="text-sm text-muted-foreground">Progress</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-secondary">
                            {(() => {
                              const subject = subjectWithProgress.find((s: any) => s.id === selectedSubject);
                              return subject?.timeSpent || 0;
                            })()}h
                          </p>
                          <p className="text-sm text-muted-foreground">Time Spent</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-accent">
                            {(() => {
                              const subject = subjectWithProgress.find((s: any) => s.id === selectedSubject);
                              return subject?.mastery || 0;
                            })()}%
                          </p>
                          <p className="text-sm text-muted-foreground">Mastery</p>
                        </div>
                      </div>

                      <div className="flex space-x-3">
                        <Button asChild data-testid="button-start-quiz">
                          <Link href={`/quiz?subject=${selectedSubject}`}>
                            <Play className="h-4 w-4 mr-2" />
                            Start Quiz
                          </Link>
                        </Button>
                        <Button variant="outline" asChild data-testid="button-view-lessons">
                          <Link href={`/lessons?subject=${selectedSubject}`}>
                            <BookOpen className="h-4 w-4 mr-2" />
                            View Lessons
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Topics List */}
                  <Card data-testid="card-topics-list">
                    <CardHeader>
                      <CardTitle>Topics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {Array.isArray(topics) && topics.length > 0 ? (
                          topics.map((topic: any) => (
                            <div 
                              key={topic.id} 
                              className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                              data-testid={`topic-${topic.name}`}
                            >
                              <div className="flex-1">
                                <h4 className="font-medium text-foreground">{topic.name}</h4>
                                <p className="text-sm text-muted-foreground">{topic.description}</p>
                                <div className="flex items-center space-x-2 mt-1">
                                  <Badge variant={topic.difficulty === 'beginner' ? 'default' : 
                                                 topic.difficulty === 'intermediate' ? 'secondary' : 'destructive'}>
                                    {topic.difficulty}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    ~{topic.estimatedTime || 60} min
                                  </span>
                                </div>
                              </div>
                              <div className="flex space-x-2">
                                <Button size="sm" variant="outline" asChild data-testid={`button-study-${topic.id}`}>
                                  <Link href={`/study?topic=${topic.id}`}>
                                    Study
                                  </Link>
                                </Button>
                                <Button size="sm" asChild data-testid={`button-quiz-${topic.id}`}>
                                  <Link href={`/quiz?topic=${topic.id}`}>
                                    Quiz
                                  </Link>
                                </Button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                            <p>No topics available for this subject yet.</p>
                            <p className="text-sm">Check back soon for new content!</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Card className="h-full flex items-center justify-center" data-testid="card-select-subject">
                  <CardContent className="text-center py-16">
                    <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">Select a Subject</h3>
                    <p className="text-muted-foreground">
                      Choose a subject from the left panel to view topics and start learning.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

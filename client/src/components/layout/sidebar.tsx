import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  GraduationCap, 
  Home, 
  BookOpen, 
  FileText, 
  BarChart3, 
  Calendar, 
  Bot,
  LogOut,
  Bell
} from "lucide-react";

export default function Sidebar() {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();

  const { data: userProgress } = useQuery({
    queryKey: ["/api/progress"],
  });

  const { data: recommendations } = useQuery({
    queryKey: ["/api/ai/recommendations"],
  });

  const overallProgress = user?.overallProgress || 0;
  const studyStreak = user?.studyStreak || 0;
  const unreadNotifications = Array.isArray(recommendations) ? recommendations.filter((r: any) => !r.isRead).length : 0;

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName && !lastName) return "U";
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
  };

  const navItems = [
    { path: "/", label: "Dashboard", icon: Home },
    { path: "/subjects", label: "Subjects", icon: BookOpen },
    { path: "/mock-tests", label: "Mock Tests", icon: FileText },
    { path: "/analytics", label: "Analytics", icon: BarChart3 },
    { path: "/study-plan", label: "Study Plan", icon: Calendar },
    { path: "/ai-tutor", label: "AI Tutor", icon: Bot },
  ];

  return (
    <aside className="w-64 bg-card shadow-lg border-r border-border hidden lg:block" data-testid="sidebar">
      <div className="p-6">
        {/* Logo */}
        <div className="flex items-center space-x-3 mb-8">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold text-foreground">SSC CGL Buddy</h1>
        </div>
        
        {/* User Profile Section */}
        <div className="bg-muted rounded-lg p-4 mb-6" data-testid="user-profile-section">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <span className="text-primary-foreground font-semibold text-sm">
                {getInitials(user?.firstName, user?.lastName)}
              </span>
            </div>
            <div>
              <p className="font-semibold text-sm" data-testid="text-user-name">
                {user?.firstName && user?.lastName 
                  ? `${user.firstName} ${user.lastName}`
                  : user?.username || "Student"
                }
              </p>
              <p className="text-xs text-muted-foreground">Level 7 Student</p>
            </div>
          </div>
          
          <div className="mt-3">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Overall Progress</span>
              <span data-testid="text-overall-progress">{overallProgress}%</span>
            </div>
            <Progress value={parseFloat(overallProgress.toString())} className="h-2" />
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="space-y-2" data-testid="navigation-menu">
          {navItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = location === item.path;
            
            return (
              <Link key={item.path} href={item.path}>
                <a
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted text-foreground"
                  }`}
                  data-testid={`nav-link-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <IconComponent className="h-5 w-5" />
                  <span>{item.label}</span>
                  {item.label === "AI Tutor" && unreadNotifications > 0 && (
                    <span className="bg-destructive text-destructive-foreground text-xs rounded-full px-2 py-0.5 ml-auto">
                      {unreadNotifications}
                    </span>
                  )}
                </a>
              </Link>
            );
          })}
        </nav>

        {/* Quick Stats */}
        <div className="mt-8 p-4 bg-accent/10 rounded-lg" data-testid="quick-stats">
          <h3 className="text-sm font-semibold text-accent mb-2">Today's Goal</h3>
          <div className="text-xs text-muted-foreground">
            <div className="flex justify-between mb-1">
              <span>Study Time</span>
              <span>2h 30m / 4h</span>
            </div>
            <div className="flex justify-between">
              <span>Questions</span>
              <span>45 / 60</span>
            </div>
          </div>
        </div>

        {/* Streak Counter */}
        <div className="mt-4 p-3 bg-primary/10 rounded-lg" data-testid="streak-counter">
          <div className="flex items-center justify-center space-x-2">
            <span className="text-lg">🔥</span>
            <span className="text-sm font-semibold text-primary">
              {studyStreak} Day Streak
            </span>
          </div>
        </div>

        {/* Logout Button */}
        <div className="mt-6">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
            data-testid="button-logout"
          >
            <LogOut className="h-4 w-4 mr-2" />
            {logoutMutation.isPending ? "Logging out..." : "Logout"}
          </Button>
        </div>
      </div>
    </aside>
  );
}

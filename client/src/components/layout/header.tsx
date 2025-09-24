import { Bell, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  const { data: recommendations } = useQuery({
    queryKey: ["/api/ai/recommendations"],
  });

  const unreadNotifications = recommendations?.filter((r: any) => !r.isRead).length || 0;

  // Sample motivational quotes - in a real app, this could be from an API
  const motivationalQuotes = [
    "Success is where preparation and opportunity meet.",
    "Hard work beats talent when talent doesn't work hard.",
    "The future belongs to those who prepare for it today.",
    "Every expert was once a beginner.",
    "Your limitation—it's only your imagination.",
  ];

  const randomQuote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];

  return (
    <header className="bg-card border-b border-border p-4 lg:p-6" data-testid="header">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground" data-testid="header-title">
            {title}
          </h2>
          {subtitle && (
            <p className="text-muted-foreground" data-testid="header-subtitle">
              {subtitle}
            </p>
          )}
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Motivational Quote */}
          <div className="hidden md:block bg-accent/10 rounded-lg p-3 max-w-md" data-testid="motivational-quote">
            <p className="text-sm text-accent font-medium">"{randomQuote}"</p>
          </div>
          
          {/* Streak Counter */}
          <div className="flex items-center space-x-2 bg-primary/10 rounded-lg p-2" data-testid="header-streak">
            <span className="text-lg">🔥</span>
            <span className="text-sm font-semibold text-primary">15 Day Streak</span>
          </div>
          
          {/* Notifications */}
          <Button
            variant="ghost"
            size="sm"
            className="relative"
            data-testid="button-notifications"
          >
            <Bell className="h-5 w-5" />
            {unreadNotifications > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                data-testid="notifications-badge"
              >
                {unreadNotifications}
              </Badge>
            )}
          </Button>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            data-testid="button-mobile-menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}

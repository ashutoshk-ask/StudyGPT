import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface ProgressCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  progress?: number;
  subtitle?: string;
  color?: "primary" | "secondary" | "accent" | "chart-4";
  "data-testid"?: string;
}

export default function ProgressCard({ 
  title, 
  value, 
  icon, 
  progress, 
  subtitle, 
  color = "primary",
  "data-testid": testId
}: ProgressCardProps) {
  const getColorClasses = (colorName: string) => {
    const colorMap = {
      primary: "bg-primary/10 text-primary",
      secondary: "bg-secondary/10 text-secondary", 
      accent: "bg-accent/10 text-accent",
      "chart-4": "bg-chart-4/10 text-chart-4",
    };
    return colorMap[colorName as keyof typeof colorMap] || colorMap.primary;
  };

  return (
    <Card className="card-hover" data-testid={testId}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground text-sm">{title}</p>
            <p className="text-2xl font-bold text-foreground" data-testid={`${testId}-value`}>
              {value}
            </p>
          </div>
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getColorClasses(color)}`}>
            {icon}
          </div>
        </div>
        
        {subtitle && (
          <p className="text-sm text-muted-foreground mt-2" data-testid={`${testId}-subtitle`}>
            {subtitle}
          </p>
        )}
        
        {typeof progress === "number" && (
          <div className="mt-4">
            <Progress value={progress} className="h-2" data-testid={`${testId}-progress`} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

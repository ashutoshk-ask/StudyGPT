import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import Dashboard from "@/pages/dashboard";
import Subjects from "@/pages/subjects";
import MockTests from "@/pages/mock-tests";
import Analytics from "@/pages/analytics";
import StudyPlan from "@/pages/study-plan";
import AiTutor from "@/pages/ai-tutor";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/subjects" component={Subjects} />
      <ProtectedRoute path="/mock-tests" component={MockTests} />
      <ProtectedRoute path="/analytics" component={Analytics} />
      <ProtectedRoute path="/study-plan" component={StudyPlan} />
      <ProtectedRoute path="/ai-tutor" component={AiTutor} />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

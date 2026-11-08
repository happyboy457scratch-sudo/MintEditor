
import { Router as WouterRouter, Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

// Pages
import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import EditorWorkspace from "@/pages/EditorWorkspace";
import Settings from "@/pages/Settings";

function AppRouter() {
  return (
    <WouterRouter base="/MintEditor">
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/projects" component={Dashboard} />
        <Route path="/editor/:id" component={EditorWorkspace} />
        <Route path="/settings" component={Settings} />
        <Route component={NotFound} />
      </Switch>
    </WouterRouter>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <AppRouter />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

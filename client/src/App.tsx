import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { BuilderProvider } from "./contexts/BuilderContext";
import Builder from "@/pages/builder";
import WorkflowEditor from "@/pages/workflow-editor";
import WorkflowTest from "@/pages/workflow-test";
import AgentPage from "@/pages/agent-page";
import AgentChainPage from "@/pages/agent-chain";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Builder} />
      <Route path="/workflow-editor/new" component={WorkflowEditor} />
      <Route path="/workflow-editor/:id" component={WorkflowEditor} />
      <Route path="/workflow-test/:id" component={WorkflowTest} />
      <Route path="/agent/:id" component={AgentPage} />
      <Route path="/agent-chain" component={AgentChainPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BuilderProvider>
        <Router />
        <Toaster />
      </BuilderProvider>
    </QueryClientProvider>
  );
}

export default App;

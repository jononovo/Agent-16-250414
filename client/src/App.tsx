import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { BuilderProvider } from "./contexts/BuilderContext";
import { ChatProvider } from "@/components/chat";
import Builder from "@/pages/builder";
import WorkflowEditor from "@/pages/workflow-editor";
import WorkflowTestBench from "@/pages/workflow-test";
import WorkflowGenerator from "@/pages/workflow-generator";
import WorkflowChatGenerator from "@/pages/workflow-chat-generator";
import AgentPage from "@/pages/agent-page";
import ApiRegistry from "@/pages/api-registry";
import Library from "@/pages/library";
import NotFound from "@/pages/not-found";
import NodeSystemDemo from "@/pages/node-system-demo";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Builder} />
      <Route path="/workflow-editor/new" component={WorkflowEditor} />
      <Route path="/workflow-editor/:id" component={WorkflowEditor} />
      <Route path="/workflow-test" component={WorkflowTestBench} />
      <Route path="/workflow-test/:id" component={WorkflowTestBench} />
      <Route path="/workflow-generator" component={WorkflowGenerator} />
      <Route path="/workflow-chat-generator" component={WorkflowChatGenerator} />
      <Route path="/agent/:id" component={AgentPage} />
      <Route path="/api-registry" component={ApiRegistry} />
      <Route path="/library" component={Library} />
      <Route path="/workflows" component={Library} />
      <Route path="/agents" component={Library} />
      <Route path="/nodes" component={Library} />
      <Route path="/node-system-demo" component={NodeSystemDemo} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BuilderProvider>
        <ChatProvider>
          <Router />
          <Toaster />
        </ChatProvider>
      </BuilderProvider>
    </QueryClientProvider>
  );
}

export default App;

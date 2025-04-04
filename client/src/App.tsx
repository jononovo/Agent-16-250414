import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { BuilderProvider } from "./contexts/BuilderContext";
import Builder from "@/pages/builder";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Builder} />
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

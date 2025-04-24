import { useState, useEffect, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { ArrowLeft, ChevronRight, ChevronLeft, MinusCircle } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { v4 as uuidv4 } from "uuid";
import { ReactFlowProvider } from "reactflow";
import { Workflow } from '@shared/schema';

import { Button } from "@/components/ui/button";
import { queryClient } from "@/lib/queryClient";
import { Chat, type ChatMessage } from "@/components/ui/chat";
import FlowEditor from "@/components/flow/FlowEditor";

interface WorkflowResponse {
  workflow: {
    id: number;
    name: string;
    description: string;
    type: string;
    flowData: any;
  };
}

export default function WorkflowChatGenerator() {
  const [, navigate] = useLocation();
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome-message",
      role: "assistant",
      content: "Describe the workflow you want to create, and I'll help you build it.",
      createdAt: new Date()
    }
  ]);
  const [currentWorkflowId, setCurrentWorkflowId] = useState<number | null>(null);
  const [chatMinimized, setChatMinimized] = useState(false);
  
  // Fetch workflow when ID changes
  const { 
    data: workflow,
    isLoading 
  } = useQuery({
    queryKey: ['/api/workflows', currentWorkflowId],
    queryFn: async () => {
      if (!currentWorkflowId) return undefined;
      
      const res = await fetch(`/api/workflows/${currentWorkflowId}`);
      if (!res.ok) throw new Error('Failed to fetch workflow');
      return res.json() as Promise<Workflow>;
    },
    enabled: !!currentWorkflowId
  });

  // Generate workflow mutation
  const generateWorkflow = useMutation({
    mutationFn: async (prompt: string) => {
      const response = await fetch('/api/workflows/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate workflow');
      }
      
      return response.json() as Promise<WorkflowResponse>;
    },
    onSuccess: (data) => {
      // Update workflow ID when generation is successful
      setCurrentWorkflowId(data.workflow.id);
      
      // Add AI response to messages
      const responseContent = `I've generated a workflow called "${data.workflow.name}" based on your description. You can see it in the editor and make any adjustments as needed.`;
      
      setMessages(prev => [
        ...prev,
        {
          id: uuidv4(),
          role: 'assistant',
          content: responseContent,
          createdAt: new Date()
        }
      ]);
    }
  });

  const handleSubmit = useCallback((input: string) => {
    // Add user message
    const userMessage: ChatMessage = {
      id: uuidv4(),
      role: 'user',
      content: input,
      createdAt: new Date()
    };
    
    // Clear input and add message
    setChatInput('');
    setMessages(prev => [...prev, userMessage]);
    
    // Generate the workflow
    generateWorkflow.mutate(input);
  }, [generateWorkflow]);

  // Toggle chat panel visibility
  const toggleChatPanel = () => {
    setChatMinimized(!chatMinimized);
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-900">
      <header className="border-b bg-white dark:bg-slate-950">
        <div className="container flex h-14 items-center">
          <Link href="/">
            <Button variant="ghost" size="icon" className="mr-2">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back</span>
            </Button>
          </Link>
          <h1 className="text-xl font-semibold">AI Workflow Generator</h1>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden relative">
        {/* Main Content Area - Contains the FlowEditor */}
        <div className="flex-1 overflow-hidden">
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <div className="animate-pulse text-lg">Loading workflow...</div>
            </div>
          ) : (
            <FlowEditor workflow={workflow} isNew={!currentWorkflowId} />
          )}
        </div>

        {/* Chat Panel Toggle Button */}
        <button 
          onClick={toggleChatPanel}
          className="absolute top-4 right-4 z-20 p-2 bg-primary text-white rounded-full shadow-md hover:bg-primary/90 transition-all"
          aria-label={chatMinimized ? "Expand chat" : "Minimize chat"}
        >
          {chatMinimized ? <ChevronLeft className="h-4 w-4" /> : <MinusCircle className="h-4 w-4" />}
        </button>

        {/* Chat Panel - Fixed on the right side with toggle functionality */}
        <div className={`absolute top-4 ${chatMinimized ? 'right-[-340px]' : 'right-4'} bottom-4 w-[350px] z-10 transition-all duration-300 ease-in-out`}>
          <Chat
            messages={messages}
            input={chatInput}
            onInputChange={setChatInput}
            onSubmit={handleSubmit}
            isLoading={generateWorkflow.isPending}
          />
        </div>
      </main>
    </div>
  );
}
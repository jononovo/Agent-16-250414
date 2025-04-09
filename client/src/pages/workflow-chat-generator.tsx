import { useState, useEffect, useCallback } from "react";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { v4 as uuidv4 } from "uuid";
import { ReactFlowProvider } from "reactflow";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { queryClient } from "@/lib/queryClient";
import { Chat, type ChatMessage } from "@/components/ui/chat";
import WorkflowEditorPanel from "../components/workflows/WorkflowEditorPanel";

// Preload an initial workflow editor content
import { getEmptyWorkflow } from "../lib/emptyWorkflow";

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
  const [flowData, setFlowData] = useState(getEmptyWorkflow());

  // Load workflow data when ID changes
  useEffect(() => {
    if (currentWorkflowId) {
      queryClient.fetchQuery({
        queryKey: ['/api/workflows', currentWorkflowId],
        queryFn: async () => {
          const response = await fetch(`/api/workflows/${currentWorkflowId}`);
          return response.json();
        }
      }).then(data => {
        if (data && data.flowData) {
          setFlowData(data.flowData);
        }
      });
    }
  }, [currentWorkflowId]);

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

      <main className="flex-1 flex overflow-hidden">
        {/* Workflow Editor Panel - Takes the majority of the screen */}
        <div className="flex-1 overflow-auto relative">
          <ReactFlowProvider>
            <WorkflowEditorPanel 
              flowData={flowData} 
              readOnly={generateWorkflow.isPending}
            />
          </ReactFlowProvider>
        </div>

        {/* Chat Interface Overlay - Fixed on the right side */}
        <div className="absolute top-20 right-6 bottom-6 w-full max-w-md z-10">
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
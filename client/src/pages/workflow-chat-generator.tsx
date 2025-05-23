import { useState, useEffect, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { ArrowLeft, ChevronRight, ChevronLeft, MinusCircle, Wand2 } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { v4 as uuidv4 } from "uuid";
import { ReactFlowProvider } from "reactflow";
import { Workflow } from '@shared/schema';

import { Button } from "@/components/ui/button";
import { queryClient } from "@/lib/queryClient";
import { Chat, type ChatMessage } from "@/components/ui/chat";

// Import the actual FlowEditor to use as our base component
import FlowEditor from "@/components/flow/FlowEditor";

// Create a wrapper component that uses the imported FlowEditor
// but we'll add our own custom chat interface
const CustomFlowEditor = ({ 
  workflow, 
  isNew 
}: { 
  workflow: Workflow | undefined; 
  isNew: boolean 
}) => {
  return (
    <div className="h-full">
      <FlowEditor workflow={workflow} isNew={isNew} />
    </div>
  );
};

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
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 dark:bg-slate-900">
      {/* Main Content Area - Direct integration of Flow Editor with no header */}
      <div className="flex-1 relative">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className="animate-pulse text-lg">Loading workflow...</div>
          </div>
        ) : (
          <CustomFlowEditor workflow={workflow} isNew={!currentWorkflowId} />
        )}
        
        {/* Add a back button directly on the canvas for better UX */}
        <Link href="/">
          <Button 
            variant="outline" 
            size="sm" 
            className="absolute top-4 left-4 z-20 bg-white/80 backdrop-blur-sm shadow-sm"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Builder
          </Button>
        </Link>
        
        {/* Improved Chat Panel Toggle - Uses a more distinct icon and position */}
        <button 
          onClick={toggleChatPanel}
          className="absolute top-4 right-4 z-50 p-2 bg-primary text-white rounded-full shadow-md hover:bg-primary/90 transition-all"
          aria-label={chatMinimized ? "Expand AI Chat" : "Minimize AI Chat"}
          title={chatMinimized ? "Expand AI Chat" : "Minimize AI Chat"}
        >
          {chatMinimized ? (
            <Wand2 className="h-5 w-5" />
          ) : (
            <MinusCircle className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Chat Panel - Fixed on the right side with toggle functionality */}
      <div 
        className={`fixed top-16 ${chatMinimized ? 'right-[-370px]' : 'right-4'} bottom-4 w-[360px] z-40 
          transition-all duration-300 ease-in-out bg-white dark:bg-slate-950 rounded-lg shadow-lg border`}
      >
        <div className="h-full flex flex-col overflow-hidden">
          <div className="p-3 border-b flex items-center">
            <Wand2 className="h-4 w-4 mr-2 text-primary" />
            <h3 className="font-medium text-sm">AI Workflow Generator</h3>
          </div>
          <div className="flex-1 overflow-hidden">
            <Chat
              messages={messages}
              input={chatInput}
              onInputChange={setChatInput}
              onSubmit={handleSubmit}
              isLoading={generateWorkflow.isPending}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
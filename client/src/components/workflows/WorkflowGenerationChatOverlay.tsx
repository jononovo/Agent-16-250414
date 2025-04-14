import { useState, useEffect, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { useMutation } from "@tanstack/react-query";
import { ChevronLeft, MinusCircle } from "lucide-react";
import { Workflow } from '@shared/schema';
import { Chat, type ChatMessage } from "@/components/ui/chat";
import { useLocation } from "wouter";

interface WorkflowResponse {
  workflow: {
    id: number;
    name: string;
    description: string;
    type: string;
    flowData: any;
  };
}

interface MonkeyAgentChatOverlayProps {
  onWorkflowGenerated?: (workflowId: number) => void;
  workflow?: Workflow;
  isNew?: boolean;
}

export function MonkeyAgentChatOverlay({ 
  onWorkflowGenerated, 
  workflow, 
  isNew = false 
}: MonkeyAgentChatOverlayProps) {
  const [, params] = useLocation();
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome-message",
      role: "assistant",
      content: "Describe the workflow you want to create, and I'll help you build it.",
      createdAt: new Date()
    }
  ]);
  const [chatMinimized, setChatMinimized] = useState(false);
  
  // Add workflow context information when the component mounts or when the workflow changes
  useEffect(() => {
    // Clear any previous workflow context messages
    setMessages(prevMessages => 
      prevMessages.filter(msg => msg.id !== "workflow-context")
    );
    
    // Add a new message with the current workflow context
    if (isNew) {
      setMessages(prevMessages => [
        ...prevMessages,
        {
          id: "workflow-context",
          role: "assistant",
          content: "Please save this workflow before making requests.",
          createdAt: new Date()
        }
      ]);
    } else if (workflow?.id) {
      setMessages(prevMessages => [
        ...prevMessages,
        {
          id: "workflow-context",
          role: "assistant",
          content: `We are chatting about workflow ID: ${workflow.id}`,
          createdAt: new Date()
        }
      ]);
    }
  }, [workflow?.id, isNew]);
  
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
      // Notify parent about the new workflow
      if (onWorkflowGenerated) {
        onWorkflowGenerated(data.workflow.id);
      }
      
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
    <>
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
    </>
  );
}

export default MonkeyAgentChatOverlay;
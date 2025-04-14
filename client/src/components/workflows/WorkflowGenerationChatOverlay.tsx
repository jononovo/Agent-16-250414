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
  
  // We no longer display workflow context messages in the chat
  // The component internally knows which workflow it's working with
  
  // Mutation for workflow operations
  const workflowMutation = useMutation({
    mutationFn: async ({ prompt, action }: { prompt: string, action: 'generate' | 'update' }) => {
      if (action === 'generate') {
        // Create a new workflow if we're not on a specific workflow page
        // or if explicitly directed to generate a new one
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
        
        return { 
          data: await response.json() as WorkflowResponse,
          action: 'generate'
        };
      } else if (action === 'update' && workflow?.id) {
        // Update the current workflow with the changes requested via the prompt
        // This call will go to a different endpoint that updates an existing workflow
        const response = await fetch(`/api/workflows/update/${workflow.id}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            prompt,
            currentWorkflowId: workflow.id,
            currentWorkflowName: workflow.name
          }),
        });
        
        if (!response.ok) {
          // If updating fails, fall back to generating a new workflow
          console.warn('Failed to update existing workflow, falling back to generate');
          const fallbackResponse = await fetch('/api/workflows/generate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prompt }),
          });
          
          if (!fallbackResponse.ok) {
            throw new Error('Failed to generate workflow');
          }
          
          return { 
            data: await fallbackResponse.json() as WorkflowResponse,
            action: 'generate'
          };
        }
        
        return { 
          data: await response.json() as WorkflowResponse,
          action: 'update'
        };
      } else {
        throw new Error('Invalid action or missing workflow ID');
      }
    },
    onSuccess: (result) => {
      const { data, action } = result;
      
      // Notify parent about the workflow
      if (onWorkflowGenerated) {
        onWorkflowGenerated(data.workflow.id);
      }
      
      // Add different AI responses based on the action taken
      let responseContent = '';
      
      if (action === 'generate') {
        responseContent = `I've generated a new workflow called "${data.workflow.name}" based on your description. You can see it in the editor and make any adjustments as needed.`;
      } else {
        responseContent = `I've updated the current workflow "${data.workflow.name}" with your requested changes. The changes are now visible in the editor.`;
      }
      
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
    
    // Determine whether to update existing workflow or generate a new one
    const action = (!isNew && workflow?.id) ? 'update' : 'generate';
    
    // Call the appropriate API
    workflowMutation.mutate({ 
      prompt: input, 
      action 
    });
  }, [workflowMutation, workflow, isNew]);

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
          isLoading={workflowMutation.isPending}
        />
      </div>
    </>
  );
}

export default MonkeyAgentChatOverlay;
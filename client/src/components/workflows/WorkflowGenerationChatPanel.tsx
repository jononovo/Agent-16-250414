'use client';

import { useState, useEffect } from 'react';
import { ChatContainer, Message } from '@/components/chat';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';

export interface WorkflowGenerationChatPanelProps {
  onWorkflowGenerated?: (workflowId: number) => void;
}

export function WorkflowGenerationChatPanel({ onWorkflowGenerated }: WorkflowGenerationChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'system',
      content: 'Welcome to the Workflow Generator! Describe the workflow you want to create, and I\'ll help you build it.',
      timestamp: new Date()
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [_, navigate] = useLocation();

  // Add a message to the chat
  const addMessage = (content: string, role: 'user' | 'system' | 'agent') => {
    const newMessage: Message = {
      id: Date.now().toString(),
      role,
      content,
      timestamp: new Date()
    };
    
    setMessages((prevMessages) => [...prevMessages, newMessage]);
  };

  // Handle message from user
  const handleSendMessage = async (content: string) => {
    // Add user message to chat
    addMessage(content, 'user');
    setIsLoading(true);
    
    try {
      // Call the generate workflow API
      const response = await fetch('/api/workflows/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: content,
          options: {
            complexity: 'moderate',
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate workflow');
      }

      const data = await response.json();
      
      // Add success message to chat
      addMessage(`I've created a workflow called "${data.workflow.name}" based on your description. You can now view and edit it.`, 'agent');
      
      // Call the callback if provided
      if (onWorkflowGenerated && data.workflow && data.workflow.id) {
        onWorkflowGenerated(data.workflow.id);
      }
      
      // Success toast
      toast({
        title: 'Workflow Generated!',
        description: `Successfully created: ${data.workflow.name}`,
      });
      
    } catch (error) {
      console.error('Workflow generation error:', error);
      
      // Add error message to chat
      addMessage(`Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'system');
      
      toast({
        title: 'Generation Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="h-full flex flex-col overflow-hidden">
      <CardHeader className="px-4 py-2 border-b">
        <CardTitle className="text-lg">Workflow Generator</CardTitle>
      </CardHeader>
      <div className="flex-1 overflow-hidden">
        <ChatContainer
          title="Describe Your Workflow"
          messages={messages}
          onSendMessage={handleSendMessage}
          placeholder="Describe the workflow you want to create..."
          isLoading={isLoading}
          className="h-full border-0 shadow-none"
        />
      </div>
    </Card>
  );
}
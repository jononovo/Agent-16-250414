'use client';

import MainContent from '@/components/layout/MainContent';
import { WorkflowGenerator } from '@/components/workflows/WorkflowGenerator';
import { Separator } from '@/components/ui/separator';
import { useState, useEffect } from 'react';
import { ChatContainer, Message } from '@/components/chat';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';

export default function WorkflowGeneratorPage() {
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
  const [workflowId, setWorkflowId] = useState<number | null>(null);

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
      
      // Store the workflow ID
      setWorkflowId(data.workflow.id);
      
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

  // Navigate to editor when workflow is created
  useEffect(() => {
    if (workflowId) {
      navigate(`/workflow-editor?id=${workflowId}`);
    }
  }, [workflowId, navigate]);

  return (
    <MainContent>
      <div className="container py-6 space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Create Workflow from Description</h1>
          <p className="text-muted-foreground max-w-3xl">
            Describe your AI workflow in natural language, and our system will generate a ready-to-use workflow for you.
            You can then customize and refine it to exactly match your needs.
          </p>
        </div>
        
        <Separator />
        
        <div className="flex flex-col md:flex-row gap-4">
          {/* Chat interface on the right */}
          <div className="w-full md:w-1/2 h-[500px]">
            <ChatContainer
              title="Workflow Generator"
              messages={messages}
              onSendMessage={handleSendMessage}
              placeholder="Describe the workflow you want to create..."
              isLoading={isLoading}
              className="h-full"
            />
          </div>
          
          {/* Form interface on the left */}
          <div className="w-full md:w-1/2">
            <WorkflowGenerator />
          </div>
        </div>
        
        <div className="mt-8 space-y-4 max-w-3xl mx-auto">
          <h2 className="text-xl font-semibold">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <h3 className="font-medium">1. Describe Your Workflow</h3>
              <p className="text-sm text-muted-foreground">
                Write a clear description of what you want your workflow to accomplish.
                The more details you provide, the better the results.
              </p>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-medium">2. Generate</h3>
              <p className="text-sm text-muted-foreground">
                Our AI will create a workflow structure with the appropriate nodes and connections
                to accomplish your described task.
              </p>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-medium">3. Customize</h3>
              <p className="text-sm text-muted-foreground">
                You'll be taken to the workflow editor where you can adjust, enhance, or
                modify the generated workflow to suit your exact needs.
              </p>
            </div>
          </div>
        </div>
      </div>
    </MainContent>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRoute, useLocation } from 'wouter';
import { Workflow } from '@shared/schema';
import FlowEditor from '@/components/flow/FlowEditor';
import { Skeleton } from '@/components/ui/skeleton';
import { WorkflowGenerationChatPanel } from '@/components/workflows/WorkflowGenerationChatPanel';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import MainContent from '@/components/layout/MainContent';

const WorkflowChatGeneratorPage = () => {
  const [workflowId, setWorkflowId] = useState<number | null>(null);
  const [_, navigate] = useLocation();
  
  const { 
    data: workflow, 
    isLoading,
    refetch
  } = useQuery({
    queryKey: ['/api/workflows', workflowId],
    queryFn: async () => {
      if (!workflowId) return undefined;
      
      const res = await fetch(`/api/workflows/${workflowId}`);
      if (!res.ok) throw new Error('Failed to fetch workflow');
      return res.json() as Promise<Workflow>;
    },
    enabled: !!workflowId
  });

  // Handler for when a workflow is generated from the chat
  const handleWorkflowGenerated = (id: number) => {
    console.log("Workflow generated with ID:", id);
    setWorkflowId(id);
    refetch();
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="space-y-4 w-1/2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-[600px] w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="border-b bg-background flex justify-between items-center p-4">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/')}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Builder
        </Button>
        <h1 className="text-2xl font-semibold">AI Workflow Generator</h1>
        <div className="w-[100px]"></div> {/* Spacer for centering */}
      </div>
      
      <div className="flex flex-1 overflow-hidden">
        {/* Left side - Chat panel */}
        <div className="w-1/3 border-r overflow-hidden">
          <div className="h-full overflow-hidden">
            <WorkflowGenerationChatPanel onWorkflowGenerated={handleWorkflowGenerated} />
          </div>
        </div>
        
        {/* Right side - Flow editor */}
        <div className="w-2/3 overflow-hidden">
          {workflow ? (
            <div className="h-full">
              <FlowEditor workflow={workflow} isNew={false} />
            </div>
          ) : (
            <div className="h-full flex items-center justify-center bg-gray-50">
              <div className="text-center max-w-md p-6">
                <h2 className="text-xl font-semibold mb-4">Describe Your Workflow</h2>
                <p className="text-muted-foreground mb-6">
                  Use the chat panel on the left to describe what you want your workflow to do.
                  I'll generate a complete workflow that you can see and edit right here.
                </p>
                <p className="text-sm text-muted-foreground">
                  For example: "Create a workflow that fetches weather data based on user location,
                  analyzes the forecast, and sends an alert if rain is expected."
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkflowChatGeneratorPage;
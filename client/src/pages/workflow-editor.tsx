import { useEffect, useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRoute, useLocation } from 'wouter';
import { Workflow } from '@shared/schema';
import FlowEditor from '@/components/flow/FlowEditor';
import { Skeleton } from '@/components/ui/skeleton';

const WorkflowEditorPage = () => {
  const [match, params] = useRoute('/workflow-editor/:id');
  const [location] = useLocation();
  const [isNew, setIsNew] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);
  const queryClient = useQueryClient();
  
  // Check if the AI chat should be shown by detecting the 'ai' parameter in the URL
  useEffect(() => {
    const url = new URL(window.location.href);
    const showAI = url.searchParams.get('ai');
    setShowAIChat(showAI === 'true' || showAI === '');
  }, [location]);
  
  useEffect(() => {
    if (params?.id === 'new') {
      setIsNew(true);
    }
  }, [params]);

  // Function to refresh workflow data after an update
  const refreshWorkflow = useCallback(() => {
    if (params?.id && params.id !== 'new') {
      console.log('Refreshing workflow data for ID:', params.id);
      queryClient.invalidateQueries({ queryKey: ['/api/workflows', params.id] });
    }
  }, [queryClient, params?.id]);

  const { 
    data: workflow, 
    isLoading,
    refetch
  } = useQuery({
    queryKey: ['/api/workflows', params?.id],
    queryFn: async () => {
      if (isNew) return undefined;
      
      console.log('Fetching workflow data for ID:', params?.id);
      const res = await fetch(`/api/workflows/${params?.id}`);
      if (!res.ok) throw new Error('Failed to fetch workflow');
      const workflowData = await res.json() as Workflow;
      console.log('Fetched workflow data:', workflowData);
      return workflowData;
    },
    enabled: !!params?.id && !isNew,
    // Don't cache the workflow data for too long since it might change
    staleTime: 10000 // 10 seconds
  });

  // Handler for when a workflow is updated via the chat overlay
  const handleWorkflowUpdated = useCallback((workflowId: number) => {
    console.log('Workflow updated via chat overlay, refreshing data...');
    refreshWorkflow();
    // Force refetch immediately to get the latest changes
    refetch();
  }, [refreshWorkflow, refetch]);

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
    <>
      <FlowEditor 
        workflow={workflow} 
        isNew={isNew} 
        onWorkflowUpdate={handleWorkflowUpdated}
        showAIChat={showAIChat} // Pass the parameter to show/hide AI chat
      />
    </>
  );
};

export default WorkflowEditorPage;
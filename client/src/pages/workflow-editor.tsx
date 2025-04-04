import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRoute } from 'wouter';
import { Workflow } from '@shared/schema';
import FlowEditor from '@/components/flow/FlowEditor';
import { Skeleton } from '@/components/ui/skeleton';

const WorkflowEditorPage = () => {
  const [match, params] = useRoute('/workflow-editor/:id');
  const [isNew, setIsNew] = useState(false);
  
  useEffect(() => {
    if (params?.id === 'new') {
      setIsNew(true);
    }
  }, [params]);

  const { 
    data: workflow, 
    isLoading 
  } = useQuery({
    queryKey: ['/api/workflows', params?.id],
    queryFn: async () => {
      if (isNew) return undefined;
      
      const res = await fetch(`/api/workflows/${params?.id}`);
      if (!res.ok) throw new Error('Failed to fetch workflow');
      return res.json() as Promise<Workflow>;
    },
    enabled: !!params?.id && !isNew
  });

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

  return <FlowEditor workflow={workflow} isNew={isNew} />;
};

export default WorkflowEditorPage;
import { ReactNode, useState, useEffect } from 'react';
import { useBuilderContext } from '@/contexts/BuilderContext';

import { UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/apiClient';
import { executeWorkflow } from '@/lib/workflowClient';
import NewAgentModal from '@/components/NewAgentModal';

interface MainContentProps {
  children: ReactNode;
}

const MainContent = ({ children }: MainContentProps) => {
  const { activeTab } = useBuilderContext();
  const [isNewAgentModalOpen, setIsNewAgentModalOpen] = useState(false);
  const { toast } = useToast();
  
  const getPageTitle = () => {
    switch (activeTab) {
      case 'agents':
        return 'Build a New Agent';
      case 'workflows':
        return 'Build a New Workflow';
      case 'nodes':
        return 'Build a New Node';
      default:
        return 'Build a New Component';
    }
  };
  
  // Function to trigger the internal workflow for creating a new agent
  const triggerNewAgentWorkflow = async () => {
    try {
      // Execute workflow directly using client-side workflow engine
      const result = await executeWorkflow(16, {
        request_type: 'new_agent',
        source: 'ui_button'
      }, {
        metadata: {
          source: 'ui_trigger',
          triggerType: 'internal_new_agent'
        },
        onNodeStateChange: (nodeId, state) => {
          console.log(`Node ${nodeId} state changed to ${state.status}`);
        },
        onWorkflowComplete: (state) => {
          console.log('Workflow completed with status:', state.status);
        }
      });
      
      // Handle the response
      toast({
        title: "Agent Creation Started",
        description: "The new agent creation process has been initiated.",
      });
      
      console.log('Workflow executed:', result);
    } catch (error) {
      console.error('Error executing workflow:', error);
      toast({
        title: "Error",
        description: "Failed to trigger agent creation workflow. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="flex-grow overflow-y-auto">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">{getPageTitle()}</h1>
          <div className="flex items-center space-x-3">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-1"
              onClick={() => setIsNewAgentModalOpen(true)}
            >
              <UserPlus size={16} />
              <span>New Agent</span>
            </Button>
            
            {/* New Agent Modal */}
            <NewAgentModal 
              isOpen={isNewAgentModalOpen}
              onClose={() => setIsNewAgentModalOpen(false)}
              onAgentCreated={(agent) => {
                console.log('New agent created:', agent);
                // We could add a refresh of the agents list here if needed
              }}
            />

            
            {/* Settings and Deploy buttons removed */}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
};

export default MainContent;

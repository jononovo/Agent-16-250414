import { useState, useEffect } from 'react';
import { Agent, Workflow } from '@shared/schema';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface WorkflowCardProps {
  workflow: Workflow;
  isPlaceholder?: boolean;
  onClick?: () => void;
}

const WorkflowCard = ({ workflow, isPlaceholder = false, onClick }: WorkflowCardProps) => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Fetch agents when the dialog is opened
  useEffect(() => {
    if (dialogOpen) {
      fetchAgents();
    }
  }, [dialogOpen]);

  // Function to fetch available agents
  const fetchAgents = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/agents');
      if (!response.ok) {
        throw new Error('Failed to fetch agents');
      }
      const agentData = await response.json();
      setAgents(agentData);
    } catch (error) {
      console.error('Error fetching agents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to assign a workflow to the selected agent
  const assignWorkflow = async () => {
    if (!selectedAgentId) return;
    
    try {
      setIsLoading(true);
      // Update the workflow with the new agentId
      const response = await fetch(`/api/workflows/${workflow.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agentId: selectedAgentId
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to assign workflow');
      }
      
      // Close the dialog after successful assignment
      setDialogOpen(false);
      setSelectedAgentId(null);
      
      // Find the agent name for better feedback
      const selectedAgent = agents.find(agent => agent.id === selectedAgentId);
      const agentName = selectedAgent ? selectedAgent.name : 'selected agent';
      
      // Provide feedback to the user
      alert(`Workflow "${workflow.name}" successfully assigned to ${agentName}`);
    } catch (error) {
      console.error('Error assigning workflow:', error);
    } finally {
      setIsLoading(false);
    }
  };
  if (isPlaceholder) {
    return (
      <div 
        onClick={onClick}
        className="bg-slate-50 rounded-lg border border-dashed border-slate-300 hover:border-primary hover:bg-slate-100 transition-all overflow-hidden flex flex-col items-center justify-center p-6 h-[194px] cursor-pointer"
      >
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
          <i className="fas fa-plus"></i>
        </div>
        <p className="text-sm text-slate-600 text-center mb-2">Create a new workflow from scratch</p>
        <button className="text-xs text-primary hover:text-indigo-700">Get Started</button>
      </div>
    );
  }

  // Determine the background color based on workflow type
  const getBgColor = () => {
    if (workflow.name.includes('Data')) return 'bg-cyan-100 text-cyan-600';
    if (workflow.name.includes('Content')) return 'bg-orange-100 text-orange-600';
    if (workflow.name.includes('Lead')) return 'bg-blue-100 text-blue-600';
    if (workflow.name.includes('Alert')) return 'bg-pink-100 text-pink-600';
    if (workflow.name.includes('Translation')) return 'bg-amber-100 text-amber-600';
    return 'bg-slate-100 text-slate-600';
  };

  // Format the date for display
  const formatDate = (date: Date | null | undefined) => {
    if (!date) return '';
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return new Date(date).toLocaleDateString();
  };

  // Get appropriate status icon
  const getStatusIcon = () => {
    switch (workflow.status) {
      case 'active':
        return <i className="fas fa-check-circle mr-1 text-success"></i>;
      case 'draft':
        return <i className="fas fa-edit mr-1 text-slate-400"></i>;
      default:
        return <i className="fas fa-circle mr-1 text-slate-400"></i>;
    }
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden">
      <div className="p-4">
        <div className="flex items-center mb-3">
          <div className={`w-8 h-8 rounded-full ${getBgColor()} flex items-center justify-center`}>
            <i className={`fas fa-${workflow.icon || 'sitemap'}`}></i>
          </div>
          <h3 className="ml-2 font-medium">{workflow.name}</h3>
        </div>
        <p className="text-sm text-slate-600 mb-3">
          {workflow.description}
        </p>
        <div className="flex items-center text-xs text-slate-500">
          {workflow.type === 'template' ? (
            <>
              <span className="flex items-center">
                <i className="fas fa-user mr-1"></i> {workflow.userId === 0 ? 'Official' : 'Community'}
              </span>
              <span className="mx-2">•</span>
              <span className="flex items-center">
                <i className="fas fa-download mr-1"></i> {Math.floor(Math.random() * 900) + 100} uses
              </span>
            </>
          ) : (
            <>
              <span className="flex items-center">
                <i className="fas fa-calendar-alt mr-1"></i> Updated {formatDate(workflow.updatedAt)}
              </span>
              <span className="mx-2">•</span>
              <span className="flex items-center">
                {getStatusIcon()} {workflow.status === 'active' ? 'Active' : 'Draft'}
              </span>
            </>
          )}
        </div>
      </div>
      <div className="bg-slate-50 px-4 py-3 flex justify-between border-t border-slate-200">
        <button className="text-xs text-slate-600 hover:text-primary">View Details</button>
        <div className="flex space-x-3">
          {workflow.type === 'template' ? (
            <button className="text-xs text-primary hover:text-indigo-700">Use Template</button>
          ) : (
            <>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <button 
                    onClick={() => setDialogOpen(true)}
                    className="text-xs text-primary hover:text-indigo-700"
                  >
                    Assign
                  </button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Assign Workflow to Agent</DialogTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Select an agent to assign this workflow
                    </p>
                  </DialogHeader>
                  <div className="py-4">
                    <p className="text-sm mb-4">
                      Select an agent to assign the "{workflow.name}" workflow to:
                    </p>
                    {isLoading ? (
                      <div className="flex justify-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                      </div>
                    ) : (
                      <div className="max-h-60 overflow-auto space-y-2">
                        {agents.map((agent) => (
                          <div
                            key={agent.id}
                            className={cn(
                              "p-3 rounded-md cursor-pointer flex items-center border",
                              selectedAgentId === agent.id 
                                ? "bg-primary/10 border-primary/30" 
                                : "hover:bg-gray-50"
                            )}
                            onClick={() => setSelectedAgentId(agent.id)}
                          >
                            <div className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center mr-3",
                              agent.type === 'internal' ? "bg-indigo-100" : "bg-blue-100"
                            )}>
                              <i className={cn(
                                "fas",
                                `fa-${agent.icon || 'robot'}`,
                                agent.type === 'internal' ? "text-indigo-600" : "text-blue-600"
                              )}></i>
                            </div>
                            <div>
                              <p className="font-medium text-sm">{agent.name}</p>
                              <p className="text-xs text-gray-500">{agent.type}</p>
                            </div>
                            {selectedAgentId === agent.id && (
                              <div className="ml-auto text-primary">
                                <i className="fas fa-check-circle"></i>
                              </div>
                            )}
                          </div>
                        ))}
                        {agents.length === 0 && (
                          <p className="text-center text-sm text-gray-500 py-4">
                            No agents available
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  <DialogFooter className="sm:justify-end">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        setDialogOpen(false);
                        setSelectedAgentId(null);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      onClick={assignWorkflow}
                      disabled={!selectedAgentId || isLoading}
                      className="ml-2"
                    >
                      {isLoading ? 'Assigning...' : 'Assign Workflow'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <a href={`/workflow-editor/${workflow.id}`} className="text-xs text-primary hover:text-indigo-700">Edit</a>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkflowCard;
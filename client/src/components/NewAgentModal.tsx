import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { apiRequest } from '@/lib/apiClient';
import { createAgent } from '@/lib/workflowClient'; 
import { useToast } from '@/hooks/use-toast';

interface NewAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAgentCreated?: (agent: any) => void;
}

export function NewAgentModal({ isOpen, onClose, onAgentCreated }: NewAgentModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter a name for the new agent.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);
      
      const agentDescription = description.trim() || `A new agent created on ${new Date().toLocaleDateString()}`;
      
      // Create the agent using workflowClient's createAgent function
      // which internally uses the workflow engine
      const result = await createAgent({
        name,
        description: agentDescription,
        type: 'custom',
        icon: 'brain',
        status: 'active'
      }, {
        source: 'ui_form',
        onNodeStateChange: (nodeId, state) => {
          console.log(`Node ${nodeId} state changed to ${state.status}`);
        }
      });
      
      // Get the agent data from the result
      const agentData = result.output?.items?.[0]?.json?.agent || 
                        result.nodeStates?.[Object.keys(result.nodeStates)[0]]?.output?.items?.[0]?.json?.agent;
      
      if (!agentData) {
        // Fallback to direct API call if the workflow doesn't return agent data
        const response = await apiRequest({
          method: 'POST',
          url: '/api/agents',
          data: {
            name,
            description: agentDescription,
            type: 'custom',
            icon: 'brain',
            status: 'active'
          }
        });
        
        console.log("Agent created via direct API call:", response);
        
        if (onAgentCreated) {
          onAgentCreated(response);
        }
      } else {
        console.log("Agent created via workflow:", agentData);
        
        if (onAgentCreated) {
          onAgentCreated(agentData);
        }
      }
      
      toast({
        title: "Agent Created Successfully",
        description: `The agent "${name}" has been created.`,
      });
      
      // Reset form and close modal
      setName('');
      setDescription('');
      onClose();
    } catch (error) {
      console.error('Error creating agent:', error);
      let errorMessage = "Failed to create agent. Please try again.";
      
      // Try to extract a more specific error message if possible
      if (error instanceof Error) {
        errorMessage += ` (${error.message})`;
      } else if (typeof error === 'object' && error !== null) {
        errorMessage += ` (${JSON.stringify(error)})`;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Agent</DialogTitle>
          <DialogDescription>
            Enter the details for your new agent. The system will generate the required structure automatically.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter agent name"
                disabled={isLoading}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter agent description (optional)"
                disabled={isLoading}
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" type="button" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Agent'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default NewAgentModal;
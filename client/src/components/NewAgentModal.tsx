import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { apiPost } from '@/lib/apiClient';
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
      
      // Direct API call to create the agent
      const agentResponse = await apiPost('/api/agents', {
        name,
        description: description.trim() || `A new agent created on ${new Date().toLocaleDateString()}`,
        type: 'custom',
        icon: 'brain',
        status: 'active'
      });
      
      const agentData = await agentResponse.json();
      
      // Also make the workflow call for logging/tracking purposes
      const response = await apiPost('/api/workflows/run', {
        workflowId: 16, // ID of "Build New Agent Structure v1" workflow
        source: 'ui_form',
        triggerType: 'internal_new_agent',
        input: {
          request_type: 'new_agent',
          source: 'ui_form',
          name,
          description: description.trim() || `A new agent created on ${new Date().toLocaleDateString()}`
        }
      });
      
      const data = await response.json();
      
      // Use agent data for response
      data.agent = agentData;
      
      toast({
        title: "Agent Created Successfully",
        description: `The agent "${name}" has been created.`,
      });
      
      if (onAgentCreated) {
        // Use the agent data directly from the creation response
        onAgentCreated(agentData);
      }
      
      // Reset form and close modal
      setName('');
      setDescription('');
      onClose();
    } catch (error) {
      console.error('Error creating agent:', error);
      toast({
        title: "Error",
        description: "Failed to create agent. Please try again.",
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
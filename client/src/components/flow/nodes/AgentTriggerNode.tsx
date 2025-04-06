import { useCallback, useEffect, useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Settings2, Cpu, GitBranch } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Agent, Workflow } from '@shared/schema';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

type TriggerType = 'agent' | 'workflow';

interface AgentTriggerNodeProps extends NodeProps {
  data: {
    label?: string;
    description?: string;
    onSettingsClick?: () => void;
    settings?: {
      triggerType?: TriggerType;
      agentId?: number;
      workflowId?: number;
      promptField?: string;
      timeout?: number;
    };
    _isProcessing?: boolean;
    _isComplete?: boolean;
    _hasError?: boolean;
    _errorMessage?: string;
  };
}

const AgentTriggerNode = ({ id, data, selected }: AgentTriggerNodeProps) => {
  const { label, description, settings = {}, onSettingsClick } = data;
  const [triggerType, setTriggerType] = useState<TriggerType>(settings.triggerType || 'agent');
  const [selectedAgentId, setSelectedAgentId] = useState<number | undefined>(settings.agentId);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<number | undefined>(settings.workflowId);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);

  // Fetch available agents
  const { data: agents, isLoading: agentsLoading } = useQuery({
    queryKey: ['/api/agents'],
    queryFn: async () => {
      const res = await fetch('/api/agents');
      if (!res.ok) throw new Error('Failed to fetch agents');
      return res.json() as Promise<Agent[]>;
    }
  });

  // Fetch available workflows
  const { data: workflows, isLoading: workflowsLoading } = useQuery({
    queryKey: ['/api/workflows'],
    queryFn: async () => {
      const res = await fetch('/api/workflows');
      if (!res.ok) throw new Error('Failed to fetch workflows');
      return res.json() as Promise<Workflow[]>;
    }
  });

  // Find the selected agent when agents are loaded or selection changes
  useEffect(() => {
    if (agents && selectedAgentId) {
      const agent = agents.find(a => a.id === selectedAgentId);
      if (agent) {
        setSelectedAgent(agent);
      }
    }
  }, [agents, selectedAgentId]);

  // Find the selected workflow when workflows are loaded or selection changes
  useEffect(() => {
    if (workflows && selectedWorkflowId) {
      const workflow = workflows.find(w => w.id === selectedWorkflowId);
      if (workflow) {
        setSelectedWorkflow(workflow);
      }
    }
  }, [workflows, selectedWorkflowId]);

  // Update local state when settings are updated externally
  useEffect(() => {
    if (settings.triggerType) {
      setTriggerType(settings.triggerType);
    }
    if (settings.agentId) {
      setSelectedAgentId(settings.agentId);
    }
    if (settings.workflowId) {
      setSelectedWorkflowId(settings.workflowId);
    }
  }, [settings.triggerType, settings.agentId, settings.workflowId]);

  const handleTriggerTypeChange = (value: TriggerType) => {
    setTriggerType(value);
    
    // Update settings via custom event
    const event = new CustomEvent('agent-trigger-update', { 
      detail: { 
        nodeId: id, 
        settings: {
          ...settings,
          triggerType: value,
        }
      }
    });
    window.dispatchEvent(event);
  };

  const handleLocalAgentSelect = (agentIdStr: string) => {
    // Parse the agent ID from the dropdown selection
    const agentId = parseInt(agentIdStr, 10);
    setSelectedAgentId(agentId);
    
    // Update settings via custom event
    const event = new CustomEvent('agent-trigger-update', { 
      detail: { 
        nodeId: id, 
        settings: {
          ...settings,
          agentId,
          triggerType: 'agent'
        }
      }
    });
    window.dispatchEvent(event);
  };

  const handleLocalWorkflowSelect = (workflowIdStr: string) => {
    // Parse the workflow ID from the dropdown selection
    const workflowId = parseInt(workflowIdStr, 10);
    setSelectedWorkflowId(workflowId);
    
    // Update settings via custom event
    const event = new CustomEvent('agent-trigger-update', { 
      detail: { 
        nodeId: id, 
        settings: {
          ...settings,
          workflowId,
          triggerType: 'workflow'
        }
      }
    });
    window.dispatchEvent(event);
  };

  const handleSettingsClick = useCallback(() => {
    if (typeof onSettingsClick === 'function') {
      onSettingsClick();
    } else {
      // Trigger custom event to open settings
      const event = new CustomEvent('node-settings-open', { 
        detail: { nodeId: id }
      });
      window.dispatchEvent(event);
    }
  }, [id, onSettingsClick]);

  // Status indicators for the node
  const statusIndicator = () => {
    if (data._isProcessing) return <Badge variant="outline" className="bg-blue-50 text-blue-700">Processing</Badge>;
    if (data._hasError) return <Badge variant="outline" className="bg-red-50 text-red-700">Error</Badge>;
    if (data._isComplete) return <Badge variant="outline" className="bg-green-50 text-green-700">Completed</Badge>;
    return null;
  };

  // This handler will stop click propagation when clicking inside the card
  // to prevent the node settings drawer from opening when interacting with the dropdown
  const handleCardClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <Card 
      className={`w-72 shadow-md ${selected ? 'ring-2 ring-blue-500' : ''} ${data._hasError ? 'ring-2 ring-red-500' : ''}`}
      onClick={handleCardClick}
    >
      <CardHeader className="p-4 pb-0">
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-2">
            <Cpu className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-md">{label || 'Agent/Workflow Trigger'}</CardTitle>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6" 
            onClick={handleSettingsClick}
          >
            <Settings2 className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription className="text-xs mt-1">
          {description || 'Trigger an agent or workflow within the system'}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-4">
        <RadioGroup 
          className="mb-4 flex space-x-4"
          value={triggerType} 
          onValueChange={(v) => handleTriggerTypeChange(v as TriggerType)}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="agent" id="agent" />
            <Label htmlFor="agent" className="flex items-center space-x-1">
              <Cpu className="h-3 w-3" />
              <span>Agent</span>
            </Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="workflow" id="workflow" />
            <Label htmlFor="workflow" className="flex items-center space-x-1">
              <GitBranch className="h-3 w-3" />
              <span>Workflow</span>
            </Label>
          </div>
        </RadioGroup>
        
        <Separator className="my-2" />
        
        {triggerType === 'agent' ? (
          <div className="space-y-2">
            <div className="text-xs font-medium">Selected Agent:</div>
            <Select 
              value={selectedAgentId?.toString()} 
              onValueChange={handleLocalAgentSelect}
              disabled={agentsLoading || data._isProcessing}
            >
              <SelectTrigger className="w-full text-sm">
                <SelectValue placeholder="Select an agent" />
              </SelectTrigger>
              <SelectContent>
                {agents?.map(agent => (
                  <SelectItem key={agent.id} value={agent.id.toString()}>
                    {agent.name}
                  </SelectItem>
                ))}
                {!agents?.length && (
                  <SelectItem value="-1" disabled>No agents available</SelectItem>
                )}
              </SelectContent>
            </Select>
            
            {selectedAgent && (
              <div className="mt-2">
                <div className="text-xs font-medium">Agent Type:</div>
                <div className="text-xs text-gray-500">{selectedAgent.type || 'Unknown'}</div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-xs font-medium">Selected Workflow:</div>
            <Select 
              value={selectedWorkflowId?.toString()} 
              onValueChange={handleLocalWorkflowSelect}
              disabled={workflowsLoading || data._isProcessing}
            >
              <SelectTrigger className="w-full text-sm">
                <SelectValue placeholder="Select a workflow" />
              </SelectTrigger>
              <SelectContent>
                {workflows?.map(workflow => (
                  <SelectItem key={workflow.id} value={workflow.id.toString()}>
                    {workflow.name}
                  </SelectItem>
                ))}
                {!workflows?.length && (
                  <SelectItem value="-1" disabled>No workflows available</SelectItem>
                )}
              </SelectContent>
            </Select>
            
            {selectedWorkflow && (
              <div className="mt-2">
                <div className="text-xs font-medium">Workflow Type:</div>
                <div className="text-xs text-gray-500">{selectedWorkflow.type || 'Standard'}</div>
              </div>
            )}
          </div>
        )}
        
        {settings.promptField && (
          <div className="mt-2">
            <div className="text-xs font-medium">Input mapped from:</div>
            <div className="text-xs text-gray-500">{settings.promptField}</div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="p-3 pt-0 flex items-center justify-between">
        {statusIndicator()}
        
        {data._errorMessage && (
          <span className="text-xs text-red-600 truncate max-w-[180px]" title={data._errorMessage}>
            {data._errorMessage}
          </span>
        )}
      </CardFooter>
      
      {/* Input and Output handles */}
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        style={{ background: '#555', width: 8, height: 8 }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        style={{ background: '#555', width: 8, height: 8 }}
      />
    </Card>
  );
};

export default AgentTriggerNode;
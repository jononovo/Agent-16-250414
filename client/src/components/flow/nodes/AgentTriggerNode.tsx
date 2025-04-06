import { useCallback, useEffect, useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Settings2, Cpu } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Agent } from '@shared/schema';

interface AgentTriggerNodeProps extends NodeProps {
  data: {
    label?: string;
    description?: string;
    onSettingsClick?: () => void;
    settings?: {
      agentId?: number;
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
  const [selectedAgentId, setSelectedAgentId] = useState<number | undefined>(settings.agentId);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

  // Fetch available agents
  const { data: agents, isLoading } = useQuery({
    queryKey: ['/api/agents'],
    queryFn: async () => {
      const res = await fetch('/api/agents');
      if (!res.ok) throw new Error('Failed to fetch agents');
      return res.json() as Promise<Agent[]>;
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

  // Update local state when settings are updated externally
  useEffect(() => {
    if (settings.agentId) {
      setSelectedAgentId(settings.agentId);
    }
  }, [settings.agentId]);

  const handleLocalAgentSelect = (agentIdStr: string) => {
    // Parse the agent ID from the dropdown selection
    const agentId = parseInt(agentIdStr, 10);
    setSelectedAgentId(agentId);
    
    // Don't trigger the drawer here - that would conflict with the dropdown
    // Instead, update local state and let the parent know via a custom event
    const event = new CustomEvent('agent-trigger-update', { 
      detail: { 
        nodeId: id, 
        settings: {
          ...settings,
          agentId
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

  return (
    <Card className={`w-64 shadow-md ${selected ? 'ring-2 ring-blue-500' : ''} ${data._hasError ? 'ring-2 ring-red-500' : ''}`}>
      <CardHeader className="p-4 pb-0">
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-2">
            <Cpu className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-md">{label || 'Agent Trigger'}</CardTitle>
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
          {description || 'Trigger another agent within the system'}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-4">
        <div className="space-y-2">
          <div className="text-xs font-medium">Selected Agent:</div>
          <Select 
            value={selectedAgentId?.toString()} 
            onValueChange={handleLocalAgentSelect}
            disabled={isLoading || data._isProcessing}
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
        </div>
        
        {selectedAgent && (
          <div className="mt-2">
            <div className="text-xs font-medium">Agent Type:</div>
            <div className="text-xs text-gray-500">{selectedAgent.type || 'Unknown'}</div>
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
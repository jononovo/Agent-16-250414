import { useState, useEffect } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GitBranch, Settings } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface WorkflowTriggerNodeProps extends NodeProps {
  data: {
    label?: string;
    description?: string;
    onSettingsClick?: () => void;
    settings?: {
      workflowId?: number;
      inputField?: string;
      timeout?: number;
    };
    _isProcessing?: boolean;
    _isComplete?: boolean;
    _hasError?: boolean;
    _errorMessage?: string;
  };
}

const WorkflowTriggerNode = ({ id, data, selected }: WorkflowTriggerNodeProps) => {
  const [isConfigured, setIsConfigured] = useState(false);

  // Update configuration status when settings change
  useEffect(() => {
    setIsConfigured(!!data.settings?.workflowId);
  }, [data.settings]);

  // Open settings dialog via a custom event
  const handleSettingsClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (data.onSettingsClick) {
      data.onSettingsClick();
    } else {
      // Dispatch a custom event as a fallback
      const settingsEvent = new CustomEvent('node-settings-open', {
        detail: { nodeId: id }
      });
      window.dispatchEvent(settingsEvent);
    }
  };

  // Determine the right status badge
  const renderStatusBadge = () => {
    if (data._isProcessing) {
      return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">Processing</Badge>;
    }
    if (data._hasError) {
      return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">Error</Badge>;
    }
    if (data._isComplete) {
      return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">Completed</Badge>;
    }
    if (!isConfigured) {
      return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">Needs Config</Badge>;
    }
    return null;
  };

  return (
    <Card className={cn(
      "min-w-[240px] max-w-[280px] border-2 border-orange-300 bg-white",
      selected ? "ring-2 ring-orange-500" : "",
      data._hasError ? "border-red-400" : "",
      data._isComplete ? "border-green-400" : "",
      data._isProcessing ? "border-yellow-400" : ""
    )}>
      <CardHeader className="flex flex-row items-center justify-between p-4 pb-2 space-y-0">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
            <GitBranch className="h-4 w-4 text-orange-600" />
          </div>
          <CardTitle className="text-sm font-medium">
            {data.label || 'Workflow Trigger'}
          </CardTitle>
        </div>
        {renderStatusBadge()}
      </CardHeader>
      
      <CardContent className="p-4 pt-0 pb-3">
        <p className="text-xs text-muted-foreground">
          {data.description || 'Triggers another workflow within the system.'}
        </p>
        
        {data.settings?.workflowId && (
          <div className="mt-2 text-xs">
            <div className="flex items-center space-x-2">
              <span className="font-medium">Workflow ID:</span>
              <span>{data.settings.workflowId}</span>
            </div>
            {data.settings.inputField && (
              <div className="flex items-center space-x-2 mt-1">
                <span className="font-medium">Input from:</span>
                <span>{data.settings.inputField}</span>
              </div>
            )}
            {data.settings.timeout && (
              <div className="flex items-center space-x-2 mt-1">
                <span className="font-medium">Timeout:</span>
                <span>{data.settings.timeout}s</span>
              </div>
            )}
          </div>
        )}
        
        {data._hasError && (
          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-800">
            {data._errorMessage || 'An error occurred while triggering the workflow.'}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="p-3 pt-0 flex justify-end">
        <Button 
          size="sm" 
          variant="ghost" 
          className="px-2 h-8" 
          onClick={handleSettingsClick}
        >
          <Settings className="h-4 w-4 mr-1" /> Settings
        </Button>
      </CardFooter>
      
      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: '#FF9800', width: '10px', height: '10px' }}
        id="in"
      />
      
      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Right}
        style={{ background: '#FF9800', width: '10px', height: '10px' }}
        id="out"
      />
    </Card>
  );
};

export default WorkflowTriggerNode;
/**
 * Default Node UI
 * 
 * This is the default node UI component used for basic node types
 * and as a fallback for node types without specific implementations.
 */

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Settings, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import DynamicIcon from '@/components/flow/DynamicIcon';

// Import the common node components
import { NodeContainer } from '@/components/nodes/common/NodeContainer';
import { NodeHeader } from '@/components/nodes/common/NodeHeader';
import { NodeContent } from '@/components/nodes/common/NodeContent';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger 
} from '@/components/ui/tooltip';

interface DefaultNodeData {
  label: string;
  description?: string;
  type?: string;
  category?: string;
  settings?: Record<string, unknown>;
  isProcessing?: boolean;
  isComplete?: boolean;
  hasError?: boolean;
  errorMessage?: string;
  icon?: string;
}

/**
 * DefaultNode - A generic node type that can be used for any node
 * 
 * This node type serves as a fallback for nodes that don't have
 * specific UI implementations, or for simple node types that don't
 * need custom rendering.
 */
function DefaultNode({ data, id, selected }: NodeProps<DefaultNodeData>) {
  // Destructure node data with defaults
  const {
    label = 'Node',
    description = 'Generic node',
    type = 'default',
    category = 'general',
    settings = {},
    isProcessing = false,
    isComplete = false,
    hasError = false,
    errorMessage = '',
    icon = 'box',
  } = data;
  
  // Get the status badge based on execution state
  const getStatusBadge = () => {
    if (isProcessing) return <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">Running</Badge>;
    if (isComplete) return <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">Completed</Badge>;
    if (hasError) return <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">Error</Badge>;
    return null;
  };
  
  // Get settings summary for display in the node
  const getSettingsSummary = () => {
    if (!settings || Object.keys(settings).length === 0) {
      return null;
    }
    
    // Format based on common settings patterns
    const summaryItems = [];
    
    if (settings.operation) {
      summaryItems.push(`Operation: ${settings.operation}`);
    }
    
    if (settings.method) {
      summaryItems.push(`Method: ${settings.method}`);
    }
    
    if (settings.format) {
      summaryItems.push(`Format: ${settings.format}`);
    }
    
    if (settings.triggerType) {
      summaryItems.push(`Trigger: ${settings.triggerType}`);
    }
    
    // Return formatted summary or just the first few settings
    if (summaryItems.length > 0) {
      return summaryItems.join(' • ');
    } else {
      // Just take first 2 settings if available
      const keys = Object.keys(settings).slice(0, 2);
      return keys.map(key => `${key}: ${String(settings[key])}`).join(' • ');
    }
  };
  
  const settingsSummary = getSettingsSummary();
  
  // Create the header actions slot
  const headerActions = (
    <div className="flex items-center gap-1.5">
      {getStatusBadge()}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7"
            >
              <Settings className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p className="text-xs">Node settings</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
  
  // Create icon element for the header
  const iconElement = (
    <div className="bg-primary/10 p-1.5 rounded-md">
      <DynamicIcon icon={icon} className="h-4 w-4 text-primary" />
    </div>
  );
  
  // Additional class for animation and state indication
  const containerClass = cn(
    isProcessing && 'animate-pulse',
    isComplete && 'border-green-500/30',
    hasError && 'border-red-500/30'
  );
  
  return (
    <NodeContainer selected={selected} className={containerClass}>
      <NodeHeader 
        title={label} 
        description={description}
        icon={iconElement}
        actions={headerActions}
      />
      
      <NodeContent padding="normal">
        {/* Node Type Badge */}
        <div className="flex justify-between items-center">
          <Badge variant="outline" className="text-xs px-2 py-0.5 bg-slate-100/50 dark:bg-slate-800/50">
            {category}
          </Badge>
          
          {/* Settings Summary */}
          {settingsSummary && (
            <div className="flex items-center text-xs text-muted-foreground">
              <Settings className="h-3 w-3 mr-1 inline" />
              <span className="truncate">{settingsSummary}</span>
            </div>
          )}
        </div>
        
        {/* Status messages and errors */}
        {hasError && errorMessage && (
          <div className="p-2 text-xs bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded border border-red-200 dark:border-red-800">
            <div className="flex items-center gap-1 mb-1">
              <AlertTriangle className="h-3 w-3" />
              <span className="font-medium">Error</span>
            </div>
            {errorMessage}
          </div>
        )}
      </NodeContent>
      
      {/* Input handle for triggering the node */}
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        style={{ 
          top: 50, 
          width: '12px', 
          height: '12px', 
          background: 'white',
          border: '2px solid #3b82f6'
        }}
        isConnectable={true}
      />
      <div className="absolute left-2 top-[46px] text-xs text-muted-foreground">
        In
      </div>

      {/* Output handle for continuing to the next node */}
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        style={{ 
          top: 50, 
          width: '12px', 
          height: '12px', 
          background: 'white',
          border: '2px solid #10b981'
        }}
        isConnectable={true}
      />
      <div className="absolute right-2 top-[46px] text-xs text-muted-foreground text-right">
        Out
      </div>
    </NodeContainer>
  );
}

export default memo(DefaultNode);
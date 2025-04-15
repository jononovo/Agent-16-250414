import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Settings, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import DynamicIcon from '../DynamicIcon';

// Import the common node components
import { NodeContainer } from '@/components/nodes/common/NodeContainer';
import { NodeHeader } from '@/components/nodes/common/NodeHeader';
import { NodeContent } from '@/components/nodes/common/NodeContent';

interface InternalNodeData {
  label: string;
  description?: string;
  settings?: Record<string, unknown>;
  isProcessing?: boolean;
  isComplete?: boolean;
  hasError?: boolean;
  errorMessage?: string;
  eventType?: string;
  triggerSource?: string;
}

/**
 * InternalNode - A node type for internal system operations
 * 
 * This node type is used for operations that interface directly with
 * the system itself, such as:
 * - Creating new agents
 * - Triggering workflows from UI events
 * - Handling AI chat instructions
 * - Performing system actions
 */
function InternalNode({ data, id, selected }: NodeProps<InternalNodeData>) {
  // Destructure node data with defaults
  const {
    label = 'Internal Node',
    description = 'Interfaces with internal system operations',
    settings = {},
    isProcessing = false,
    isComplete = false,
    hasError = false,
    errorMessage = '',
    eventType,
    triggerSource,
  } = data;

  // Determine icon based on node type (using the node ID to infer type)
  const nodeType = id.split('-')[0]; // e.g., "internal_new_agent-1" -> "internal_new_agent"
  let icon = 'cog';
  
  if (nodeType.includes('new_agent')) {
    icon = 'user-plus';
  } else if (nodeType.includes('chat_agent') || nodeType.includes('ai_chat')) {
    icon = 'message-circle';
  } else if (id.includes('trigger')) {
    icon = 'zap';
  } else if (id.includes('action')) {
    icon = 'save';
  }

  // Style for different node states
  const nodeStateStyle = isProcessing
    ? 'animate-pulse border-blue-500'
    : isComplete
    ? 'border-green-500'
    : hasError
    ? 'border-red-500'
    : selected
    ? 'border-slate-700 dark:border-slate-300'
    : 'border-slate-200 dark:border-slate-700';
    
  // Get node type information
  const getNodeTypeInfo = () => {
    switch (nodeType) {
      case 'internal_new_agent':
        return {
          title: 'New Agent Trigger',
          description: 'Triggers when user clicks New Agent button',
          infoText: 'This trigger node initiates the workflow when a user clicks the New Agent button in the UI.'
        };
      case 'internal_ai_chat_agent':
        return {
          title: 'AI Chat Agent Trigger',
          description: 'Triggers when chat agent instructs to create a new agent',
          infoText: 'This trigger node activates when a user instructs the AI chat to create a new agent.'
        };
      case 'internal_create_agent':
        return {
          title: 'Create Agent Action',
          description: 'Creates a new agent with specified parameters',
          infoText: 'This action node creates a new agent in the system with the properties defined in the input.'
        };
      default:
        return {
          title: nodeType.replace(/_/g, ' '),
          description: 'Internal system operation',
          infoText: 'This node interfaces with internal system operations.'
        };
    }
  };
  
  const nodeInfo = getNodeTypeInfo();
  
  // Get settings summary for display in the node
  const getSettingsSummary = () => {
    if (!settings || Object.keys(settings).length === 0) {
      return null;
    }
    
    // Format based on node type
    if (nodeType === 'internal_new_agent') {
      const template = settings.agentTemplate 
        ? `Template: ${settings.agentTemplate}`
        : null;
      const workflow = settings.defaultWorkflow && settings.defaultWorkflow !== 'none'
        ? `Workflow: ${settings.defaultWorkflow}`
        : null;
      
      return [template, workflow].filter(Boolean).join(' • ');
    }
    
    if (nodeType === 'internal_ai_chat_agent') {
      const triggerPhrasesCount = settings.triggerPhrases 
        ? `${(settings.triggerPhrases as string).split(',').length} triggers`
        : null;
      
      return triggerPhrasesCount;
    }
    
    if (nodeType === 'internal_create_agent') {
      const notify = settings.notifyOnCreate === 'true'
        ? 'With notification'
        : settings.notifyOnCreate === 'false'
        ? 'Silent creation'
        : null;
      
      return notify;
    }
    
    // For other internal nodes
    const eventType = settings.eventType 
      ? `Event: ${settings.eventType}`
      : null;
    const priority = settings.priority
      ? `Priority: ${settings.priority}`
      : null;
      
    return [eventType, priority].filter(Boolean).join(' • ');
  };
  
  const settingsSummary = getSettingsSummary();

  // Get the status badge based on execution state
  const getStatusBadge = () => {
    if (isProcessing) return <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">Running</Badge>;
    if (isComplete) return <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">Completed</Badge>;
    if (hasError) return <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">Error</Badge>;
    return null;
  };
  
  // Create the header actions slot
  const headerActions = (
    <div className="flex items-center gap-1.5">
      {getStatusBadge()}
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-7 w-7" 
        title={nodeInfo.infoText}
      >
        <Settings className="h-3.5 w-3.5 text-muted-foreground" />
      </Button>
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
            {nodeInfo.title}
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

export default memo(InternalNode);
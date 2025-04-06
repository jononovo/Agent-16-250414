import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info, Settings, Check, AlertTriangle } from 'lucide-react';
import DynamicIcon from '../DynamicIcon';

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

  return (
    <Card
      className={`w-64 p-3 shadow border-2 ${nodeStateStyle} transition-all duration-200`}
    >
      {/* Input handle for triggering the node */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 rounded-full border-2 bg-slate-50 border-slate-500"
      />

      <div className="flex items-center gap-2">
        <div className="p-2 rounded-md bg-slate-100 dark:bg-slate-800">
          <DynamicIcon icon={icon} className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-medium">{label}</h3>
            <div className="flex items-center gap-1">
              <Badge variant="outline" className="text-xs px-1 bg-slate-100 dark:bg-slate-800">
                {nodeInfo.title}
              </Badge>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="p-1 cursor-help">
                      <Info className="h-3 w-3 text-muted-foreground" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <p className="text-xs">{nodeInfo.infoText}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
            {description}
          </p>
        </div>
      </div>
      
      {/* Display settings summary if available */}
      {settingsSummary && (
        <div className="mt-2 flex items-center text-xs text-slate-500">
          <Settings className="h-3 w-3 mr-1 inline" />
          <span className="truncate">{settingsSummary}</span>
        </div>
      )}
      
      {/* Status indicators */}
      {(isComplete || hasError) && (
        <div className="mt-2 flex items-center gap-1 text-xs">
          {isComplete && !hasError && (
            <div className="flex items-center text-green-600 dark:text-green-500">
              <Check className="h-3 w-3 mr-1" />
              <span>Execution complete</span>
            </div>
          )}
          {hasError && (
            <div className="flex items-center text-red-600 dark:text-red-500">
              <AlertTriangle className="h-3 w-3 mr-1" />
              <span className="truncate">{errorMessage || 'Execution error'}</span>
            </div>
          )}
        </div>
      )}

      {/* Show error message if node has an error */}
      {hasError && errorMessage && (
        <div className="mt-2 p-2 text-xs bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded border border-red-200 dark:border-red-800">
          {errorMessage}
        </div>
      )}

      {/* Output handle for continuing to the next node */}
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 rounded-full border-2 bg-slate-50 border-slate-500"
      />
    </Card>
  );
}

export default memo(InternalNode);
import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import DynamicIcon from '../DynamicIcon';

interface InternalNodeData {
  label: string;
  description?: string;
  settings?: Record<string, unknown>;
  isProcessing?: boolean;
  isComplete?: boolean;
  hasError?: boolean;
  errorMessage?: string;
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
            <Badge variant="outline" className="text-xs px-1 bg-slate-100 dark:bg-slate-800">
              {nodeType.replace(/_/g, ' ')}
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
            {description}
          </p>
        </div>
      </div>

      {/* Show error message if node has an error */}
      {hasError && (
        <div className="mt-2 p-2 text-xs bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded border border-red-200 dark:border-red-800">
          {errorMessage || 'An error occurred during execution'}
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
import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { MessageSquare, Code, GitBranch, ArrowRightLeft, Box } from 'lucide-react';

function getNodeIcon(type: string) {
  switch (type) {
    case 'prompt':
      return <MessageSquare className="h-4 w-4" />;
    case 'api':
      return <Code className="h-4 w-4" />;
    case 'condition':
      return <GitBranch className="h-4 w-4" />;
    case 'transform':
      return <ArrowRightLeft className="h-4 w-4" />;
    default:
      return <Box className="h-4 w-4" />;
  }
}

const BaseNode = memo(({ data, isConnectable, selected, type }: NodeProps) => {
  const nodeType = data.type || type || 'default';
  
  return (
    <div
      className={`px-4 py-2 shadow-md rounded-md border ${
        selected ? 'border-primary ring-2 ring-primary ring-opacity-20' : 'border-gray-200 dark:border-gray-700'
      } bg-white dark:bg-gray-800`}
    >
      <div className="flex items-center">
        <div className="rounded-full w-8 h-8 flex items-center justify-center bg-gray-100 dark:bg-gray-700 mr-2">
          {getNodeIcon(nodeType)}
        </div>
        <div>
          <div className="text-sm font-bold">{data.label}</div>
          {data.description && (
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {data.description}
            </div>
          )}
        </div>
      </div>
      
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-gray-300 dark:bg-gray-600"
        isConnectable={isConnectable}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-gray-300 dark:bg-gray-600"
        isConnectable={isConnectable}
      />
    </div>
  );
});

BaseNode.displayName = 'BaseNode';

export default BaseNode;
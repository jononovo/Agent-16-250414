import { memo } from 'react';
import { NodeProps } from 'reactflow';
import { Loader2 } from 'lucide-react';
import DynamicIcon from '../DynamicIcon';

interface LoadingNodeData {
  label: string;
  description?: string;
  icon?: string;
  actualType?: string;
  actualData?: any;
}

/**
 * LoadingNode - A placeholder node shown while the actual node component is being loaded
 */
function LoadingNode({ data, selected }: NodeProps<LoadingNodeData>) {
  const {
    label = 'Loading Node',
    description = 'Node component is loading...',
    icon = 'loader',
    actualType
  } = data;

  return (
    <div className={`
      w-64 p-3 shadow border-2 rounded-md
      ${selected ? 'border-primary/70 shadow-md' : 'border-muted'}
      bg-card text-card-foreground
      transition-all duration-200
    `}>
      <div className="flex items-center gap-2 mb-2">
        <div className="p-2 rounded-md bg-slate-100 dark:bg-slate-800 relative">
          <DynamicIcon icon={icon} className="h-5 w-5 text-primary" />
          <Loader2 className="h-5 w-5 text-primary absolute inset-0 m-auto animate-spin opacity-50" />
        </div>
        <div className="flex-1">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-medium">{label}</h3>
            {actualType && (
              <div className="text-xs px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-muted-foreground">
                {actualType}
              </div>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
            {description}
          </p>
        </div>
      </div>
      <div className="mt-2 text-xs text-slate-500 animate-pulse">
        Loading component...
      </div>
    </div>
  );
}

export default memo(LoadingNode);
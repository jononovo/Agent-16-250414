import { useState } from 'react';
import { Handle, Position } from 'reactflow';
import { cn } from '@/lib/utils';
import { Settings, Wand2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export interface TransformNodeProps {
  data: {
    label?: string;
    description?: string;
    transformType?: string;
    transformScript?: string;
    isProcessing?: boolean;
    isComplete?: boolean;
    hasError?: boolean;
    errorMessage?: string;
    onSettingsClick?: () => void;
    settings?: {
      transformType?: string;
      transformScript?: string;
    };
  };
  isConnectable?: boolean;
  selected?: boolean;
}

const TransformNode = ({ data, isConnectable = true, selected }: TransformNodeProps) => {
  const transformType = data.transformType || data.settings?.transformType || 'json';
  const [localScript, setLocalScript] = useState(data.transformScript || data.settings?.transformScript || '');
  
  const handleScriptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalScript(e.target.value);
    // This would typically be saved to the node data in a real implementation
  };
  
  const getStatusBadge = () => {
    if (data.hasError) {
      return <Badge variant="destructive" className="ml-2">Error</Badge>;
    }
    if (data.isComplete) {
      return <Badge variant="outline" className="bg-green-500 text-white ml-2">Complete</Badge>;
    }
    if (data.isProcessing) {
      return <Badge variant="outline" className="bg-blue-500 text-white ml-2">Processing</Badge>;
    }
    return null;
  };
  
  return (
    <div className={cn(
      'transform-node relative p-0 rounded-md min-w-[280px] max-w-[350px] bg-background border transition-all shadow-md',
      selected ? 'border-primary ring-2 ring-primary ring-opacity-20' : 'border-border'
    )}>
      {/* Header */}
      <div className="p-3 border-b flex items-center justify-between">
        <div className="font-medium text-sm flex items-center">
          <Wand2 className="h-4 w-4 mr-2 text-purple-500" />
          <span>{data.label || 'Transform'}</span>
          {getStatusBadge()}
        </div>
        {data.onSettingsClick && (
          <button 
            onClick={data.onSettingsClick}
            className="ml-auto hover:bg-muted p-1 rounded-sm"
          >
            <Settings className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
      </div>
      
      {/* Body */}
      <div className="p-3 space-y-4">
        {data.description && (
          <p className="text-sm text-muted-foreground">{data.description}</p>
        )}
        
        <div className="space-y-2">
          <label className="text-xs font-medium">Transform Type</label>
          <Select defaultValue={transformType}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select transform type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="json">JSON Transform</SelectItem>
              <SelectItem value="text">Text Transform</SelectItem>
              <SelectItem value="filter">Filter Data</SelectItem>
              <SelectItem value="extract">Extract Fields</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <label className="text-xs font-medium">Transform Script</label>
          <Textarea
            value={localScript}
            onChange={handleScriptChange}
            className="min-h-[100px] text-sm font-mono resize-y"
            placeholder="// Write your transformation code here"
          />
        </div>
        
        {data.errorMessage && (
          <div className="mt-2 text-xs text-red-500 bg-red-50 p-2 rounded">
            {data.errorMessage}
          </div>
        )}
      </div>
      
      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        className="w-3 h-3 left-[-6px] bg-purple-500 border-2 border-background"
        isConnectable={isConnectable}
      />
      
      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        className="w-3 h-3 right-[-6px] bg-purple-500 border-2 border-background"
        isConnectable={isConnectable}
      />
    </div>
  );
};

export default TransformNode;
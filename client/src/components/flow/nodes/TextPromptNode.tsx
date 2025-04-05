import { useState, useEffect } from 'react';
import { Handle, Position } from 'reactflow';
import { cn } from '@/lib/utils';
import { MessageSquare, Settings } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';

export interface TextPromptNodeProps {
  data: {
    label?: string;
    prompt?: string;
    description?: string;
    isProcessing?: boolean;
    isComplete?: boolean;
    hasError?: boolean;
    errorMessage?: string;
    onSettingsClick?: () => void;
    settings?: {
      prompt?: string;
    };
  };
  isConnectable?: boolean;
  selected?: boolean;
}

const TextPromptNode = ({ data, isConnectable = true, selected }: TextPromptNodeProps) => {
  const [localPrompt, setLocalPrompt] = useState(data.prompt || data.settings?.prompt || '');
  
  // Update local state when data changes
  useEffect(() => {
    setLocalPrompt(data.prompt || data.settings?.prompt || '');
  }, [data.prompt, data.settings?.prompt]);
  
  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalPrompt(e.target.value);
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
      'text-prompt-node relative p-0 rounded-md min-w-[250px] max-w-[350px] bg-background border transition-all shadow-md',
      selected ? 'border-primary ring-2 ring-primary ring-opacity-20' : 'border-border'
    )}>
      {/* Header */}
      <div className="p-3 border-b flex items-center justify-between">
        <div className="font-medium text-sm flex items-center">
          <MessageSquare className="h-4 w-4 mr-2 text-blue-500" />
          <span>{data.label || 'Text Prompt'}</span>
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
      <div className="p-3">
        {data.description && (
          <p className="text-sm text-muted-foreground mb-2">{data.description}</p>
        )}
        <Textarea
          value={localPrompt}
          onChange={handlePromptChange}
          className="min-h-[120px] text-sm resize-y"
          placeholder="Enter your prompt text here..."
        />
        
        {data.errorMessage && (
          <div className="mt-2 text-xs text-red-500 bg-red-50 p-2 rounded">
            {data.errorMessage}
          </div>
        )}
      </div>
      
      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        className="w-3 h-3 right-[-6px] bg-blue-500 border-2 border-background"
        isConnectable={isConnectable}
      />
    </div>
  );
};

export default TextPromptNode;
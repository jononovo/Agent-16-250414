import { useState, useEffect, useCallback } from 'react';
import { Handle, Position, useUpdateNodeInternals } from 'reactflow';
import { cn } from '@/lib/utils';
import { MessageSquare, Settings, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { nanoid } from 'nanoid';
import { EditableHandleDialog } from '@/components/ui/flow/editable-handle';

export interface InputHandle {
  id: string;
  name: string;
  description?: string;
}

export interface TextPromptNodeProps {
  id: string;
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
    dynamicHandles?: {
      inputs: InputHandle[];
    };
    onAddInput?: (input: InputHandle) => void;
    onUpdateInput?: (id: string, name: string, description?: string) => void;
    onRemoveInput?: (id: string) => void;
  };
  isConnectable?: boolean;
  selected?: boolean;
}

const TextPromptNode = ({ id, data, isConnectable = true, selected }: TextPromptNodeProps) => {
  const [localPrompt, setLocalPrompt] = useState(data.prompt || data.settings?.prompt || '');
  const updateNodeInternals = useUpdateNodeInternals();
  
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
  
  // Handle creation of a new input
  const handleCreateInput = useCallback((name: string, description?: string) => {
    if (data.onAddInput) {
      const newInput: InputHandle = {
        id: `input-${nanoid()}`,
        name,
        description
      };
      data.onAddInput(newInput);
      updateNodeInternals(id);
    }
    return true;
  }, [data.onAddInput, id, updateNodeInternals]);
  
  // Handle updating an input
  const handleUpdateInput = useCallback((handleId: string, name: string, description?: string) => {
    if (data.onUpdateInput) {
      data.onUpdateInput(handleId, name, description);
      return true;
    }
    return false;
  }, [data.onUpdateInput]);
  
  // Handle removing an input
  const handleRemoveInput = useCallback((handleId: string) => {
    if (data.onRemoveInput) {
      data.onRemoveInput(handleId);
      updateNodeInternals(id);
    }
  }, [data.onRemoveInput, id, updateNodeInternals]);
  
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
        
        {/* Dynamic Inputs Section */}
        {data.dynamicHandles?.inputs && data.dynamicHandles.inputs.length > 0 && (
          <div className="mt-4 border-t pt-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium">Dynamic Inputs</h3>
            </div>
            <div className="space-y-2 text-sm">
              {data.dynamicHandles.inputs.map((input) => (
                <div key={input.id} className="flex items-center gap-2">
                  <EditableHandle
                    nodeId={id}
                    handleId={input.id}
                    name={input.name}
                    description={input.description}
                    type="target"
                    position={Position.Left}
                    wrapperClassName="w-full"
                    onUpdateTool={handleUpdateInput}
                    onDelete={handleRemoveInput}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Add Input Button */}
        <EditableHandleDialog
          variant="create"
          label=""
          onSave={handleCreateInput}
          onCancel={() => {}}
          align="start"
        >
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-3 w-full"
          >
            <Plus className="h-3 w-3 mr-1" /> Add Input
          </Button>
        </EditableHandleDialog>
        
        {data.errorMessage && (
          <div className="mt-2 text-xs text-red-500 bg-red-50 p-2 rounded">
            {data.errorMessage}
          </div>
        )}
      </div>
      
      {/* Input handles - dynamically positioned */}
      {data.dynamicHandles?.inputs?.map((input, index) => (
        <Handle
          key={input.id}
          type="target"
          position={Position.Left}
          id={input.id}
          className="w-3 h-3 left-[-6px] !bg-blue-500 border-2 border-background"
          style={{
            top: `${100 + (index * 30)}px`,
          }}
          data-label={input.name}
          isConnectable={isConnectable}
        />
      ))}
      
      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        className="w-3 h-3 right-[-6px] !bg-blue-500 border-2 border-background"
        isConnectable={isConnectable}
      />
    </div>
  );
};

export default TextPromptNode;
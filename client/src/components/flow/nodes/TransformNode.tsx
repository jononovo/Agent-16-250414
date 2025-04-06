import { useState, useCallback } from 'react';
import { Handle, Position, useUpdateNodeInternals } from 'reactflow';
import { cn } from '@/lib/utils';
import { Settings, Wand2, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { nanoid } from 'nanoid';
import { EditableHandleDialog } from '@/components/ui/flow/editable-handle';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export interface InputField {
  id: string;
  name: string;
  description?: string;
}

export interface OutputField {
  id: string;
  name: string;
  description?: string;
}

export interface TransformNodeProps {
  id: string;
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
    // Support for dynamic handles
    dynamicHandles?: {
      inputs: InputField[];
      outputs: OutputField[];
    };
    // Handlers for dynamic handles
    onAddInput?: (input: InputField) => void;
    onUpdateInput?: (id: string, name: string, description?: string) => void;
    onRemoveInput?: (id: string) => void;
    onAddOutput?: (output: OutputField) => void;
    onUpdateOutput?: (id: string, name: string, description?: string) => void;
    onRemoveOutput?: (id: string) => void;
  };
  isConnectable?: boolean;
  selected?: boolean;
}

const TransformNode = ({ id, data, isConnectable = true, selected }: TransformNodeProps) => {
  const transformType = data.transformType || data.settings?.transformType || 'json';
  const [localScript, setLocalScript] = useState(data.transformScript || data.settings?.transformScript || '');
  const updateNodeInternals = useUpdateNodeInternals();
  
  // Initialize inputs & outputs if they don't exist
  const inputs = data.dynamicHandles?.inputs || [];
  const outputs = data.dynamicHandles?.outputs || [];
  
  const handleScriptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalScript(e.target.value);
    // This would typically be saved to the node data in a real implementation
  };
  
  // Handle creation of a new input
  const handleCreateInput = useCallback((name: string, description?: string) => {
    if (data.onAddInput) {
      const newInput: InputField = {
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
      updateNodeInternals(id);
      return true;
    }
    return false;
  }, [data.onUpdateInput, id, updateNodeInternals]);
  
  // Handle removing an input
  const handleRemoveInput = useCallback((handleId: string) => {
    if (data.onRemoveInput) {
      data.onRemoveInput(handleId);
      updateNodeInternals(id);
    }
  }, [data.onRemoveInput, id, updateNodeInternals]);
  
  // Handle creation of a new output
  const handleCreateOutput = useCallback((name: string, description?: string) => {
    if (data.onAddOutput) {
      const newOutput: OutputField = {
        id: `output-${nanoid()}`,
        name,
        description
      };
      data.onAddOutput(newOutput);
      updateNodeInternals(id);
    }
    return true;
  }, [data.onAddOutput, id, updateNodeInternals]);
  
  // Handle updating an output
  const handleUpdateOutput = useCallback((handleId: string, name: string, description?: string) => {
    if (data.onUpdateOutput) {
      data.onUpdateOutput(handleId, name, description);
      updateNodeInternals(id);
      return true;
    }
    return false;
  }, [data.onUpdateOutput, id, updateNodeInternals]);
  
  // Handle removing an output
  const handleRemoveOutput = useCallback((handleId: string) => {
    if (data.onRemoveOutput) {
      data.onRemoveOutput(handleId);
      updateNodeInternals(id);
    }
  }, [data.onRemoveOutput, id, updateNodeInternals]);
  
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
        
        {/* Dynamic Inputs Section */}
        {inputs.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-medium">Dynamic Inputs</h3>
            </div>
            <div className="space-y-2 text-xs">
              {inputs.map((input) => (
                <div key={input.id} className="flex items-center gap-2">
                  <div className="w-full flex items-center gap-2 relative px-4 py-2 bg-muted/30 rounded-sm">
                    <div className="flex-1 flex flex-col overflow-hidden">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium truncate">{input.name}</div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleRemoveInput(input.id)}
                            className="p-1 text-muted-foreground hover:text-red-500 transition-colors"
                            aria-label="Delete input"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M3 6h18"></path>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path>
                              <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                          </button>
                        </div>
                      </div>
                      {input.description && <div className="text-xs text-muted-foreground truncate">{input.description}</div>}
                    </div>
                  </div>
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
        
        {/* Dynamic Outputs Section */}
        {outputs.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-medium">Dynamic Outputs</h3>
            </div>
            <div className="space-y-2 text-xs">
              {outputs.map((output) => (
                <div key={output.id} className="flex items-center gap-2">
                  <div className="w-full flex items-center gap-2 relative px-4 py-2 bg-muted/30 rounded-sm">
                    <div className="flex-1 flex flex-col overflow-hidden">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium truncate">{output.name}</div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleRemoveOutput(output.id)}
                            className="p-1 text-muted-foreground hover:text-red-500 transition-colors"
                            aria-label="Delete output"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M3 6h18"></path>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path>
                              <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                          </button>
                        </div>
                      </div>
                      {output.description && <div className="text-xs text-muted-foreground truncate">{output.description}</div>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Add Output Button */}
        <EditableHandleDialog
          variant="create"
          label=""
          onSave={handleCreateOutput}
          onCancel={() => {}}
          align="start"
        >
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-3 w-full"
          >
            <Plus className="h-3 w-3 mr-1" /> Add Output
          </Button>
        </EditableHandleDialog>
        
        {data.errorMessage && (
          <div className="mt-2 text-xs text-red-500 bg-red-50 p-2 rounded">
            {data.errorMessage}
          </div>
        )}
      </div>
      
      {/* Default input handle */}
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        className="w-3 h-3 left-[-6px] bg-purple-500 border-2 border-background"
        isConnectable={isConnectable}
      />
      
      {/* Dynamic input handles - positioned along the left side */}
      {inputs.map((input, index) => (
        <Handle
          key={input.id}
          type="target"
          position={Position.Left}
          id={input.id}
          className="w-3 h-3 left-[-6px] bg-purple-500 border-2 border-background"
          style={{
            top: `${Math.max(100, 100 + (index * 30))}px`,
          }}
          data-label={input.name}
          isConnectable={isConnectable}
        />
      ))}
      
      {/* Default output handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        className="w-3 h-3 right-[-6px] bg-purple-500 border-2 border-background"
        isConnectable={isConnectable}
      />
      
      {/* Route-specific output handles for action_router */}
      {data.label === 'Action Router' && (
        <>
          <Handle
            type="source"
            position={Position.Right}
            id="generation"
            className="w-3 h-3 right-[-6px] bg-green-500 border-2 border-background"
            style={{ top: "120px" }}
            data-label="Generation"
            isConnectable={isConnectable}
          />
          <Handle
            type="source"
            position={Position.Right}
            id="execution"
            className="w-3 h-3 right-[-6px] bg-amber-500 border-2 border-background"
            style={{ top: "160px" }}
            data-label="Execution"
            isConnectable={isConnectable}
          />
          <Handle
            type="source"
            position={Position.Right}
            id="help"
            className="w-3 h-3 right-[-6px] bg-purple-500 border-2 border-background"
            style={{ top: "200px" }}
            data-label="Help"
            isConnectable={isConnectable}
          />
        </>
      )}
      
      {/* Dynamic output handles - positioned along the right side */}
      {outputs.map((output, index) => (
        <Handle
          key={output.id}
          type="source"
          position={Position.Right}
          id={output.id}
          className="w-3 h-3 right-[-6px] bg-purple-500 border-2 border-background"
          style={{
            top: `${Math.max(240, 240 + (index * 30))}px`,
          }}
          data-label={output.name}
          isConnectable={isConnectable}
        />
      ))}
    </div>
  );
};

export default TransformNode;
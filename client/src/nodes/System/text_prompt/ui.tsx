/**
 * Text Prompt Node UI Component
 * 
 * This file contains the ReactFlow node component for the Text Prompt node.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Handle, Position, useUpdateNodeInternals, useReactFlow, NodeProps } from 'reactflow';
import { cn } from '@/lib/utils';
import { MessageSquare, Settings, Plus, Copy, Trash2, Bot } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { nanoid } from 'nanoid';
import { EditableHandle, EditableHandleDialog } from '@/components/nodes/handles';
import { TextPromptNodeData } from './definition';

// This component provides a visual submenu for node operations
const NodeHoverMenu = ({ 
  nodeId, 
  nodeData, 
  position,
  onDuplicate, 
  onDelete, 
  onMonkeyAgentModify 
}: { 
  nodeId: string;
  nodeData: any;
  position: { x: number, y: number };
  onDuplicate: () => void;
  onDelete: () => void;
  onMonkeyAgentModify: () => void;
}) => {
  return (
    <div className="absolute z-50 right-0 top-0 translate-x-[calc(100%+4px)] bg-white rounded-md shadow-lg border border-slate-200 p-1 flex flex-col gap-1">
      <Button 
        variant="ghost" 
        size="icon"
        className="h-8 w-8 hover:bg-slate-100"
        onClick={onDuplicate}
        title="Duplicate node"
      >
        <Copy className="h-4 w-4" />
      </Button>
      
      <Button 
        variant="ghost" 
        size="icon"
        className="h-8 w-8 hover:bg-slate-100 text-red-500 hover:text-red-600"
        onClick={onDelete}
        title="Delete node"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
      
      <Button 
        variant="ghost" 
        size="icon"
        className="h-8 w-8 hover:bg-slate-100 text-blue-500"
        onClick={onMonkeyAgentModify}
        title="MonkeyAgent Modify"
      >
        <Bot className="h-4 w-4" />
      </Button>
    </div>
  );
};

// Main component for the Text Prompt node
const TextPromptNodeComponent = ({ 
  id, 
  data, 
  isConnectable = true, 
  selected,
  xPos,
  yPos
}: NodeProps<TextPromptNodeData> & { xPos?: number, yPos?: number }) => {
  const [localPrompt, setLocalPrompt] = useState(data.prompt || data.settings?.prompt || '');
  const [showHoverMenu, setShowHoverMenu] = useState(false);
  const [hoverTimer, setHoverTimer] = useState<NodeJS.Timeout | null>(null);
  const nodeRef = useRef<HTMLDivElement>(null);
  const updateNodeInternals = useUpdateNodeInternals();
  const reactFlowInstance = useReactFlow();
  
  // Function to handle hover start
  const handleHoverStart = () => {
    // Set a timeout to show the menu after hovering for 500ms
    const timer = setTimeout(() => {
      setShowHoverMenu(true);
    }, 500);
    
    setHoverTimer(timer);
  };
  
  // Function to handle hover end
  const handleHoverEnd = () => {
    // Clear the timeout if the user stops hovering before the menu appears
    if (hoverTimer) {
      clearTimeout(hoverTimer);
      setHoverTimer(null);
    }
    setShowHoverMenu(false);
  };
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimer) {
        clearTimeout(hoverTimer);
      }
    };
  }, [hoverTimer]);
  
  // Handle node duplication
  const handleDuplicate = () => {
    // Get the current node's position
    const position = reactFlowInstance.getNode(id)?.position || { x: 0, y: 0 };
    
    // Create offset position for the new node
    const newPosition = { 
      x: position.x + 20, 
      y: position.y + 20 
    };
    
    // Clone the node with a new ID
    const newNode = {
      id: `text_prompt-${Date.now()}`,
      type: 'text_prompt',
      position: newPosition,
      data: { ...data }
    };
    
    // Add the new node to the flow
    reactFlowInstance.addNodes(newNode);
  };
  
  // Handle node deletion
  const handleDelete = () => {
    reactFlowInstance.deleteElements({ nodes: [{ id }] });
  };
  
  // Handle MonkeyAgent modification
  const handleMonkeyAgentModify = () => {
    // Create an event with all the node details
    const position = reactFlowInstance.getNode(id)?.position || { x: 0, y: 0 };
    const nodeDetails = {
      id,
      type: 'text_prompt',
      position,
      data: { ...data }
    };
    
    // Dispatch a custom event that the MonkeyAgentChatOverlay will listen for
    const event = new CustomEvent('monkey-agent-modify-node', {
      detail: { nodeDetails }
    });
    
    window.dispatchEvent(event);
  };
  
  // Update local state when data changes
  useEffect(() => {
    setLocalPrompt(data.prompt || data.settings?.prompt || '');
  }, [data.prompt, data.settings?.prompt]);
  
  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalPrompt(e.target.value);
    // TODO: Update node data with the new prompt text
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
      const newInput = {
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
    <div 
      ref={nodeRef}
      onMouseEnter={handleHoverStart}
      onMouseLeave={handleHoverEnd}
      className="relative"
    >
      {showHoverMenu && (
        <NodeHoverMenu 
          nodeId={id}
          nodeData={data}
          position={reactFlowInstance.getNode(id)?.position || { x: 0, y: 0 }}
          onDuplicate={handleDuplicate}
          onDelete={handleDelete}
          onMonkeyAgentModify={handleMonkeyAgentModify}
        />
      )}
      
      <div 
        className={cn(
          'text-prompt-node relative p-0 rounded-md min-w-[250px] max-w-[350px] bg-background border transition-all shadow-md',
          selected ? 'border-primary ring-2 ring-primary ring-opacity-20' : 'border-border'
        )}
      >
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
                    <div className="w-full flex items-center gap-2 relative px-4 py-2">
                      <div className="flex-1 flex flex-col overflow-hidden">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-medium truncate">{input.name}</div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleRemoveInput(input.id)}
                              className="p-1 text-muted-foreground hover:text-red-500 transition-colors"
                              aria-label="Delete handle"
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
    </div>
  );
};

// Export the component for use in the node registry
export const component = TextPromptNodeComponent;
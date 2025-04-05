import React, { useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Sparkles, Settings, RotateCw, Plus, Minus, Zap } from 'lucide-react';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger 
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

// Types for the dynamic tool handles
export interface Tool {
  id: string;
  name: string;
  description?: string;
}

export interface DynamicHandles {
  tools: Tool[];
}

// Types for the node data
export interface GenerateTextNodeData {
  label?: string;
  description?: string;
  status?: 'idle' | 'processing' | 'complete' | 'error';
  errorMessage?: string;
  systemInstruction?: string;
  promptTemplate?: string;
  config?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  };
  dynamicHandles?: DynamicHandles;
  onSettingsClick?: () => void;
  onExecute?: (updatedData: GenerateTextNodeData) => void;
  setNodeState?: (state: { status?: string; errorMessage?: string }) => void;
}

// Props interface
export interface GenerateTextNodeProps extends NodeProps {
  data: GenerateTextNodeData;
  onModelChange?: (model: string) => void;
  onCreateTool?: () => boolean;
  onRemoveTool?: (id: string) => boolean;
  onUpdateTool?: (id: string, name: string, description?: string) => boolean;
  onDeleteNode?: () => void;
}

const GenerateTextNode: React.FC<GenerateTextNodeProps> = ({ 
  data, 
  id,
  selected,
  onModelChange,
  onCreateTool,
  onRemoveTool,
  onUpdateTool,
  onDeleteNode
}) => {
  const [systemInstruction, setSystemInstruction] = useState(data.systemInstruction || '');
  const [promptTemplate, setPromptTemplate] = useState(data.promptTemplate || '');
  const model = data.config?.model || 'claude-3-opus-20240229';
  const temperature = data.config?.temperature || 0.7;
  const maxTokens = data.config?.maxTokens || 1024;
  const [isLoading, setIsLoading] = useState(false);
  
  // Initialize dynamic tools if they don't exist
  const tools = data.dynamicHandles?.tools || [];
  
  const getStatusBadge = () => {
    if (isLoading || data.status === 'processing') {
      return <Badge variant="outline" className="bg-blue-500 text-white ml-2">Processing</Badge>;
    }
    switch (data.status) {
      case 'complete':
        return <Badge variant="outline" className="bg-green-500 text-white ml-2">Complete</Badge>;
      case 'error':
        return <Badge variant="destructive" className="ml-2">Error</Badge>;
      default:
        return null;
    }
  };

  const handleSystemInstructionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setSystemInstruction(e.target.value);
    // Save to node data through executor in FlowEditor
  };

  const handlePromptTemplateChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPromptTemplate(e.target.value);
    // Save to node data through executor in FlowEditor
  };

  const handleModelChange = (value: string) => {
    if (onModelChange) {
      onModelChange(value);
    }
  };

  // Create a tool directly if the callback is not provided
  const handleAddTool = () => {
    setIsLoading(true);
    
    try {
      if (onCreateTool) {
        const result = onCreateTool();
        setIsLoading(false);
        return result;
      } else {
        // If no callback provided, create a default tool structure
        const newTool = {
          id: `tool-${Date.now()}`,
          name: `Tool ${tools.length + 1}`,
          description: `Description for Tool ${tools.length + 1}`
        };
        
        // Update node data with the new tool
        if (data.dynamicHandles) {
          data.dynamicHandles.tools = [...tools, newTool];
        } else {
          data.dynamicHandles = { tools: [newTool] };
        }
        
        setIsLoading(false);
        return true;
      }
    } catch (error) {
      console.error("Error adding tool:", error);
      setIsLoading(false);
      return false;
    }
  };

  // Handle node content click to prevent opening settings drawer 
  const handleContentClick = (e: React.MouseEvent) => {
    // Stop propagation to prevent the parent node click handler from firing
    e.stopPropagation();
  };

  return (
    <div 
      className={cn(
        'generate-text-node relative p-0 rounded-md min-w-[300px] max-w-[380px] bg-background border transition-all shadow-md',
        selected ? 'border-primary ring-2 ring-primary ring-opacity-20' : 'border-border'
      )}
    >
      {/* Header */}
      <div className="p-3 border-b flex items-center justify-between">
        <div className="font-medium text-sm flex items-center">
          <Sparkles className="h-4 w-4 mr-2 text-indigo-500" />
          <span>{data.label || 'Generate Text'}</span>
          {getStatusBadge()}
        </div>
        <button 
          onClick={(e) => {
            e.stopPropagation(); // Prevent node click
            // Only call the function if it exists
            if (typeof data.onSettingsClick === 'function') {
              data.onSettingsClick();
            }
          }}
          className="ml-auto hover:bg-muted p-1 rounded-sm"
          aria-label="Open settings"
        >
          <Settings className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>
      
      {/* Body - clicking here won't open settings */}
      <div 
        className="p-3 space-y-3" 
        onClick={handleContentClick}
      >
        {data.description && (
          <p className="text-sm text-muted-foreground">{data.description}</p>
        )}
        
        <Accordion type="single" collapsible defaultValue="model" className="w-full">
          <AccordionItem value="model" className="border-none">
            <AccordionTrigger className="py-2 text-sm hover:no-underline">
              Model Settings
            </AccordionTrigger>
            <AccordionContent className="pt-1">
              <div className="space-y-2">
                <div>
                  <label className="text-xs font-medium block mb-1">Model</label>
                  <Select value={model} onValueChange={handleModelChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select model" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="claude-3-opus-20240229">Claude 3 Opus</SelectItem>
                      <SelectItem value="claude-3-sonnet-20240229">Claude 3 Sonnet</SelectItem>
                      <SelectItem value="claude-3-haiku-20240229">Claude 3 Haiku</SelectItem>
                      <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                      <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                      <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                      <SelectItem value="deepseek-chat">DeepSeek Chat</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-medium block mb-1">Temperature</label>
                    <Input 
                      type="number" 
                      min="0" 
                      max="1" 
                      step="0.1" 
                      defaultValue={temperature.toString()} 
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium block mb-1">Max Tokens</label>
                    <Input 
                      type="number" 
                      min="1" 
                      defaultValue={maxTokens.toString()} 
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="instructions" className="border-none">
            <AccordionTrigger className="py-2 text-sm hover:no-underline">
              System Instructions
            </AccordionTrigger>
            <AccordionContent className="pt-1">
              <Textarea
                value={systemInstruction}
                onChange={handleSystemInstructionChange}
                placeholder="Enter system instructions here..."
                className="min-h-[100px] text-sm resize-y"
              />
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="prompt" className="border-none">
            <AccordionTrigger className="py-2 text-sm hover:no-underline">
              Prompt Template
            </AccordionTrigger>
            <AccordionContent className="pt-1">
              <Textarea
                value={promptTemplate}
                onChange={handlePromptTemplateChange}
                placeholder="Enter your prompt template here. Use {{variable}} for dynamic content."
                className="min-h-[100px] text-sm resize-y"
              />
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="tools" className="border-none">
            <AccordionTrigger className="py-2 text-sm hover:no-underline">
              Tool Inputs
            </AccordionTrigger>
            <AccordionContent className="pt-1">
              <div className="space-y-3">
                {data.dynamicHandles?.tools.map((tool) => (
                  <div key={tool.id} className="space-y-2 p-2 bg-muted/30 rounded-md">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium">{tool.name}</label>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 w-6 p-0" 
                        onClick={() => onRemoveTool && onRemoveTool(tool.id)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                    </div>
                    <Input 
                      defaultValue={tool.name} 
                      className="text-xs" 
                      placeholder="Tool name"
                      onChange={(e) => onUpdateTool && onUpdateTool(tool.id, e.target.value, tool.description)}
                    />
                    <Input 
                      defaultValue={tool.description} 
                      className="text-xs" 
                      placeholder="Tool description (optional)"
                      onChange={(e) => onUpdateTool && onUpdateTool(tool.id, tool.name, e.target.value)}
                    />
                  </div>
                ))}
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full" 
                  onClick={handleAddTool}
                >
                  <Plus className="h-3 w-3 mr-1" /> Add Tool
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        
        {data.errorMessage && (
          <div className="mt-2 text-xs text-red-500 bg-red-50 p-2 rounded">
            {data.errorMessage}
          </div>
        )}
        
        {/* Run button */}
        <Button 
          variant="default" 
          size="sm" 
          className="w-full mt-2"
          disabled={data.status === 'processing' || isLoading}
          onClick={(e) => {
            e.stopPropagation();
            if (typeof data.onExecute === 'function') {
              // Update the node data with the latest values before executing
              const updatedNodeData: GenerateTextNodeData = {
                ...data,
                systemInstruction,
                promptTemplate,
                status: 'processing' as const
              };
              data.onExecute(updatedNodeData);
            }
          }}
        >
          {data.status === 'processing' || isLoading ? (
            <>
              <RotateCw className="h-3 w-3 mr-1 animate-spin" /> 
              Processing...
            </>
          ) : (
            <>
              <Zap className="h-3 w-3 mr-1" />
              Generate Text
            </>
          )}
        </Button>
      </div>
      
      {/* Input handle - Text Input */}
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        className="w-3 h-3 left-[-6px] !bg-indigo-500 border-2 border-background"
      />
      
      {/* Tool input handles - positioned dynamically based on the node height */}
      {data.dynamicHandles?.tools.map((tool, index) => (
        <Handle
          key={tool.id}
          type="target"
          position={Position.Left}
          id={`tool-${tool.id}`}
          className={`tool-handle tool-handle-${index} w-3 h-3 left-[-6px] !bg-amber-500 border-2 border-background`}
          style={{ 
            // Distribute tool handles evenly on the left side
            top: `${140 + (index * 30)}px`,
          }}
          // The label is added via CSS in the component's class
          data-label={tool.name}
        />
      ))}
      
      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        className="w-3 h-3 right-[-6px] !bg-indigo-500 border-2 border-background"
      />
    </div>
  );
};

export default GenerateTextNode;
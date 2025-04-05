"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Handle,
  Position,
  useUpdateNodeInternals,
  NodeProps as ReactFlowNodeProps,
} from "reactflow";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Edit, Sparkles, Plus, X, Copy, 
  Trash2, Wand2, Zap, RotateCw,
  Settings 
} from "lucide-react";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { EditableHandleDialog } from "./editable-handle";

interface TemplateTags {
  id: string;
  name: string;
  description?: string;
}

export interface PromptCrafterNodeData {
  label?: string;
  description?: string;
  status?: 'idle' | 'processing' | 'success' | 'error';
  errorMessage?: string;
  config?: {
    template?: string;
  };
  dynamicHandles?: {
    "template-tags": TemplateTags[];
  };
}

// We need to make our own simplified version of the NodeProps interface
// to avoid TypeScript errors with the ReactFlow NodeProps type
export interface PromptCrafterNodeProps {
  id: string;
  data: PromptCrafterNodeData;
  selected: boolean; 
  onPromptTextChange?: (text: string) => void;
  onCreateInput?: (name: string, description?: string) => boolean;
  onRemoveInput?: (id: string) => boolean;
  onUpdateInputName?: (id: string, name: string, description?: string) => boolean;
  onDeleteNode?: () => void;
}

export function PromptCrafterNode({
  id,
  data,
  selected,
  onPromptTextChange,
  onCreateInput,
  onRemoveInput,
  onUpdateInputName,
  onDeleteNode,
}: PromptCrafterNodeProps) {
  const updateNodeInternals = useUpdateNodeInternals();
  const [promptText, setPromptText] = useState(data.config?.template || "");
  const [newTagName, setNewTagName] = useState("");

  // Extract template tags - could be dynamically generated from the template
  const templateTags = data.dynamicHandles?.["template-tags"] || [];
  
  // Update local state when data changes
  useEffect(() => {
    if (data.config?.template) {
      setPromptText(data.config.template);
    }
  }, [data.config?.template]);
  
  // Get template variables from the prompt text
  const extractTemplateVarsFromText = useCallback((text: string) => {
    const regex = /\{\{([^}]+)\}\}/g;
    const matches: string[] = [];
    let match;
    while ((match = regex.exec(text)) !== null) {
      matches.push(match[1].trim());
    }
    // Filter duplicates manually instead of using Set
    const uniqueMatches: string[] = [];
    matches.forEach((item) => {
      if (!uniqueMatches.includes(item)) {
        uniqueMatches.push(item);
      }
    });
    return uniqueMatches;
  }, []);

  // Handle prompt text changes
  const handlePromptChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setPromptText(newText);
    
    if (onPromptTextChange) {
      onPromptTextChange(newText);
    }
  }, [onPromptTextChange]);
  
  // Create a new input tag
  const handleCreateInput = useCallback((name: string, description?: string) => {
    if (onCreateInput) {
      const result = onCreateInput(name, description);
      if (result) {
        updateNodeInternals(id);
      }
      return result;
    }
    return false;
  }, [onCreateInput, id, updateNodeInternals]);
  
  // Remove an input tag
  const handleRemoveInput = useCallback((tagId: string) => {
    if (onRemoveInput) {
      const result = onRemoveInput(tagId);
      if (result) {
        updateNodeInternals(id);
      }
      return result;
    }
    return false;
  }, [onRemoveInput, id, updateNodeInternals]);
  
  // Update an input tag
  const handleUpdateInputName = useCallback((tagId: string, name: string, description?: string) => {
    if (onUpdateInputName) {
      const result = onUpdateInputName(tagId, name, description);
      if (result) {
        updateNodeInternals(id);
      }
      return result;
    }
    return false;
  }, [onUpdateInputName, id, updateNodeInternals]);
  
  // Add a template variable to the text
  const addTemplateVariable = useCallback((variableName: string) => {
    const updatedText = `${promptText}{{${variableName}}}`;
    setPromptText(updatedText);
    if (onPromptTextChange) {
      onPromptTextChange(updatedText);
    }
  }, [promptText, onPromptTextChange]);
  
  // Get status badge
  const getStatusBadge = () => {
    switch (data.status) {
      case 'processing':
        return <Badge variant="outline" className="bg-blue-500 text-white ml-2">Processing</Badge>;
      case 'success':
        return <Badge variant="outline" className="bg-green-500 text-white ml-2">Success</Badge>;
      case 'error':
        return <Badge variant="destructive" className="ml-2">Error</Badge>;
      default:
        return null;
    }
  };

  return (
    <div 
      className={cn(
        "prompt-crafter-node relative p-0 rounded-md min-w-[300px] max-w-[380px] bg-background border transition-all shadow-md",
        selected ? 'border-primary ring-2 ring-primary ring-opacity-20' : 'border-border'
      )}
    >
      {/* Header */}
      <div className="p-3 border-b flex items-center justify-between">
        <div className="font-medium text-sm flex items-center">
          <Sparkles className="h-4 w-4 mr-2 text-yellow-500" />
          <span>{data.label || 'Prompt Crafter'}</span>
          {getStatusBadge()}
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-6 w-6 p-0 rounded-sm"
          onClick={() => onDeleteNode && onDeleteNode()}
        >
          <Settings className="h-4 w-4 text-muted-foreground" />
        </Button>
      </div>
      
      {/* Body */}
      <div className="p-3 space-y-3">
        {data.description && (
          <p className="text-sm text-muted-foreground">{data.description}</p>
        )}
        
        <Accordion type="single" collapsible defaultValue="template" className="w-full">
          <AccordionItem value="template" className="border-none">
            <AccordionTrigger className="py-2 hover:no-underline">
              <span className="text-sm font-medium">Template</span>
            </AccordionTrigger>
            <AccordionContent>
              <Textarea
                value={promptText}
                onChange={handlePromptChange}
                className="min-h-[120px] text-sm font-mono resize-y"
                placeholder="Enter your prompt template with {{variables}}"
              />
              <div className="text-xs text-muted-foreground mt-1">
                Use double curly braces for variables: <code>{"{{variableName}}"}</code>
              </div>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="variables" className="border-none pt-2">
            <AccordionTrigger className="py-2 hover:no-underline">
              <span className="text-sm font-medium">Variables</span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                {templateTags.map((tag) => (
                  <div key={tag.id} className="flex items-center justify-between p-2 bg-muted/40 rounded-sm">
                    <span className="text-xs font-medium">{tag.name}</span>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => addTemplateVariable(tag.name)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-destructive"
                        onClick={() => handleRemoveInput(tag.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}

                {/* Add Variable UI */}
                <EditableHandleDialog
                  variant="create"
                  label="Add Template Variable"
                  onSave={handleCreateInput}
                  onCancel={() => {}}
                  align="center"
                >
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                  >
                    <Plus className="h-3 w-3 mr-1" /> Add Variable
                  </Button>
                </EditableHandleDialog>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        
        {data.errorMessage && (
          <div className="mt-2 text-xs text-red-500 bg-red-50 p-2 rounded">
            {data.errorMessage}
          </div>
        )}
      </div>
      
      {/* Main input handle */}
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        className="w-3 h-3 left-[-6px] bg-blue-500 border-2 border-background"
      />
      
      {/* Dynamic variable input handles - positioned along the left side */}
      {templateTags.map((tag, index) => (
        <Handle
          key={tag.id}
          type="target"
          position={Position.Left}
          id={tag.id}
          className="w-3 h-3 left-[-6px] bg-yellow-500 border-2 border-background"
          style={{
            top: `${Math.max(100, 100 + (index * 30))}px`,
          }}
          data-label={tag.name}
        />
      ))}
      
      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        className="w-3 h-3 right-[-6px] bg-blue-500 border-2 border-background"
      />
    </div>
  );
}
import { useState, useCallback, useEffect } from "react";
import { Handle, Position, useUpdateNodeInternals, NodeProps } from 'reactflow';
import { v4 as uuidv4 } from 'uuid';
import { NodeData } from '../NodeItem';
import { cn } from "@/lib/utils";
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
import { EditableHandleDialog } from "../../ui/flow/editable-handle";
import DynamicIcon from '../DynamicIcon';

const PromptCrafterNode = ({ data, selected, id }: NodeProps<NodeData>) => {
  const updateNodeInternals = useUpdateNodeInternals();
  const [promptText, setPromptText] = useState<string>(data.promptTemplate || `You are a helpful assistant.
{{system_message}}
User: {{input}}
Assistant:`);

  // Set up template tags based on the current template variables
  const [templateTags, setTemplateTags] = useState<Array<{id: string, name: string, description?: string}>>([
    { id: "system_message", name: "system_message", description: "System instructions for the AI" },
    { id: "input", name: "input", description: "User input to process" }
  ]);

  // Update template tags when the prompt changes
  useEffect(() => {
    extractTemplateVarsFromText(promptText);
  }, [promptText]);

  // Extract template variables from the prompt text
  const extractTemplateVarsFromText = (text: string) => {
    const regex = /\{\{([^}]+)\}\}/g;
    const matches: string[] = [];
    let match;
    while ((match = regex.exec(text)) !== null) {
      matches.push(match[1].trim());
    }
    
    // Filter duplicates manually
    const uniqueMatches: string[] = [];
    matches.forEach((item) => {
      if (!uniqueMatches.includes(item)) {
        uniqueMatches.push(item);
      }
    });
    
    // Create template tags from matches if they don't already exist
    const updatedTags = [...templateTags];
    uniqueMatches.forEach((name) => {
      if (!templateTags.find(tag => tag.name === name)) {
        updatedTags.push({ id: uuidv4(), name, description: `Variable for ${name}` });
      }
    });
    
    // Update tags
    if (JSON.stringify(updatedTags) !== JSON.stringify(templateTags)) {
      setTemplateTags(updatedTags);
      updateNodeInternals(id);
    }
  };

  // Handle prompt text changes
  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setPromptText(newText);
    
    // Update the node data with new template
    if (data.onChange) {
      data.onChange({ ...data, promptTemplate: newText });
    }
  };
  
  // Create a new input tag
  const handleCreateInput = (name: string, description?: string) => {
    if (!name) return false;
    
    // Check if tag already exists
    if (templateTags.find(tag => tag.name === name)) return false;
    
    // Add new tag
    const newTag = { id: uuidv4(), name, description };
    const updatedTags = [...templateTags, newTag];
    setTemplateTags(updatedTags);
    updateNodeInternals(id);
    return true;
  };
  
  // Remove an input tag
  const handleRemoveInput = (tagId: string) => {
    const updatedTags = templateTags.filter(tag => tag.id !== tagId);
    setTemplateTags(updatedTags);
    updateNodeInternals(id);
    return true;
  };
  
  // Update an input tag
  const handleUpdateInputName = (tagId: string, name: string, description?: string) => {
    const updatedTags = templateTags.map(tag => 
      tag.id === tagId ? { ...tag, name, description: description || tag.description } : tag
    );
    setTemplateTags(updatedTags);
    updateNodeInternals(id);
    return true;
  };
  
  // Add a template variable to the text
  const addTemplateVariable = (variableName: string) => {
    const updatedText = `${promptText}{{${variableName}}}`;
    setPromptText(updatedText);
    
    // Update the node data
    if (data.onChange) {
      data.onChange({ ...data, promptTemplate: updatedText });
    }
  };

  // Get status badge
  const getStatusBadge = () => {
    const status = data.status || 'idle';
    switch (status) {
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
          onClick={() => data.onDelete && data.onDelete(id)}
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
            // Start at 30% of node height and space by 30px
            top: `${Math.max(30, 60 + (index * 30))}px`,
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
};

export default PromptCrafterNode;
/**
 * Example Enhanced Node
 * 
 * This is an example of how to use the Enhanced Default Node pattern
 * to create a node with settings drawer functionality.
 */

import React, { useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { FileText, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import EnhancedDefaultNode from './Default/ui';

interface ExampleNodeData {
  label: string;
  description?: string;
  inputText?: string;
  apiKey?: string;
  model?: string;
  maxTokens?: number;
  [key: string]: any;
}

export const ExampleEnhancedNode: React.FC<NodeProps<ExampleNodeData>> = ({ 
  data, 
  id, 
  selected,
  isConnectable 
}) => {
  // Local state for the text input
  const [localText, setLocalText] = useState(data.inputText || '');
  
  // Handle text change
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalText(e.target.value);
    
    // If there's an onChange handler in the data, call it
    if (data.onChange) {
      data.onChange({
        ...data,
        inputText: e.target.value
      });
    }
  };
  
  // Define settings for this node
  const nodeSettings = {
    title: "Example Node Settings",
    fields: [
      {
        key: "apiKey",
        label: "API Key",
        type: "text" as const,
        description: "Enter your API key for the service"
      },
      {
        key: "model",
        label: "Model",
        type: "select" as const,
        description: "Select the model to use",
        options: [
          { label: "Model A", value: "model-a" },
          { label: "Model B", value: "model-b" },
          { label: "Model C", value: "model-c" }
        ]
      },
      {
        key: "maxTokens",
        label: "Max Tokens",
        type: "slider" as const,
        description: "Maximum number of tokens to generate",
        min: 10,
        max: 1000,
        step: 10
      }
    ]
  };
  
  // Prepare enhanced data with settings
  const enhancedData = {
    ...data,
    icon: <FileText className="text-blue-500" />,
    settings: nodeSettings,
    // Include callback handlers
    onChange: (updatedData: any) => {
      console.log('Node data updated:', updatedData);
      // In a real implementation, this would update the node's data in the flow
    }
  };
  
  // The content of our node
  const nodeContent = (
    <>
      <div className="space-y-2">
        <Textarea
          value={localText}
          onChange={handleTextChange}
          placeholder="Enter text here..."
          className="min-h-[80px] text-sm"
        />
        
        <Button 
          size="sm" 
          className="w-full flex items-center gap-1"
          variant="outline"
        >
          <Send className="h-3 w-3" />
          <span>Process</span>
        </Button>
      </div>
      
      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        style={{ top: 60 }}
        isConnectable={isConnectable}
      />
      
      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        style={{ top: 60 }}
        isConnectable={isConnectable}
      />
    </>
  );
  
  // Return the enhanced node
  return (
    <EnhancedDefaultNode
      id={id}
      data={enhancedData}
      selected={selected}
    >
      {nodeContent}
    </EnhancedDefaultNode>
  );
};

export default ExampleEnhancedNode;
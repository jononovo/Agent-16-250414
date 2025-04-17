/**
 * Text Input Node UI Component
 * 
 * This file contains the React component used to render the text input node
 * in the workflow editor.
 */

import React, { useState } from 'react';
import { Handle, Position } from 'reactflow';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Type } from 'lucide-react';
import { EnhancedNode } from '@/components/nodes/common/EnhancedNode';

// Node interface
interface TextInputNodeData {
  inputText: string;
  label: string;
  placeholder: string;
  required?: boolean;
  onChange?: (data: any) => void;
  [key: string]: any;
}

// Default data for the node
export const defaultData: TextInputNodeData = {
  inputText: '',
  label: 'Input Text',
  placeholder: 'Enter text here...',
  required: false
};

// Validator for the node data
export const validator = (data: TextInputNodeData) => {
  const errors = [];
  
  if (!data.inputText && data.required) {
    errors.push('Input text is required');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

// React component for the node
export const component = ({ data, isConnectable, selected, id }: any) => {
  const [localText, setLocalText] = useState(data.inputText || '');
  
  // Update the node data when the input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalText(newValue);
    
    // Update the node data
    if (data && typeof data.onChange === 'function') {
      data.onChange({
        ...data,
        inputText: newValue
      });
    }
  };
  
  // Enhanced node data with settings
  const enhancedData = {
    ...data,
    icon: <Type className="h-4 w-4 text-indigo-600" />,
    description: "Provides text input to the workflow",
    category: "input",
    settings: {
      title: "Text Input Settings",
      fields: [
        {
          key: "label",
          label: "Label",
          type: "text" as const,
          description: "Label displayed above the input field"
        },
        {
          key: "placeholder",
          label: "Placeholder",
          type: "text" as const,
          description: "Placeholder text shown when input is empty"
        },
        {
          key: "required",
          label: "Required",
          type: "checkbox" as const,
          description: "Whether this input must have a value"
        }
      ]
    }
  };
  
  // Node content
  const nodeContent = (
    <>
      <div className="flex flex-col gap-2">
        <Label>{data.label || 'Input Text'}</Label>
        <Input
          value={localText}
          onChange={handleChange}
          placeholder={data.placeholder || 'Enter text here...'}
          className="min-w-[200px]"
        />
      </div>
      
      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="output"
        isConnectable={isConnectable}
        className="w-2 h-2 bg-blue-500"
      />
    </>
  );
  
  // Return the enhanced node with our content
  return (
    <EnhancedNode
      id={id}
      data={enhancedData}
      selected={selected}
    >
      {nodeContent}
    </EnhancedNode>
  );
};
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

// Default data for the node
export const defaultData = {
  inputText: '',
  label: 'Input Text',
  placeholder: 'Enter text here...'
};

// Validator for the node data
export const validator = (data: any) => {
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
export const component = ({ data, isConnectable }: any) => {
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
  
  return (
    <div className="p-3 rounded-md bg-background border shadow-sm">
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
    </div>
  );
};
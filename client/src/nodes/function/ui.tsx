/**
 * Function Node UI Component
 * 
 * This file contains the React component used to render the function node
 * in the workflow editor.
 */

import React, { useState } from 'react';
import { Handle, Position } from 'reactflow';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';

// Default data for the node
export const defaultData = {
  code: 'function process(data) {\n  // Your code here\n  return data;\n}\n\nreturn process(inputs.data);',
  timeout: 5000
};

// Validator for the node data
export const validator = (data: any) => {
  const errors = [];
  
  if (!data.code || data.code.trim() === '') {
    errors.push('Code is required');
  }
  
  if (data.timeout && (isNaN(data.timeout) || data.timeout < 100)) {
    errors.push('Timeout must be a number greater than 100ms');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

// React component for the node
export const component = ({ data, isConnectable }: any) => {
  const [localCode, setLocalCode] = useState(data.code || defaultData.code);
  const [localTimeout, setLocalTimeout] = useState(data.timeout || defaultData.timeout);
  
  // Update the node data when values change
  const updateNodeData = (updates: Record<string, any>) => {
    if (data && typeof data.onChange === 'function') {
      data.onChange({
        ...data,
        ...updates
      });
    }
  };
  
  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setLocalCode(newValue);
    updateNodeData({ code: newValue });
  };
  
  const handleTimeoutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value, 10);
    setLocalTimeout(newValue);
    updateNodeData({ timeout: newValue });
  };
  
  return (
    <div className="p-3 rounded-md bg-background border shadow-sm min-w-[320px]">
      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Top}
        id="data"
        isConnectable={isConnectable}
        className="w-2 h-2 bg-blue-500"
      />
      
      <div className="space-y-3">
        <div>
          <Label htmlFor="code">Function Code</Label>
          <Textarea
            id="code"
            value={localCode}
            onChange={handleCodeChange}
            className="mt-1 font-mono text-sm"
            rows={10}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Write JavaScript code. Use 'inputs' to access input data.
          </p>
        </div>
        
        <div>
          <Label htmlFor="timeout">Timeout (ms)</Label>
          <Input
            id="timeout"
            type="number"
            value={localTimeout}
            onChange={handleTimeoutChange}
            className="mt-1"
            min={100}
            step={100}
          />
        </div>
      </div>
      
      {/* Output handles */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="result"
        isConnectable={isConnectable}
        className="w-2 h-2 bg-green-500 left-[30%]"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="error"
        isConnectable={isConnectable}
        className="w-2 h-2 bg-red-500 left-[70%]"
      />
    </div>
  );
};
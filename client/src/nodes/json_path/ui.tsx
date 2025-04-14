/**
 * JSON Path Node UI Component
 * 
 * This file contains the React component used to render the JSON Path node
 * in the workflow editor.
 */

import React, { useState } from 'react';
import { Handle, Position } from 'reactflow';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { JSONPathNodeData } from './executor';

// Default data for the node
export const defaultData: JSONPathNodeData = {
  path: '$.data',
  returnFirst: false,
  defaultValue: ''
};

// Validator for the node data
export const validator = (data: JSONPathNodeData) => {
  const errors = [];
  
  if (!data.path || data.path.trim() === '') {
    errors.push('JSONPath is required');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

// React component for the node
export const component = ({ data, isConnectable }: any) => {
  const [path, setPath] = useState(data.path || defaultData.path);
  const [returnFirst, setReturnFirst] = useState(data.returnFirst || defaultData.returnFirst);
  const [defaultValue, setDefaultValue] = useState(data.defaultValue || defaultData.defaultValue);
  
  // Update the node data when values change
  const updateNodeData = (updates: Partial<JSONPathNodeData>) => {
    if (data && typeof data.onChange === 'function') {
      data.onChange({
        ...data,
        ...updates
      });
    }
  };
  
  const handlePathChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setPath(newValue);
    updateNodeData({ path: newValue });
  };
  
  const handleReturnFirstChange = (checked: boolean) => {
    setReturnFirst(checked);
    updateNodeData({ returnFirst: checked });
  };
  
  const handleDefaultValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setDefaultValue(newValue);
    updateNodeData({ defaultValue: newValue });
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
          <Label htmlFor="path">JSONPath</Label>
          <Input
            id="path"
            value={path}
            onChange={handlePathChange}
            className="mt-1 font-mono text-sm"
            placeholder="$.data.items[0].name"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Use JSONPath to extract data, e.g., $.data.users[0].name
          </p>
        </div>
        
        <div>
          <Label htmlFor="defaultValue">Default Value</Label>
          <Input
            id="defaultValue"
            value={defaultValue}
            onChange={handleDefaultValueChange}
            className="mt-1"
            placeholder="Value to return if no matches found"
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch
            id="returnFirst"
            checked={returnFirst}
            onCheckedChange={handleReturnFirstChange}
          />
          <Label htmlFor="returnFirst">Return only first match from array results</Label>
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
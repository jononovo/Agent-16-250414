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

// Default data for the node
export const defaultData = {
  path: '$.data',
  defaultValue: '',
  multiple: false
};

// Validator for the node data
export const validator = (data: any) => {
  const errors = [];
  
  if (!data.path || data.path.trim() === '') {
    errors.push('JSONPath expression is required');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

// React component for the node
export const component = ({ data, isConnectable }: any) => {
  const [localPath, setLocalPath] = useState(data.path || defaultData.path);
  const [localDefaultValue, setLocalDefaultValue] = useState(data.defaultValue || defaultData.defaultValue);
  const [localMultiple, setLocalMultiple] = useState(data.multiple || defaultData.multiple);
  
  // Update the node data when values change
  const updateNodeData = (updates: Record<string, any>) => {
    if (data && typeof data.onChange === 'function') {
      data.onChange({
        ...data,
        ...updates
      });
    }
  };
  
  const handlePathChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalPath(newValue);
    updateNodeData({ path: newValue });
  };
  
  const handleDefaultValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalDefaultValue(newValue);
    updateNodeData({ defaultValue: newValue });
  };
  
  const handleMultipleChange = (checked: boolean) => {
    setLocalMultiple(checked);
    updateNodeData({ multiple: checked });
  };
  
  return (
    <div className="p-3 rounded-md bg-background border shadow-sm min-w-[320px]">
      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Top}
        id="json"
        isConnectable={isConnectable}
        className="w-2 h-2 bg-blue-500"
      />
      
      <div className="space-y-3">
        <div>
          <Label htmlFor="path">JSONPath Expression</Label>
          <Input
            id="path"
            value={localPath}
            onChange={handlePathChange}
            className="mt-1"
            placeholder="$.data.items[0].name"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Use $ to reference the root object
          </p>
        </div>
        
        <div>
          <Label htmlFor="defaultValue">Default Value</Label>
          <Input
            id="defaultValue"
            value={localDefaultValue}
            onChange={handleDefaultValueChange}
            className="mt-1"
            placeholder="Value to use if path not found"
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch
            id="multiple"
            checked={localMultiple}
            onCheckedChange={handleMultipleChange}
          />
          <Label htmlFor="multiple">Return multiple results</Label>
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
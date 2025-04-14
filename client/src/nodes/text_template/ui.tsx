/**
 * Text Template Node UI Component
 * 
 * This file contains the React component used to render the text template node
 * in the workflow editor.
 */

import React, { useState } from 'react';
import { Handle, Position } from 'reactflow';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';

// Default data for the node
export const defaultData = {
  template: 'Hello, {{name}}!',
  escapeHTML: false,
  fallbackValue: ''
};

// Validator for the node data
export const validator = (data: any) => {
  const errors = [];
  
  if (!data.template || data.template.trim() === '') {
    errors.push('Template is required');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

// React component for the node
export const component = ({ data, isConnectable }: any) => {
  const [localTemplate, setLocalTemplate] = useState(data.template || defaultData.template);
  const [localEscapeHTML, setLocalEscapeHTML] = useState(data.escapeHTML || defaultData.escapeHTML);
  const [localFallbackValue, setLocalFallbackValue] = useState(data.fallbackValue || defaultData.fallbackValue);
  
  // Update the node data when values change
  const updateNodeData = (updates: Record<string, any>) => {
    if (data && typeof data.onChange === 'function') {
      data.onChange({
        ...data,
        ...updates
      });
    }
  };
  
  const handleTemplateChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setLocalTemplate(newValue);
    updateNodeData({ template: newValue });
  };
  
  const handleEscapeHTMLChange = (checked: boolean) => {
    setLocalEscapeHTML(checked);
    updateNodeData({ escapeHTML: checked });
  };
  
  const handleFallbackValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalFallbackValue(newValue);
    updateNodeData({ fallbackValue: newValue });
  };
  
  return (
    <div className="p-3 rounded-md bg-background border shadow-sm min-w-[320px]">
      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Top}
        id="variables"
        isConnectable={isConnectable}
        className="w-2 h-2 bg-blue-500"
      />
      
      <div className="space-y-3">
        <div>
          <Label htmlFor="template">Template</Label>
          <Textarea
            id="template"
            value={localTemplate}
            onChange={handleTemplateChange}
            className="mt-1"
            rows={4}
            placeholder="Hello, {{name}}!"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Use {{variable}} syntax to insert variables
          </p>
        </div>
        
        <div>
          <Label htmlFor="fallbackValue">Fallback Value</Label>
          <Input
            id="fallbackValue"
            value={localFallbackValue}
            onChange={handleFallbackValueChange}
            className="mt-1"
            placeholder="Value to use when variable is missing"
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch
            id="escapeHTML"
            checked={localEscapeHTML}
            onCheckedChange={handleEscapeHTMLChange}
          />
          <Label htmlFor="escapeHTML">Escape HTML in variables</Label>
        </div>
      </div>
      
      {/* Output handles */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="text"
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
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { FunctionNodeData } from './executor';

// Default data for the node
export const defaultData: FunctionNodeData = {
  functionBody: 'return data;',
  timeout: 5000
};

// Validator for the node data
export const validator = (data: FunctionNodeData) => {
  const errors = [];
  
  if (!data.functionBody || data.functionBody.trim() === '') {
    errors.push('Function body is required');
  }
  
  if (!data.timeout || data.timeout < 100) {
    errors.push('Timeout must be at least 100ms');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

// React component for the node
export const component = ({ data, isConnectable }: any) => {
  const [functionBody, setFunctionBody] = useState(data.functionBody || defaultData.functionBody);
  const [timeout, setTimeout] = useState(data.timeout || defaultData.timeout);
  
  // Update the node data when values change
  const updateNodeData = (updates: Partial<FunctionNodeData>) => {
    if (data && typeof data.onChange === 'function') {
      data.onChange({
        ...data,
        ...updates
      });
    }
  };
  
  const handleFunctionBodyChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setFunctionBody(newValue);
    updateNodeData({ functionBody: newValue });
  };
  
  const handleTimeoutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value, 10);
    setTimeout(isNaN(newValue) ? defaultData.timeout : newValue);
    updateNodeData({ timeout: isNaN(newValue) ? defaultData.timeout : newValue });
  };
  
  const getExampleTemplate = () => {
    return `// Input data is available as 'data'
// Additional context is available as 'context'
  
// Example: Transform an array of items
if (Array.isArray(data.items)) {
  return {
    processedItems: data.items.map(item => ({
      ...item,
      processed: true,
      timestamp: context.timestamp
    }))
  };
}

// Default fallback
return data;`;
  };
  
  return (
    <div className="p-3 rounded-md bg-background border shadow-sm min-w-[400px]">
      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Top}
        id="data"
        isConnectable={isConnectable}
        className="w-2 h-2 bg-blue-500"
      />
      
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Label htmlFor="functionBody">Function Code</Label>
            <Badge variant="outline" className="text-xs">JavaScript</Badge>
          </div>
          
          <div className="flex items-center gap-2">
            <Label htmlFor="timeout">Timeout (ms)</Label>
            <Input
              id="timeout"
              type="number"
              value={timeout}
              onChange={handleTimeoutChange}
              className="w-24"
              min={100}
              max={60000}
            />
          </div>
        </div>
        
        <Tabs defaultValue="code">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="code">Code</TabsTrigger>
            <TabsTrigger value="example">Example</TabsTrigger>
          </TabsList>
          
          <TabsContent value="code">
            <Textarea
              id="functionBody"
              value={functionBody}
              onChange={handleFunctionBodyChange}
              className="font-mono text-xs min-h-32"
              rows={10}
              placeholder="return data;"
            />
          </TabsContent>
          
          <TabsContent value="example">
            <Textarea
              readOnly
              value={getExampleTemplate()}
              className="font-mono text-xs min-h-32 bg-muted/50"
              rows={10}
            />
          </TabsContent>
        </Tabs>
        
        <p className="text-xs text-muted-foreground">
          Write JavaScript code that processes the input data. The code will be wrapped in an async function.
        </p>
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
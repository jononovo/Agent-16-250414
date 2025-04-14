/**
 * Decision Node UI Component
 * 
 * This file contains the React component used to render the decision node
 * in the workflow editor.
 */

import React, { useState } from 'react';
import { Handle, Position } from 'reactflow';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

// Default data for the node
export const defaultData = {
  condition: 'data.value > 10',
  trueData: {},
  falseData: {}
};

// Validator for the node data
export const validator = (data: any) => {
  const errors = [];
  
  if (!data.condition || data.condition.trim() === '') {
    errors.push('Condition is required');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

// React component for the node
export const component = ({ data, isConnectable }: any) => {
  const [condition, setCondition] = useState(data.condition || defaultData.condition);
  
  // Update the node data when condition changes
  const handleConditionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setCondition(newValue);
    
    if (data && typeof data.onChange === 'function') {
      data.onChange({
        ...data,
        condition: newValue
      });
    }
  };
  
  return (
    <div className="p-3 rounded-md bg-background border shadow-sm min-w-[300px]">
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
          <Label htmlFor="condition">Condition</Label>
          <Badge variant="outline" className="text-xs">JavaScript</Badge>
        </div>
        
        <Textarea
          id="condition"
          value={condition}
          onChange={handleConditionChange}
          className="font-mono text-xs"
          rows={2}
          placeholder="data.value > 10"
        />
        
        <p className="text-xs text-muted-foreground">
          Enter a JavaScript expression that evaluates to true or false
        </p>
        
        <Separator />
        
        <div className="flex justify-between">
          <div className="text-xs flex items-center gap-1">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>True Branch</span>
          </div>
          
          <div className="text-xs flex items-center gap-1">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span>False Branch</span>
          </div>
        </div>
      </div>
      
      {/* Output handles */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="true"
        isConnectable={isConnectable}
        className="w-2 h-2 bg-green-500 left-[25%]"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="false"
        isConnectable={isConnectable}
        className="w-2 h-2 bg-red-500 left-[50%]"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="error"
        isConnectable={isConnectable}
        className="w-2 h-2 bg-yellow-500 left-[75%]"
      />
    </div>
  );
};
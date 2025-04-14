/**
 * Decision Node UI Component
 * 
 * This component provides an interface for creating conditional branch logic
 */

import React, { useState } from 'react';
import { Handle, Position } from 'reactflow';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DecisionNodeData } from './executor';

export const defaultData: DecisionNodeData = {
  condition: 'value === true'
};

export const component: React.FC<{
  data: DecisionNodeData;
  onChange: (data: DecisionNodeData) => void;
}> = ({ data, onChange }) => {
  const [condition, setCondition] = useState(data.condition || defaultData.condition);

  const handleConditionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newCondition = e.target.value;
    setCondition(newCondition);
    onChange({ ...data, condition: newCondition });
  };

  return (
    <div className="decision-node">
      <Handle type="target" position={Position.Left} id="input" />
      
      <Card className="w-[400px]">
        <CardHeader className="pb-2">
          <CardTitle className="text-md">Decision</CardTitle>
          <CardDescription className="text-xs">Create conditional branch based on rules</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="condition">Condition</Label>
            <Textarea
              id="condition"
              value={condition}
              onChange={handleConditionChange}
              className="font-mono text-sm"
              placeholder="Enter condition (e.g., value > 10)"
            />
            <div className="flex gap-2 text-xs">
              <div className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-2 py-1 rounded-md">
                True Output →
              </div>
              <div className="bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 px-2 py-1 rounded-md">
                False Output →
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              The variable 'value' contains the input data to test against
            </p>
          </div>
        </CardContent>
      </Card>
      
      <Handle type="source" position={Position.Right} id="true" className="bg-emerald-500" />
      <Handle 
        type="source" 
        position={Position.Right} 
        id="false" 
        className="bg-rose-500"
        style={{ top: '70%' }}
      />
    </div>
  );
};

export const validator = (data: DecisionNodeData) => {
  const errors: string[] = [];
  
  if (!data.condition || data.condition.trim() === '') {
    errors.push('Condition cannot be empty');
  } else {
    // Try to validate the JavaScript syntax
    try {
      // We add 'return' to ensure it's a valid expression
      new Function('value', `return ${data.condition};`);
    } catch (error) {
      errors.push(`JavaScript syntax error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};
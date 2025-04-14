/**
 * Function Node UI Component
 * 
 * This component renders a code editor for creating custom JS functions
 */

import React, { useState } from 'react';
import { Handle, Position } from 'reactflow';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface FunctionNodeData {
  code: string;
}

export const defaultData: FunctionNodeData = {
  code: `// This function receives all inputs as the first parameter
// You can transform the data and return any value
// Example:
return {
  message: "Hello from function node!",
  inputs: inputs
};`
};

export const component: React.FC<{
  data: FunctionNodeData;
  onChange: (data: FunctionNodeData) => void;
}> = ({ data, onChange }) => {
  const [code, setCode] = useState(data.code || defaultData.code);

  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newCode = e.target.value;
    setCode(newCode);
    onChange({ ...data, code: newCode });
  };

  return (
    <div className="function-node">
      <Handle type="target" position={Position.Left} id="input" />
      
      <Card className="w-[400px]">
        <CardHeader className="pb-2">
          <CardTitle className="text-md">Function</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="code">JavaScript Code</Label>
            <Textarea
              id="code"
              value={code}
              onChange={handleCodeChange}
              className="font-mono text-sm h-[200px]"
              placeholder="Enter your JavaScript code here..."
            />
          </div>
        </CardContent>
      </Card>
      
      <Handle type="source" position={Position.Right} id="output" />
    </div>
  );
};

export const validator = (data: FunctionNodeData) => {
  const errors: string[] = [];
  
  if (!data.code || data.code.trim() === '') {
    errors.push('Function code cannot be empty');
  }
  
  try {
    // Try to create a function from the code to validate syntax
    new Function('inputs', data.code);
  } catch (error) {
    errors.push(`JavaScript syntax error: ${error instanceof Error ? error.message : String(error)}`);
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};
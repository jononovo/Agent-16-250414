/**
 * Function Node UI Component
 * 
 * This component renders a code editor for creating custom JS functions
 */

import React, { useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Code } from 'lucide-react';

interface FunctionNodeData {
  code: string;
  label?: string;
  description?: string;
  settings?: Record<string, any>;
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

// This is the component that will be used by ReactFlow
export function FunctionNodeComponent(props: NodeProps) {
  const { data } = props;
  const nodeData = data as FunctionNodeData;
  
  // Create a wrapper that uses our internal component
  return <FunctionNode 
    data={nodeData}
    onChange={(updatedData) => {
      // In ReactFlow, we typically don't get an onChange prop
      // This is handled internally by the node
      console.log('Function node data updated:', updatedData);
    }}
    isConnectable={true}
  />;
}

// Export the component for ReactFlow
export const component = FunctionNodeComponent;

// Internal component with full functionality
function FunctionNode({ 
  data, 
  onChange,
  isConnectable = true
}: { 
  data: FunctionNodeData; 
  onChange: (data: FunctionNodeData) => void;
  isConnectable?: boolean;
}) {
  const [code, setCode] = useState(data.code || defaultData.code);

  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newCode = e.target.value;
    setCode(newCode);
    onChange({ ...data, code: newCode });
  };

  return (
    <div className="p-3 rounded-md bg-background border shadow-sm min-w-[320px]">
      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Top}
        id="input"
        isConnectable={isConnectable}
        className="w-2 h-2 bg-blue-500"
      />
      
      <div className="flex items-center gap-2 mb-2">
        <Code className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-medium">Function</h3>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="code" className="text-xs">JavaScript Code</Label>
        <Textarea
          id="code"
          value={code}
          onChange={handleCodeChange}
          className="font-mono text-xs h-[180px]"
          placeholder="Enter your JavaScript code here..."
        />
        <p className="text-xs text-muted-foreground">
          The 'inputs' variable contains data from connected nodes
        </p>
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
}

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
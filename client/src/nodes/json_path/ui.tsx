/**
 * JSONPath Node UI Component
 * 
 * This component renders an interface for configuring JSONPath queries
 */

import React, { useState } from 'react';
import { Handle, Position } from 'reactflow';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { JSONPathNodeData } from './executor';

export const defaultData: JSONPathNodeData = {
  path: '$.data'
};

export const component: React.FC<{
  data: JSONPathNodeData;
  onChange: (data: JSONPathNodeData) => void;
}> = ({ data, onChange }) => {
  const [path, setPath] = useState(data.path || defaultData.path);

  const handlePathChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPath = e.target.value;
    setPath(newPath);
    onChange({ ...data, path: newPath });
  };

  return (
    <div className="json-path-node">
      <Handle type="target" position={Position.Left} id="input" />
      
      <Card className="w-[350px]">
        <CardHeader className="pb-2">
          <CardTitle className="text-md">JSONPath</CardTitle>
          <CardDescription className="text-xs">Extract data using path expression</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="path">Path Expression</Label>
            <Input
              id="path"
              value={path}
              onChange={handlePathChange}
              placeholder="$.path.to.property"
            />
            <div className="text-xs text-muted-foreground">
              <p>Examples:</p>
              <ul className="list-disc list-inside pl-2">
                <li>$.user.name</li>
                <li>$.products[0].price</li>
                <li>$.results.items</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Handle type="source" position={Position.Right} id="output" />
    </div>
  );
};

export const validator = (data: JSONPathNodeData) => {
  const errors: string[] = [];
  
  if (!data.path || data.path.trim() === '') {
    errors.push('JSONPath expression cannot be empty');
  }
  
  // Basic validation for JSONPath format
  if (data.path && !data.path.startsWith('$')) {
    errors.push('JSONPath expression should start with $');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};
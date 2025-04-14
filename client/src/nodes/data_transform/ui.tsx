/**
 * Data Transform Node UI Component
 * 
 * This component provides an interface for creating data transformations with JavaScript
 */

import React, { useState } from 'react';
import { Handle, Position } from 'reactflow';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, ArrowUpDown } from 'lucide-react';
import { DataTransformNodeData, Transformation } from './executor';

export const defaultData: DataTransformNodeData = {
  transformations: [
    {
      name: "Default Transform",
      expression: "return data;",
      enabled: true
    }
  ]
};

export const component: React.FC<{
  data: DataTransformNodeData;
  onChange: (data: DataTransformNodeData) => void;
}> = ({ data, onChange }) => {
  const [transformations, setTransformations] = useState<Transformation[]>(
    data.transformations?.length ? data.transformations : defaultData.transformations
  );

  const addTransformation = () => {
    const newTransformation: Transformation = {
      name: `Transform ${transformations.length + 1}`,
      expression: "return data;",
      enabled: true
    };
    
    const updatedTransformations = [...transformations, newTransformation];
    setTransformations(updatedTransformations);
    onChange({ ...data, transformations: updatedTransformations });
  };

  const updateTransformation = (index: number, updatedTransform: Partial<Transformation>) => {
    const updatedTransformations = transformations.map((t, i) => 
      i === index ? { ...t, ...updatedTransform } : t
    );
    
    setTransformations(updatedTransformations);
    onChange({ ...data, transformations: updatedTransformations });
  };

  const deleteTransformation = (index: number) => {
    const updatedTransformations = transformations.filter((_, i) => i !== index);
    
    setTransformations(updatedTransformations);
    onChange({ ...data, transformations: updatedTransformations });
  };

  const moveTransformation = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) || 
      (direction === 'down' && index === transformations.length - 1)
    ) {
      return; // Can't move further in this direction
    }
    
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const updatedTransformations = [...transformations];
    
    // Swap positions
    [updatedTransformations[index], updatedTransformations[newIndex]] = 
    [updatedTransformations[newIndex], updatedTransformations[index]];
    
    setTransformations(updatedTransformations);
    onChange({ ...data, transformations: updatedTransformations });
  };

  return (
    <div className="data-transform-node">
      <Handle type="target" position={Position.Left} id="input" />
      
      <Card className="w-[450px]">
        <CardHeader className="pb-2">
          <CardTitle className="text-md">Data Transform</CardTitle>
          <CardDescription className="text-xs">Apply transformations to data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {transformations.map((transformation, index) => (
              <div key={index} className="p-3 border rounded-md space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Switch 
                      checked={transformation.enabled}
                      onCheckedChange={(checked) => updateTransformation(index, { enabled: checked })}
                      id={`transform-${index}-enabled`}
                    />
                    <Input
                      value={transformation.name}
                      onChange={(e) => updateTransformation(index, { name: e.target.value })}
                      className="h-8 w-[200px]"
                      placeholder="Transformation name"
                    />
                  </div>
                  <div className="flex gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => moveTransformation(index, 'up')}
                      disabled={index === 0}
                    >
                      <ArrowUpDown className="h-4 w-4 rotate-90" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => moveTransformation(index, 'down')}
                      disabled={index === transformations.length - 1}
                    >
                      <ArrowUpDown className="h-4 w-4 -rotate-90" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-destructive"
                      onClick={() => deleteTransformation(index)}
                      disabled={transformations.length <= 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div>
                  <Textarea
                    value={transformation.expression}
                    onChange={(e) => updateTransformation(index, { expression: e.target.value })}
                    className="font-mono text-sm min-h-[80px]"
                    placeholder="Enter JavaScript code to transform data..."
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Use 'data' to access input and 'return' to send output
                  </p>
                </div>
              </div>
            ))}
            
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={addTransformation}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Transformation
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <Handle type="source" position={Position.Right} id="output" />
    </div>
  );
};

export const validator = (data: DataTransformNodeData) => {
  const errors: string[] = [];
  
  if (!data.transformations || data.transformations.length === 0) {
    errors.push('At least one transformation is required');
  } else {
    // Check each transformation
    data.transformations.forEach((transform, index) => {
      if (!transform.name || transform.name.trim() === '') {
        errors.push(`Transformation #${index + 1} must have a name`);
      }
      
      if (!transform.expression || transform.expression.trim() === '') {
        errors.push(`Transformation #${index + 1} must have an expression`);
      } else {
        // Try to validate the JavaScript syntax
        try {
          new Function('data', transform.expression);
        } catch (error) {
          errors.push(`Syntax error in transformation "${transform.name}": ${
            error instanceof Error ? error.message : String(error)
          }`);
        }
      }
    });
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};
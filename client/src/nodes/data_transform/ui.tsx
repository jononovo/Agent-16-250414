/**
 * Data Transform Node UI Component
 * 
 * This file contains the React component used to render the data transform node
 * in the workflow editor.
 */

import React, { useState } from 'react';
import { Handle, Position } from 'reactflow';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Plus } from 'lucide-react';

// Default data for the node
export const defaultData = {
  transformations: [
    { field: 'name', operation: 'map', expression: 'data.firstName + " " + data.lastName' },
    { field: 'age', operation: 'map', expression: 'data.age' }
  ],
  outputTemplate: {}
};

// Validator for the node data
export const validator = (data: any) => {
  const errors = [];
  
  if (!data.transformations || !Array.isArray(data.transformations) || data.transformations.length === 0) {
    errors.push('At least one transformation is required');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

// React component for the node
export const component = ({ data, isConnectable }: any) => {
  const [transformations, setTransformations] = useState(
    data.transformations || defaultData.transformations
  );
  
  // Update the node data when transformations change
  const updateNodeData = () => {
    if (data && typeof data.onChange === 'function') {
      data.onChange({
        ...data,
        transformations
      });
    }
  };
  
  // Add a new empty transformation
  const addTransformation = () => {
    const newTransformations = [
      ...transformations,
      { field: '', operation: 'map', expression: '' }
    ];
    setTransformations(newTransformations);
    
    // Update the node data with the new transformations
    data.onChange({
      ...data,
      transformations: newTransformations
    });
  };
  
  // Remove a transformation by index
  const removeTransformation = (index: number) => {
    const newTransformations = transformations.filter((_, i) => i !== index);
    setTransformations(newTransformations);
    
    // Update the node data with the new transformations
    data.onChange({
      ...data,
      transformations: newTransformations
    });
  };
  
  // Update a transformation field
  const updateTransformation = (index: number, field: string, value: string) => {
    const newTransformations = [...transformations];
    newTransformations[index] = {
      ...newTransformations[index],
      [field]: value
    };
    setTransformations(newTransformations);
    
    // Update the node data with the new transformations
    data.onChange({
      ...data,
      transformations: newTransformations
    });
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
      
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-medium">Data Transformations</h3>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={addTransformation}
            className="h-7 px-2"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add
          </Button>
        </div>
        
        {transformations.map((transformation, index) => (
          <div key={index} className="space-y-2 border p-2 rounded-md">
            <div className="flex justify-between items-center">
              <div className="flex-1 space-y-1">
                <Label htmlFor={`field-${index}`}>Field</Label>
                <Input
                  id={`field-${index}`}
                  value={transformation.field}
                  onChange={(e) => updateTransformation(index, 'field', e.target.value)}
                  placeholder="Field name"
                  className="h-7"
                />
              </div>
              
              <div className="flex-1 space-y-1 mx-2">
                <Label htmlFor={`operation-${index}`}>Operation</Label>
                <Select
                  value={transformation.operation}
                  onValueChange={(value) => updateTransformation(index, 'operation', value)}
                >
                  <SelectTrigger id={`operation-${index}`} className="h-7">
                    <SelectValue placeholder="Select operation" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="map">Map</SelectItem>
                    <SelectItem value="filter">Filter</SelectItem>
                    <SelectItem value="reduce">Reduce</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button
                size="sm"
                variant="ghost"
                onClick={() => removeTransformation(index)}
                className="h-7 px-2 self-end mb-0.5"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
            
            <div>
              <Label htmlFor={`expression-${index}`}>Expression</Label>
              <Textarea
                id={`expression-${index}`}
                value={transformation.expression}
                onChange={(e) => updateTransformation(index, 'expression', e.target.value)}
                placeholder="JavaScript expression"
                className="font-mono text-xs"
                rows={2}
              />
            </div>
          </div>
        ))}
        
        <p className="text-xs text-muted-foreground">
          Use 'data' to access input fields, e.g., 'data.firstName'
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
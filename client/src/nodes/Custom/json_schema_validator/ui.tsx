/**
 * JSON Schema Validator Node UI Component
 * 
 * This file contains the React component used to render the JSON schema validator node
 * in the workflow editor, with a Simple AI Dev inspired UI.
 */

import React, { useState, useEffect } from 'react';
import { Handle, Position } from 'reactflow';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { CheckSquare, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// Default data for the node
export const defaultData = {
  schemaContent: '{}',
  strictMode: true,
  allowAdditionalProperties: false,
  label: 'JSON Schema Validator',
  validationStatus: null,
  errors: []
};

// React component for the node
export const component = ({ data, isConnectable, selected }: any) => {
  // Combine default data with passed data
  const nodeData = { ...defaultData, ...data };
  
  // Local state for the schema content
  const [schemaContent, setSchemaContent] = useState<string>(
    nodeData.schemaContent || defaultData.schemaContent
  );
  
  // Local state for options
  const [strictMode, setStrictMode] = useState<boolean>(
    nodeData.strictMode ?? defaultData.strictMode
  );
  
  const [allowAdditionalProperties, setAllowAdditionalProperties] = useState<boolean>(
    nodeData.allowAdditionalProperties ?? defaultData.allowAdditionalProperties
  );
  
  // Local state for validation status
  const [validationStatus, setValidationStatus] = useState<boolean | null>(nodeData.validationStatus);
  
  // Local state for validation errors
  const [errors, setErrors] = useState<string[]>(nodeData.errors || []);
  
  // Update local state when node data changes
  useEffect(() => {
    if (nodeData.schemaContent !== undefined) {
      setSchemaContent(nodeData.schemaContent);
    }
    if (nodeData.strictMode !== undefined) {
      setStrictMode(nodeData.strictMode);
    }
    if (nodeData.allowAdditionalProperties !== undefined) {
      setAllowAdditionalProperties(nodeData.allowAdditionalProperties);
    }
    if (nodeData.validationStatus !== undefined) {
      setValidationStatus(nodeData.validationStatus);
    }
    if (nodeData.errors !== undefined) {
      setErrors(nodeData.errors);
    }
  }, [nodeData]);
  
  // Handle schema content change
  const handleSchemaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newSchema = e.target.value;
    setSchemaContent(newSchema);
    
    if (data.onChange) {
      data.onChange({
        ...nodeData,
        schemaContent: newSchema,
      });
    }
  };
  
  // Handle strict mode toggle
  const handleStrictModeToggle = (checked: boolean) => {
    setStrictMode(checked);
    
    if (data.onChange) {
      data.onChange({
        ...nodeData,
        strictMode: checked,
      });
    }
  };
  
  // Handle additional properties toggle
  const handleAdditionalPropertiesToggle = (checked: boolean) => {
    setAllowAdditionalProperties(checked);
    
    if (data.onChange) {
      data.onChange({
        ...nodeData,
        allowAdditionalProperties: checked,
      });
    }
  };
  
  // Get validation status display
  const getValidationStatusDisplay = () => {
    if (validationStatus === null) {
      return <Badge variant="outline" className="text-muted-foreground">Not Validated</Badge>;
    } else if (validationStatus === true) {
      return <Badge variant="success" className="bg-green-100 text-green-800">Valid</Badge>;
    } else {
      return <Badge variant="destructive" className="bg-red-100 text-red-800">Invalid</Badge>;
    }
  };
  
  return (
    <div className={`p-3 rounded-md ${selected ? 'bg-muted/80 shadow-md' : 'bg-background/80'} border shadow-sm transition-all duration-200 min-w-[280px]`}>
      {/* Node Header */}
      <div className="flex items-center gap-2 mb-3 pb-2 border-b">
        <div className="p-1 rounded bg-primary/10 text-primary">
          <CheckSquare size={16} />
        </div>
        <div className="font-medium text-sm">{nodeData.label || 'JSON Schema Validator'}</div>
        <div className="ml-auto">
          {getValidationStatusDisplay()}
        </div>
      </div>
      
      {/* Node Content */}
      <div className="flex flex-col gap-3">
        {/* Schema Editor */}
        <div>
          <Label className="mb-1 block text-xs text-muted-foreground">Schema</Label>
          <Textarea
            value={schemaContent}
            onChange={handleSchemaChange}
            placeholder="Enter JSON schema..."
            className="text-sm font-mono resize-none h-20"
          />
          <div className="text-xs text-muted-foreground mt-1">
            Define the JSON schema to validate against
          </div>
        </div>
        
        {/* Options */}
        <div className="flex flex-col gap-2 mt-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs cursor-pointer" htmlFor="strict-mode">
              Strict Mode
            </Label>
            <Switch
              id="strict-mode"
              checked={strictMode}
              onCheckedChange={handleStrictModeToggle}
              size="sm"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label className="text-xs cursor-pointer" htmlFor="additional-props">
              Allow Additional Properties
            </Label>
            <Switch
              id="additional-props"
              checked={allowAdditionalProperties}
              onCheckedChange={handleAdditionalPropertiesToggle}
              size="sm"
            />
          </div>
        </div>
        
        {/* Validation Errors - Only show if there are errors */}
        {errors.length > 0 && validationStatus === false && (
          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-sm">
            <div className="flex items-center gap-1 text-xs text-red-600 font-medium mb-1">
              <AlertCircle size={12} />
              <span>Validation Errors</span>
            </div>
            <ul className="text-xs text-red-600 pl-4 mt-1 list-disc">
              {errors.slice(0, 3).map((error, index) => (
                <li key={index}>{error}</li>
              ))}
              {errors.length > 3 && (
                <li>...and {errors.length - 3} more</li>
              )}
            </ul>
          </div>
        )}
      </div>
      
      {/* Input Handles */}
      <Handle
        type="target"
        position={Position.Left}
        id="json"
        isConnectable={isConnectable}
        className="w-2 h-6 rounded-sm bg-blue-500 -ml-0.5 top-1/3"
      />
      
      <Handle
        type="target"
        position={Position.Left}
        id="schema"
        isConnectable={isConnectable}
        className="w-2 h-6 rounded-sm bg-purple-500 -ml-0.5 top-2/3"
      />
      
      {/* Output Handles */}
      <Handle
        type="source"
        position={Position.Right}
        id="validJson"
        isConnectable={isConnectable}
        className="w-2 h-6 rounded-sm bg-green-500 -mr-0.5 top-1/4"
      />
      
      <Handle
        type="source"
        position={Position.Right}
        id="isValid"
        isConnectable={isConnectable}
        className="w-2 h-6 rounded-sm bg-yellow-500 -mr-0.5 top-2/4"
      />
      
      <Handle
        type="source"
        position={Position.Right}
        id="errors"
        isConnectable={isConnectable}
        className="w-2 h-6 rounded-sm bg-red-500 -mr-0.5 top-3/4"
      />
    </div>
  );
};

export default component;
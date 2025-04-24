/**
 * Function Node UI Component
 * 
 * Enhanced component that renders an advanced code editor for custom JavaScript functions
 * with additional configuration options and template selection.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Code, Settings, Clock, Zap, Shield, Database, LayoutList } from 'lucide-react';
import { nodeMetadata } from './definition';

// Updated data interface to support the enhanced function node
interface FunctionNodeData {
  functionBody?: string;
  code?: string; // For backward compatibility
  label?: string;
  description?: string;
  timeout?: number;
  useAsyncFunction?: boolean;
  errorHandling?: 'throw' | 'return' | 'null';
  selectedTemplate?: string;
  enableAdvancedOptions?: boolean;
  executionEnvironment?: 'client' | 'server';
  cacheResults?: boolean;
  settingsData?: Record<string, any>;
  isProcessing?: boolean;
  isComplete?: boolean;
  hasError?: boolean;
  errorMessage?: string;
  [key: string]: any;
}

// Default data for the function node
export const defaultData: FunctionNodeData = {
  functionBody: `// This function receives the input data and transforms it
// The 'data' variable contains the primary input
// The 'inputs' object contains all connected inputs

return {
  message: "Hello from function node!",
  processed: true,
  timestamp: new Date().toISOString(),
  originalData: data
};`,
  timeout: 5000,
  useAsyncFunction: true,
  errorHandling: 'throw',
  selectedTemplate: 'basic',
  enableAdvancedOptions: false,
  executionEnvironment: 'client',
  cacheResults: false
};

// This is the component that will be used by ReactFlow
export function FunctionNodeComponent(props: NodeProps) {
  const { data, id } = props;
  const nodeData = data as FunctionNodeData;
  
  // Create a wrapper that uses our internal component
  return <FunctionNode 
    id={id}
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
  id,
  data, 
  onChange,
  isConnectable = true
}: { 
  id: string;
  data: FunctionNodeData; 
  onChange: (data: FunctionNodeData) => void;
  isConnectable?: boolean;
}) {
  // Normalize function code from various sources (for compatibility)
  const functionCode = data.functionBody || data.code || defaultData.functionBody;
  
  // State for function code (with backwards compatibility)
  const [functionBody, setFunctionBody] = useState(functionCode);
  
  // Normalized function data
  const normalizedData = {
    functionBody: functionBody,
    timeout: data.timeout || defaultData.timeout,
    useAsyncFunction: data.useAsyncFunction ?? defaultData.useAsyncFunction,
    errorHandling: data.errorHandling || defaultData.errorHandling,
    selectedTemplate: data.selectedTemplate || defaultData.selectedTemplate,
    enableAdvancedOptions: data.enableAdvancedOptions ?? defaultData.enableAdvancedOptions,
    executionEnvironment: data.executionEnvironment || defaultData.executionEnvironment,
    cacheResults: data.cacheResults ?? defaultData.cacheResults,
    isProcessing: data.isProcessing || false,
    isComplete: data.isComplete || false,
    hasError: data.hasError || false,
    errorMessage: data.errorMessage || ''
  };

  // Handle code changes
  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newCode = e.target.value;
    setFunctionBody(newCode);
    
    // Update with both new and old property names for compatibility
    onChange({ 
      ...data, 
      functionBody: newCode,
      code: newCode  // Keep backward compatibility
    });
  };
  
  // Handle template selection
  const handleTemplateChange = (templateId: string) => {
    // Get template code from the template library
    const templateCode = nodeMetadata.templateLibrary[templateId as keyof typeof nodeMetadata.templateLibrary];
    
    if (templateCode) {
      setFunctionBody(templateCode);
      
      // Update with both new and old property names for compatibility
      onChange({
        ...data,
        functionBody: templateCode,
        code: templateCode,
        selectedTemplate: templateId
      });
    }
  };
  
  // Open settings drawer when the settings button is clicked
  const openSettings = () => {
    // Always use the centralized settings drawer by dispatching the event
    const event = new CustomEvent('node-settings-open', { 
      detail: { nodeId: id }
    });
    window.dispatchEvent(event);
  };

  // Get status badge based on execution state
  const getStatusBadge = () => {
    if (normalizedData.isProcessing) return <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">Running</Badge>;
    if (normalizedData.isComplete) return <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">Completed</Badge>;
    if (normalizedData.hasError) return <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">Error</Badge>;
    return null;
  };

  // Get settings summary for display in the node
  const getSettingsSummary = () => {
    const summaryItems = [];
    
    if (normalizedData.useAsyncFunction) {
      summaryItems.push('Async');
    }
    
    summaryItems.push(`${normalizedData.timeout}ms`);
    
    if (normalizedData.cacheResults) {
      summaryItems.push('Cached');
    }
    
    if (normalizedData.executionEnvironment === 'server') {
      summaryItems.push('Server-side');
    }
    
    return summaryItems.join(' • ');
  };

  return (
    <div className="p-3 rounded-md bg-background border shadow-sm min-w-[320px]">
      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        isConnectable={isConnectable}
        className="w-2 h-2 bg-blue-500"
        style={{ top: 50 }}
      />
      
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="bg-blue-500/10 p-1.5 rounded-md">
            <Code className="h-4 w-4 text-blue-500" />
          </div>
          <h3 className="text-sm font-medium">Function</h3>
        </div>
        
        <div className="flex items-center gap-1.5">
          {getStatusBadge()}
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7"
            onClick={openSettings}
          >
            <Settings className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        </div>
      </div>
      
      {/* Settings summary */}
      <div className="flex justify-between items-center mb-2">
        <Badge variant="outline" className="text-xs px-2 py-0.5 bg-slate-100/50 dark:bg-slate-800/50">
          JavaScript
        </Badge>
        
        <div className="flex items-center text-xs text-muted-foreground">
          <Clock className="h-3 w-3 mr-1 inline" />
          <span>{getSettingsSummary()}</span>
        </div>
      </div>
      
      {/* Template selector - Only shown when not in minimal mode */}
      <div className="mb-2">
        <Label htmlFor="template" className="text-xs">Template</Label>
        <Select 
          value={normalizedData.selectedTemplate} 
          onValueChange={handleTemplateChange}
        >
          <SelectTrigger id="template" className="h-7 text-xs">
            <SelectValue placeholder="Select template" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="basic">Basic (return input)</SelectItem>
            <SelectItem value="transform">Data Transform</SelectItem>
            <SelectItem value="api">API Request</SelectItem>
            <SelectItem value="json">JSON Processing</SelectItem>
            <SelectItem value="conditional">Conditional Logic</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Code editor */}
      <div className="space-y-1">
        <Label htmlFor="code" className="text-xs">Function Code</Label>
        <Textarea
          id="code"
          value={functionBody}
          onChange={handleCodeChange}
          className="font-mono text-xs h-[140px] bg-slate-50 dark:bg-slate-900"
          placeholder="Enter your JavaScript code here..."
        />
        
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>
            <code className="text-xs">data</code>: primary input
          </span>
          <span>
            <code className="text-xs">inputs</code>: all inputs
          </span>
        </div>
      </div>
      
      {/* Show errors if any */}
      {normalizedData.hasError && normalizedData.errorMessage && (
        <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <p className="text-xs text-red-600 dark:text-red-400 font-mono">{normalizedData.errorMessage}</p>
        </div>
      )}
      
      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        isConnectable={isConnectable}
        className="w-2 h-2 bg-green-500"
        style={{ top: 50 }}
      />
    </div>
  );
}

// Validate function node data
export const validator = (data: FunctionNodeData) => {
  const errors: string[] = [];
  
  // Check if we have code from any of the possible sources
  const functionCode = data.functionBody || data.code;
  
  if (!functionCode || functionCode.trim() === '') {
    errors.push('Function code cannot be empty');
  }
  
  try {
    // Try to create a function from the code to validate syntax
    // We check both old and new parameter patterns for compatibility
    new Function('data', 'inputs', functionCode || '');
  } catch (error) {
    errors.push(`JavaScript syntax error: ${error instanceof Error ? error.message : String(error)}`);
  }
  
  // Validate timeout is positive
  if (data.timeout !== undefined && (typeof data.timeout !== 'number' || data.timeout <= 0)) {
    errors.push('Timeout must be a positive number');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};
/**
 * Function Node UI Component
 * 
 * This node allows users to define custom JavaScript functions
 * that transform input data and produce output.
 * It uses DefaultNode as a wrapper to ensure consistent hover menu behavior.
 */

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Code, Database, Clock, AlertTriangle } from 'lucide-react';
import DefaultNode from '@/nodes/Default/ui';

// Node interface
interface FunctionNodeData {
  label: string;
  description?: string;
  code?: string;
  type?: string;
  category?: string;
  selectedTemplate?: string;
  useAsyncFunction?: boolean;
  timeout?: number;
  cacheResults?: boolean;
  executionEnvironment?: 'client' | 'server';
  errorHandling?: 'throw' | 'return' | 'null';
  onChange?: (data: any) => void;
  settings?: Record<string, any>;
  settingsData?: Record<string, any>;
  isProcessing?: boolean;
  isComplete?: boolean;
  hasError?: boolean;
  errorMessage?: string;
  icon?: string | React.ReactNode;
  [key: string]: any;
}

// Default data for the node
export const defaultData: FunctionNodeData = {
  label: 'Function',
  description: 'Custom JavaScript function that transforms data',
  category: 'code',
  code: 'function process(input) {\n  // Your code here\n  return input;\n}',
  selectedTemplate: 'basic',
  useAsyncFunction: false,
  timeout: 5000,
  cacheResults: false,
  executionEnvironment: 'client',
  errorHandling: 'throw'
};

/**
 * Function Node Component - A node that allows defining custom JavaScript functions
 * This component uses DefaultNode as a wrapper for consistent behavior
 */
function FunctionNode({ data, id, selected, isConnectable }: NodeProps<FunctionNodeData>) {
  // Combine default data with passed data
  const nodeData = { ...defaultData, ...data };
  
  const {
    label,
    description,
    code = defaultData.code,
    settingsData = {},
    isProcessing = false,
    isComplete = false,
    hasError = false,
    errorMessage = ''
  } = nodeData;
  
  // Create custom content for the node
  const customContent = (
    <>
      {/* Code Preview */}
      <div className="mt-2 relative">
        <div className="text-xs font-mono bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 p-2 rounded border border-slate-300 dark:border-slate-700 overflow-y-auto max-h-[150px] shadow-inner">
          {settingsData.selectedTemplate && settingsData.selectedTemplate !== 'basic' && (
            <div className="mb-1 text-xs text-blue-500 dark:text-blue-400 font-semibold">
              Template: {settingsData.selectedTemplate}
            </div>
          )}
          <div className="whitespace-pre-wrap overflow-x-auto" style={{ fontFamily: "'Fira Code', 'JetBrains Mono', monospace" }}>
            {((settingsData?.code || 
              (data?.settings && 'code' in data.settings ? data.settings.code : undefined) || 
              data?.code || 
              code) as string)
              .split('\n')
              .map((line: string, i: number) => {
                // Apply basic syntax highlighting
                const highlightedLine = line
                  .replace(/(function|return|const|let|var|if|else|for|while|try|catch|async|await)/g, 
                          '<span class="text-purple-600 dark:text-purple-400">$1</span>')
                  .replace(/(\(|\)|\{|\}|\[|\])/g, 
                          '<span class="text-orange-500 dark:text-orange-300">$1</span>')
                  .replace(/(\/\/.*)/g, 
                          '<span class="text-slate-500 dark:text-slate-400">$1</span>');
                
                return (
                  <div 
                    key={i} 
                    className="leading-tight" 
                    dangerouslySetInnerHTML={{ __html: highlightedLine }}
                  />
                );
              })}
          </div>
        </div>
      </div>
      
      {/* Advanced Features Indicators */}
      {(settingsData.cacheResults || settingsData.executionEnvironment === 'server') && (
        <div className="mt-2 flex gap-2">
          {settingsData.cacheResults && (
            <div className="flex items-center text-xs gap-1 text-blue-500 dark:text-blue-400">
              <Clock className="h-3 w-3" />
              <span>Caching</span>
            </div>
          )}
          {settingsData.executionEnvironment === 'server' && (
            <div className="flex items-center text-xs gap-1 text-purple-500 dark:text-purple-400">
              <Database className="h-3 w-3" />
              <span>Server-side</span>
            </div>
          )}
        </div>
      )}
      
      {/* Status messages and errors */}
      {hasError && errorMessage && (
        <div className="mt-2 p-2 text-xs bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded border border-red-200 dark:border-red-800">
          <div className="flex items-center gap-1 mb-1">
            <AlertTriangle className="h-3 w-3" />
            <span className="font-medium">Error</span>
          </div>
          {errorMessage}
        </div>
      )}

      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        style={{ 
          top: 50, 
          width: '12px', 
          height: '12px', 
          background: 'white',
          border: '2px solid #3b82f6'
        }}
        isConnectable={isConnectable}
      />
      <div className="absolute left-2 top-[46px] text-xs text-muted-foreground">
        In
      </div>

      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        style={{ 
          top: 50, 
          width: '12px', 
          height: '12px', 
          background: 'white',
          border: '2px solid #10b981'
        }}
        isConnectable={isConnectable}
      />
      <div className="absolute right-2 top-[46px] text-xs text-muted-foreground text-right">
        Out
      </div>
    </>
  );
  
  // Create icon element for the header
  const iconElement = (
    <div className="bg-primary/10 p-1.5 rounded-md">
      <Code className="h-4 w-4 text-primary" />
    </div>
  );
  
  // Get settings summary for display in the node
  const getSettingsSummary = () => {
    if (!settingsData || Object.keys(settingsData).length === 0) {
      return null;
    }
    
    // Format based on common settings patterns
    const summaryItems = [];
    
    if (settingsData.useAsyncFunction) {
      summaryItems.push('Async');
    }
    
    if (settingsData.timeout) {
      summaryItems.push(`${settingsData.timeout}ms`);
    }
    
    if (settingsData.cacheResults) {
      summaryItems.push('Cached');
    }
    
    if (settingsData.executionEnvironment === 'server') {
      summaryItems.push('Server-side');
    }
    
    if (settingsData.errorHandling && settingsData.errorHandling !== 'throw') {
      summaryItems.push(`Errors: ${settingsData.errorHandling}`);
    }
    
    if (settingsData.selectedTemplate && settingsData.selectedTemplate !== 'basic') {
      summaryItems.push(`Template: ${settingsData.selectedTemplate}`);
    }
    
    // Return formatted summary
    if (summaryItems.length > 0) {
      return summaryItems.join(' • ');
    } else {
      // Fallback to a simple summary if needed
      return 'Basic function';
    }
  };
  
  // Create node settings definition
  const settings = {
    title: 'Function Settings',
    fields: [
      {
        key: 'label',
        label: 'Node Label',
        type: 'text' as const,
        description: 'Display name for this node'
      },
      {
        key: 'code',
        label: 'Function Code',
        type: 'textarea' as const,
        description: 'JavaScript function code that processes input data'
      },
      {
        key: 'selectedTemplate',
        label: 'Code Template',
        type: 'select' as const,
        description: 'Select a pre-defined template to use',
        options: [
          { label: 'Basic', value: 'basic' },
          { label: 'Data Transform', value: 'transform' },
          { label: 'API Request', value: 'api' },
          { label: 'JSON Processing', value: 'json' },
          { label: 'Conditional Logic', value: 'conditional' }
        ]
      },
      {
        key: 'useAsyncFunction',
        label: 'Async Function',
        type: 'checkbox' as const,
        description: 'Whether the function should be executed asynchronously'
      },
      {
        key: 'timeout',
        label: 'Timeout (ms)',
        type: 'number' as const,
        description: 'Maximum execution time in milliseconds',
        min: 100,
        max: 60000,
        step: 100
      },
      {
        key: 'cacheResults',
        label: 'Cache Results',
        type: 'checkbox' as const,
        description: 'Cache function results for reuse'
      },
      {
        key: 'executionEnvironment',
        label: 'Execution Environment',
        type: 'select' as const,
        description: 'Where the function should be executed',
        options: [
          { label: 'Client (Browser)', value: 'client' },
          { label: 'Server (Backend)', value: 'server' }
        ]
      },
      {
        key: 'errorHandling',
        label: 'Error Handling',
        type: 'select' as const,
        description: 'How to handle errors during execution',
        options: [
          { label: 'Throw Error (Stop Workflow)', value: 'throw' },
          { label: 'Return Error (Continue Workflow)', value: 'return' },
          { label: 'Return Null (Continue Workflow)', value: 'null' }
        ]
      }
    ]
  };

  // Enhanced data with settings and icon
  const enhancedData = {
    ...nodeData,
    icon: iconElement,
    settings,
    settingsSummary: getSettingsSummary(),
    // These properties define custom content to render inside the DefaultNode
    customContent: customContent,
    // Don't render the default handles since we're adding our own
    hideDefaultHandles: true
  };
  
  // Return the default node wrapper with our customizations
  return <DefaultNode 
    data={enhancedData}
    id={id}
    selected={selected}
    type="function_node"
    isConnectable={isConnectable}
  />;
}

export default memo(FunctionNode);
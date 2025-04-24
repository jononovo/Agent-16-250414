/**
 * Function Node UI Component
 * 
 * This node allows users to define custom JavaScript functions
 * that transform input data and produce output.
 * It now uses DefaultNode as a wrapper to ensure consistent hover menu behavior.
 */

import React, { useState, memo, useEffect } from 'react';
import { NodeProps } from 'reactflow';
import { Code, Database, Clock, AlertTriangle } from 'lucide-react';
import DefaultNode from '@/nodes/Default/ui';

interface FunctionNodeData {
  label: string;
  description?: string;
  type?: string;
  category?: string;
  code?: string;
  settings?: {
    title?: string;
    fields?: Array<{
      key: string;
      label: string;
      type: 'text' | 'number' | 'select' | 'checkbox' | 'textarea' | 'slider';
      options?: Array<{ label: string; value: string | number }>;
      description?: string;
      min?: number;
      max?: number;
      step?: number;
    }>;
  };
  settingsData?: Record<string, any>;
  isProcessing?: boolean;
  isComplete?: boolean;
  hasError?: boolean;
  errorMessage?: string;
  icon?: string | React.ReactNode;
  onChange?: (data: any) => void;
  onRun?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onDelete?: (id: string) => void;
  [key: string]: any;
}

/**
 * Function Node Component - A node that allows defining custom JavaScript functions
 * This component uses DefaultNode as a wrapper for consistent behavior with other nodes
 */
function FunctionNode({ data, id, selected }: NodeProps<FunctionNodeData>) {
  // Destructure node data with defaults
  const {
    label = 'Function',
    description = 'Custom JavaScript function',
    type = 'function_node',
    category = 'code',
    code = 'function process(input) {\n  // Your code here\n  return input;\n}',
    settingsData = {},
    isProcessing = false,
    isComplete = false,
    hasError = false,
    errorMessage = ''
  } = data;
  
  // Settings click handler for the menu 
  const handleSettingsClick = () => {
    // Always use the centralized settings drawer by dispatching the event
    const event = new CustomEvent('node-settings-open', { 
      detail: { nodeId: id }
    });
    window.dispatchEvent(event);
  };
  
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
  
  // Create custom content for the node (just the code preview)
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
    </>
  );
  
  // Create icon element for the header
  const iconElement = (
    <div className="bg-primary/10 p-1.5 rounded-md">
      <Code className="h-4 w-4 text-primary" />
    </div>
  );

  // Return a default node with our custom content
  return (
    <DefaultNode
      id={id}
      data={{
        ...data,
        icon: iconElement,
        settingsSummary: getSettingsSummary(),
        onSettingsClick: handleSettingsClick,
        customContent: customContent
      }}
      selected={selected}
      type="function_node"
    />
  );
}

export default memo(FunctionNode);
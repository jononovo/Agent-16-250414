/**
 * Custom Function Node UI Component
 * 
 * This file contains the React component used to render the custom function node
 * in the workflow editor, using DefaultNode as a wrapper to ensure
 * consistent hover menu behavior and UI patterns.
 */

import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Code } from 'lucide-react';
import DefaultNode from '@/nodes/Default/ui';
import { memo } from 'react';
import { nodeMetadata } from './definition';

// Node interface
interface FunctionNodeData {
  code: string;
  selectedTemplate?: string;
  label: string;
  description?: string;
  category?: string;
  onChange?: (data: any) => void;
  [key: string]: any;
}

// Default data for the node
export const defaultData: FunctionNodeData = {
  code: nodeMetadata.templateLibrary.default,
  selectedTemplate: 'default',
  label: 'Custom Function',
  description: 'Execute custom JavaScript code',
  category: 'advanced'
};

// React component for the node, using DefaultNode as a wrapper
export const component = memo(({ data, id, isConnectable, selected }: NodeProps<FunctionNodeData>) => {
  // Combine default data with passed data
  const nodeData = { ...defaultData, ...data };
  
  // Create icon element for the header
  const iconElement = (
    <div className="bg-primary/10 p-1.5 rounded-md">
      <Code className="h-4 w-4 text-primary" />
    </div>
  );
  
  // Create node settings definition
  const settings = {
    title: `${nodeData.label || 'Custom Function'} Settings`,
    fields: [
      {
        key: 'label',
        label: 'Node Label',
        type: 'text' as const,
        description: 'Display name for this node'
      },
      {
        key: 'selectedTemplate',
        label: 'Template',
        type: 'select' as const,
        description: 'Select a template for common function patterns',
        options: [
          { value: 'default', label: 'Default Function' },
          { value: 'json', label: 'JSON Processor' },
          { value: 'text', label: 'Text Processor' },
          { value: 'transform', label: 'Data Transformer' }
        ]
      },
      {
        key: 'code',
        label: 'Function Code',
        type: 'code' as const,
        description: 'JavaScript function to execute',
        language: 'javascript'
      }
    ]
  };
  
  // The content to display in the node
  const customContent = (
    <>
      {/* Code preview */}
      <div className="mt-2 mb-1 text-xs bg-slate-100 p-2 rounded-md overflow-hidden text-slate-700 font-mono">
        <div className="truncate">
          {nodeData.code ? (
            nodeData.code.split('\n')[0] + (nodeData.code.split('\n').length > 1 ? '...' : '')
          ) : (
            'function process(input) { ... }'
          )}
        </div>
      </div>
      
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
          border: '2px solid #6366f1'
        }}
        isConnectable={isConnectable}
      />
      <div className="absolute left-2 top-[46px] text-xs text-muted-foreground text-left">
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
  
  // Enhanced data with settings and icon
  const enhancedData = {
    ...nodeData,
    icon: iconElement,
    settings,
    // These properties define custom content to render inside the DefaultNode
    childrenContent: customContent,
    // Don't render the default handles since we're adding our own
    hideDefaultHandles: true
  };
  
  // Return the default node wrapper with our customizations
  return <DefaultNode 
    data={enhancedData}
    id={id} 
    selected={selected}
    isConnectable={isConnectable}
    type="function_node"
  />;
});

export default component;
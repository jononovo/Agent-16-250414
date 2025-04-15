/**
 * BaseNode
 * 
 * A standardized base component for all node types.
 * This template provides consistent structure and styling for nodes.
 */

import React, { ReactNode } from 'react';
import { NodeProps, Position } from 'reactflow';
import { NodeContainer } from '../common/NodeContainer';
import { NodeHeader } from '../common/NodeHeader';
import { NodeContent } from '../common/NodeContent';
import { HandleWithLabel } from '../handles/HandleWithLabel';

interface InputPort {
  id: string;
  label: string;
  isConnectable?: boolean;
}

interface OutputPort {
  id: string;
  label: string;
  isConnectable?: boolean;
}

interface BaseNodeProps extends NodeProps {
  title: string;
  icon?: ReactNode;
  description?: string;
  inputs?: InputPort[];
  outputs?: OutputPort[];
  headerActions?: ReactNode;
  children?: ReactNode;
}

export function BaseNode({
  title,
  icon,
  description,
  inputs = [],
  outputs = [],
  headerActions,
  children,
  selected,
  isConnectable = true,
  ...props
}: BaseNodeProps) {
  return (
    <NodeContainer selected={selected}>
      <NodeHeader 
        title={title} 
        icon={icon}
        description={description}
        actions={headerActions}
      />
      <NodeContent>
        {/* Input handles */}
        {inputs.map((input) => (
          <HandleWithLabel
            key={input.id}
            type="target"
            position={Position.Left}
            id={input.id}
            label={input.label}
            isConnectable={input.isConnectable !== false && isConnectable}
          />
        ))}
        
        {/* Node content */}
        <div className="p-3 space-y-3">
          {children}
        </div>
        
        {/* Output handles */}
        {outputs.map((output) => (
          <HandleWithLabel
            key={output.id}
            type="source"
            position={Position.Right}
            id={output.id}
            label={output.label}
            isConnectable={output.isConnectable !== false && isConnectable}
          />
        ))}
      </NodeContent>
    </NodeContainer>
  );
}
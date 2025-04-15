/**
 * AIModelNode
 * 
 * A specialized node template for AI model integration.
 * Provides a consistent structure for AI model nodes with standard inputs and outputs.
 */

import React, { ReactNode } from 'react';
import { NodeProps } from 'reactflow';
import { BaseNode } from './BaseNode';
import { Bot } from 'lucide-react';

interface AIModelNodeProps extends NodeProps {
  title: string;
  icon?: ReactNode;
  description?: string;
  headerActions?: ReactNode;
  children?: ReactNode;
  // AI model specific props
  inputNames?: string[];
  outputNames?: string[];
}

export function AIModelNode({
  title,
  icon = <Bot size={16} />,
  description,
  headerActions,
  children,
  inputNames = ['prompt'],
  outputNames = ['response'],
  ...props
}: AIModelNodeProps) {
  // Convert input and output names to port definitions
  const inputs = inputNames.map(name => ({
    id: name,
    label: name.charAt(0).toUpperCase() + name.slice(1), // Capitalize
  }));
  
  const outputs = outputNames.map(name => ({
    id: name,
    label: name.charAt(0).toUpperCase() + name.slice(1), // Capitalize
  }));
  
  return (
    <BaseNode
      title={title}
      icon={icon}
      description={description}
      headerActions={headerActions}
      inputs={inputs}
      outputs={outputs}
      {...props}
    >
      {children}
    </BaseNode>
  );
}
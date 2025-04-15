/**
 * DataTransformNode
 * 
 * A specialized node template for data transformation operations.
 * Provides a consistent structure for nodes that process and transform data.
 */

import React, { ReactNode } from 'react';
import { NodeProps } from 'reactflow';
import { BaseNode } from './BaseNode';
import { FileJson } from 'lucide-react';

interface DataTransformNodeProps extends NodeProps {
  title: string;
  icon?: ReactNode;
  description?: string;
  headerActions?: ReactNode;
  children?: ReactNode;
  // Data transform specific props
  inputNames?: string[];
  outputNames?: string[];
}

export function DataTransformNode({
  title,
  icon = <FileJson size={16} />,
  description,
  headerActions,
  children,
  inputNames = ['input'],
  outputNames = ['output'],
  ...props
}: DataTransformNodeProps) {
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
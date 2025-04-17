/**
 * Node Content
 * 
 * A consistent content wrapper for workflow nodes that provides padding and styling.
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface NodeContentProps {
  children: React.ReactNode;
  className?: string;
}

export const NodeContent: React.FC<NodeContentProps> = ({
  children,
  className,
}) => {
  return (
    <div className={cn('p-3', className)}>
      {children}
    </div>
  );
};

export default NodeContent;
/**
 * NodeContent
 * 
 * Content container for nodes with consistent padding and spacing.
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface NodeContentProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'small' | 'normal' | 'large';
}

export function NodeContent({
  children,
  className,
  padding = 'normal'
}: NodeContentProps) {
  const paddingClass = {
    none: 'p-0',
    small: 'px-3 py-2',
    normal: 'px-3 py-2.5',
    large: 'p-4'
  }[padding];

  return (
    <div className={cn(
      paddingClass,
      'flex flex-col gap-2.5 bg-white rounded-b-md',
      className
    )}>
      {children}
    </div>
  );
}
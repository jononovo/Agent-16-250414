/**
 * NodeContainer
 * 
 * Base container component for all node UIs.
 * Provides consistent styling, padding, and border-radius.
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface NodeContainerProps {
  children: React.ReactNode;
  selected?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function NodeContainer({
  children,
  selected = false,
  className,
  style
}: NodeContainerProps) {
  return (
    <div
      className={cn(
        'rounded-md border bg-white text-card-foreground shadow-md transition-all',
        'min-w-[200px] max-w-[320px]',
        selected ? 'border-primary shadow-lg ring-2 ring-primary/20' : 'border-gray-200',
        className
      )}
      style={style}
    >
      {children}
    </div>
  );
}
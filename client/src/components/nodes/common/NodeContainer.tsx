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
        'rounded-md border bg-card text-card-foreground shadow-sm transition-all',
        'min-w-[180px] max-w-[320px]',
        selected ? 'border-primary/70 shadow-md' : 'border-border',
        className
      )}
      style={style}
    >
      {children}
    </div>
  );
}
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
        'rounded-md border bg-white text-gray-800 shadow-sm transition-all',
        'min-w-[240px] max-w-[320px]',
        selected ? 'border-indigo-500 shadow-md ring-2 ring-indigo-500/20' : 'border-gray-200/80',
        className
      )}
      style={{
        ...style,
        fontFamily: 'Inter, system-ui, sans-serif'
      }}
    >
      {children}
    </div>
  );
}
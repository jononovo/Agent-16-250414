/**
 * NodeHeader
 * 
 * Header component for nodes with title, icon, and optional actions.
 */

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger 
} from '@/components/ui/tooltip';

interface NodeHeaderProps {
  title: string;
  icon?: React.ReactNode | string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function NodeHeader({
  title,
  icon,
  description,
  actions,
  className
}: NodeHeaderProps) {
  return (
    <div className={cn(
      'flex items-center justify-between p-3 border-b border-border',
      'bg-muted/40 rounded-t-md',
      className
    )}>
      <div className="flex items-center gap-2 overflow-hidden">
        {icon && (
          <div className="flex-shrink-0">
            {typeof icon === 'string' ? (
              <div className="flex items-center justify-center w-6 h-6 text-primary">
                {icon}
              </div>
            ) : (
              icon
            )}
          </div>
        )}
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <h3 className="text-sm font-medium truncate">
                {title}
              </h3>
            </TooltipTrigger>
            {description && (
              <TooltipContent side="top">
                <p className="max-w-xs text-xs">{description}</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </div>
      
      {actions && (
        <div className="flex items-center ml-2">
          {actions}
        </div>
      )}
    </div>
  );
}
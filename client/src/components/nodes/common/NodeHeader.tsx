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
      'flex items-center justify-between px-3 py-2.5 border-b',
      'border-gray-100 bg-white rounded-t-md',
      className
    )}>
      <div className="flex items-center gap-2.5 overflow-hidden">
        {icon && (
          <div className="flex-shrink-0">
            {typeof icon === 'string' ? (
              <div className="flex items-center justify-center w-8 h-8 text-primary rounded-md bg-gray-50">
                {icon}
              </div>
            ) : (
              icon
            )}
          </div>
        )}
        
        <div className="flex flex-col">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <h3 className="text-sm font-semibold truncate text-gray-800 leading-tight">
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
          
          {description && (
            <p className="text-xs text-gray-500 truncate max-w-[180px] leading-tight mt-0.5">
              {description}
            </p>
          )}
        </div>
      </div>
      
      {actions && (
        <div className="flex items-center ml-2">
          {actions}
        </div>
      )}
    </div>
  );
}
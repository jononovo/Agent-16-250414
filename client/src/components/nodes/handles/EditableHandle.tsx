/**
 * EditableHandle
 * 
 * A handle component that can be edited by the user.
 * Allows adding, removing, and renaming connection points dynamically.
 */

import React, { useState } from 'react';
import { Handle, Position, useUpdateNodeInternals } from 'reactflow';
import { cn } from '@/lib/utils';
import { Edit2, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface EditableHandleProps {
  id: string;
  type: 'source' | 'target';
  position: Position;
  label: string;
  isConnectable?: boolean;
  onLabelChange?: (id: string, newLabel: string) => void;
  onDelete?: (id: string) => void;
  className?: string;
}

export function EditableHandle({
  id,
  type,
  position,
  label,
  isConnectable = true,
  onLabelChange,
  onDelete,
  className
}: EditableHandleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedLabel, setEditedLabel] = useState(label);
  const updateNodeInternals = useUpdateNodeInternals();
  
  // Determine style based on position
  const isHorizontal = position === Position.Left || position === Position.Right;
  const isInput = type === 'target';
  
  const handleEdit = () => {
    setIsEditing(true);
  };
  
  const handleSave = () => {
    if (onLabelChange && editedLabel.trim() !== '') {
      onLabelChange(id, editedLabel);
      updateNodeInternals(id);
    }
    setIsEditing(false);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setEditedLabel(label);
      setIsEditing(false);
    }
  };
  
  const handleDeleteClick = () => {
    if (onDelete) {
      onDelete(id);
      updateNodeInternals(id);
    }
  };
  
  return (
    <div className={cn(
      'relative flex items-center my-2',
      isHorizontal ? 'flex-row' : 'flex-col',
      isInput && position === Position.Left && 'flex-row',
      !isInput && position === Position.Right && 'flex-row-reverse',
      className
    )}>
      <Handle
        type={type}
        position={position}
        id={id}
        isConnectable={isConnectable}
        className={cn(
          'w-3 h-3 border-2 bg-background',
          type === 'target' ? 'border-blue-500' : 'border-green-500'
        )}
      />
      
      <div className={cn(
        'flex items-center',
        position === Position.Left && 'ml-2',
        position === Position.Right && 'mr-2'
      )}>
        {isEditing ? (
          <Input
            value={editedLabel}
            onChange={(e) => setEditedLabel(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            autoFocus
            size={10}
            className="h-6 px-1 py-0 text-xs"
          />
        ) : (
          <>
            <span className="text-xs text-muted-foreground">{label}</span>
            <button
              onClick={handleEdit}
              className="ml-1 opacity-50 hover:opacity-100 focus:opacity-100"
            >
              <Edit2 size={10} />
            </button>
            {onDelete && (
              <button
                onClick={handleDeleteClick}
                className="ml-1 text-destructive opacity-50 hover:opacity-100 focus:opacity-100"
              >
                <X size={10} />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
"use client";

import React, { useState } from 'react';
import { Handle, Position, useReactFlow } from 'reactflow';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Pencil, Trash2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EditableHandleProps {
  nodeId: string;
  handleId: string;
  name: string;
  description?: string;
  type: 'source' | 'target';
  position: Position;
  wrapperClassName?: string;
  handleClassName?: string;
  onUpdateTool?: (handleId: string, name: string, description?: string) => boolean;
  onDelete?: (handleId: string) => void;
}

export function EditableHandle({
  nodeId,
  handleId,
  name,
  description,
  type,
  position,
  wrapperClassName,
  handleClassName,
  onUpdateTool,
  onDelete,
}: EditableHandleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(name);
  const [newDescription, setNewDescription] = useState(description || '');

  const handleSave = () => {
    if (onUpdateTool) {
      const success = onUpdateTool(handleId, newName, newDescription);
      if (success) {
        setIsEditing(false);
      }
    }
  };

  const handleCancel = () => {
    setNewName(name);
    setNewDescription(description || '');
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(handleId);
    }
  };

  return (
    <div className={cn("flex items-center gap-2 relative px-4 py-2", wrapperClassName)}>
      <Handle
        id={handleId}
        type={type}
        position={position}
        className={cn("!w-3 !h-3 bg-blue-500", handleClassName)}
        data-label={name}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium truncate">{name}</div>
          <div className="flex gap-1">
            <button
              onClick={() => setIsEditing(true)}
              className="p-1 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Edit handle"
            >
              <Pencil className="h-3 w-3" />
            </button>
            {onDelete && (
              <button
                onClick={handleDelete}
                className="p-1 text-muted-foreground hover:text-red-500 transition-colors"
                aria-label="Delete handle"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
        {description && <div className="text-xs text-muted-foreground truncate">{description}</div>}
      </div>

      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Handle</DialogTitle>
            <DialogDescription>
              Update handle name and description
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Textarea
                id="description"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                className="col-span-3"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSave}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface EditableHandleDialogProps {
  children: React.ReactNode;
  variant: 'create' | 'edit';
  label: string;
  description?: string;
  onSave: (name: string, description?: string) => boolean;
  onCancel: () => void;
  align?: 'start' | 'center' | 'end';
}

export function EditableHandleDialog({
  children,
  variant,
  label,
  description,
  onSave,
  onCancel,
  align = 'center',
}: EditableHandleDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState(label);
  const [desc, setDesc] = useState(description || '');

  const handleSave = () => {
    const success = onSave(name, desc);
    if (success) {
      setIsOpen(false);
    }
  };

  const handleCancel = () => {
    setName(label);
    setDesc(description || '');
    setIsOpen(false);
    onCancel();
  };

  const dialogTitle = variant === 'create' ? 'Add New Handle' : 'Edit Handle';
  const dialogDescription = variant === 'create'
    ? 'Create a new connection point for this node'
    : 'Edit the details for this connection point';

  return (
    <>
      <div className={cn("flex", {
        "justify-start": align === 'start',
        "justify-center": align === 'center',
        "justify-end": align === 'end',
      })}>
        <div onClick={() => setIsOpen(true)}>{children}</div>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
            <DialogDescription>
              {dialogDescription}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="handle-name" className="text-right">
                Name
              </Label>
              <Input
                id="handle-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="col-span-3"
                placeholder="Input/output name"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="handle-description" className="text-right">
                Description
              </Label>
              <Textarea
                id="handle-description"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                className="col-span-3"
                placeholder="Optional description"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSave}>
              {variant === 'create' ? 'Create' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
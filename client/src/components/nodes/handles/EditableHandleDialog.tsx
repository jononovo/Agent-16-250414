/**
 * EditableHandleDialog
 * 
 * A dialog component to create or edit handle information such as name and description.
 * Used for dynamically adding or editing inputs/outputs on node components.
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

// Form schema for validation
const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export interface EditableHandleDialogProps {
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
  description = '',
  onSave,
  onCancel,
  align = 'center',
}: EditableHandleDialogProps) {
  const [open, setOpen] = useState(false);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: label,
      description: description || '',
    },
  });
  
  const handleOpen = () => {
    setOpen(true);
    // Reset form when opening
    form.reset({
      name: label,
      description: description || '',
    });
  };
  
  const handleClose = () => {
    setOpen(false);
    onCancel();
  };
  
  const handleSubmit = (values: FormValues) => {
    const success = onSave(values.name, values.description);
    if (success) {
      setOpen(false);
    }
  };
  
  return (
    <>
      <div onClick={handleOpen}>{children}</div>
      
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {variant === 'create' ? 'Add New Handle' : 'Edit Handle'}
            </DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 pt-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter handle name" {...field} />
                    </FormControl>
                    <FormDescription>
                      This will be displayed as the handle's label
                    </FormDescription>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter a description for this handle"
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Describe what data this handle expects or provides
                    </FormDescription>
                  </FormItem>
                )}
              />
              
              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button type="submit">
                  {variant === 'create' ? 'Create' : 'Save Changes'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
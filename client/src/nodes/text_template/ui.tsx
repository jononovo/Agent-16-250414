/**
 * Text Template Node UI Component
 * 
 * This component provides an interface for creating text templates with variable substitution
 */

import React, { useState } from 'react';
import { Handle, Position } from 'reactflow';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TextTemplateNodeData } from './executor';

export const defaultData: TextTemplateNodeData = {
  template: 'Hello, {{name}}!'
};

export const component: React.FC<{
  data: TextTemplateNodeData;
  onChange: (data: TextTemplateNodeData) => void;
}> = ({ data, onChange }) => {
  const [template, setTemplate] = useState(data.template || defaultData.template);

  const handleTemplateChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newTemplate = e.target.value;
    setTemplate(newTemplate);
    onChange({ ...data, template: newTemplate });
  };

  // Extract variable names from template for display
  const extractVariables = (template: string): string[] => {
    if (!template) return [];
    
    const matches = template.match(/{{([^{}]+)}}/g) || [];
    return matches.map(match => match.slice(2, -2).trim())
      .filter((value, index, self) => self.indexOf(value) === index); // Remove duplicates
  };

  const variables = extractVariables(template);

  return (
    <div className="text-template-node">
      <Handle type="target" position={Position.Left} id="input" />
      
      <Card className="w-[400px]">
        <CardHeader className="pb-2">
          <CardTitle className="text-md">Text Template</CardTitle>
          <CardDescription className="text-xs">Create template with variable substitution</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="template">Template Text</Label>
              <Textarea
                id="template"
                value={template}
                onChange={handleTemplateChange}
                className="font-mono text-sm min-h-[100px]"
                placeholder="Enter template text with {{variables}}..."
              />
            </div>
            
            {variables.length > 0 && (
              <div className="text-xs">
                <Label>Variables Used</Label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {variables.map((variable, index) => (
                    <div key={index} className="px-2 py-1 bg-muted rounded-md">
                      {variable}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      <Handle type="source" position={Position.Right} id="output" />
    </div>
  );
};

export const validator = (data: TextTemplateNodeData) => {
  const errors: string[] = [];
  
  if (!data.template || data.template.trim() === '') {
    errors.push('Template text cannot be empty');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};
/**
 * Text Template Node UI Component
 * 
 * This component provides an interface for creating text templates with variable placeholders
 */

import React, { useState } from 'react';
import { Handle, Position } from 'reactflow';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TextTemplateNodeData } from './executor';

export const defaultData: TextTemplateNodeData = {
  template: 'Hello, {{name}}!'
};

export function component({ 
  data, 
  onChange 
}: { 
  data: TextTemplateNodeData; 
  onChange: (data: TextTemplateNodeData) => void; 
}) {
  const [template, setTemplate] = useState(data.template || defaultData.template);
  
  // Extract variables from the template
  const extractVariables = (templateText: string): string[] => {
    const matches = templateText.match(/\{\{([^}]+)\}\}/g) || [];
    return matches.map(match => match.replace(/\{\{|\}\}/g, '').trim());
  };
  
  const variables = extractVariables(template);
  
  const handleTemplateChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newTemplate = e.target.value;
    setTemplate(newTemplate);
    onChange({ ...data, template: newTemplate });
  };

  return (
    <div className="text-template-node">
      <Handle type="target" position={Position.Left} id="variables" />
      
      <Card className="w-[400px]">
        <CardHeader className="pb-2">
          <CardTitle className="text-md">Text Template</CardTitle>
          <CardDescription className="text-xs">Generate text using variable placeholders</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="template">Template</Label>
              <Textarea
                id="template"
                value={template}
                onChange={handleTemplateChange}
                className="font-mono text-sm min-h-[100px]"
                placeholder="Enter template with placeholders"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Use &#123;&#123;variableName&#125;&#125; syntax for variable placeholders
              </p>
            </div>
            
            {variables.length > 0 && (
              <div>
                <Label className="text-xs">Detected Variables</Label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {variables.map((variable, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {variable}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      <Handle type="source" position={Position.Right} id="text" />
    </div>
  );
};

export const validator = (data: TextTemplateNodeData) => {
  const errors: string[] = [];
  
  if (!data.template || data.template.trim() === '') {
    errors.push('Template cannot be empty');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};
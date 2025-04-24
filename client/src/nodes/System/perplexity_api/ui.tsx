/**
 * Perplexity API Node UI Component
 * 
 * This component renders the UI for the Perplexity API node in the workflow editor.
 * It follows the Simple AI Dev inspired design system and uses the DefaultNode wrapper.
 */

import React, { useState, memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Brain } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { NodeValidationResult } from '@/lib/types';
import DefaultNode from '@/nodes/Default/ui';
import { PerplexityApiNodeData, defaultData } from './executor';

// Re-export defaultData from executor
export { defaultData } from './executor';

// List of available Perplexity models
const PERPLEXITY_MODELS = [
  { value: 'llama-3.1-sonar-small-128k-online', label: 'Llama 3.1 Sonar Small' },
  { value: 'llama-3.1-sonar-large-128k-online', label: 'Llama 3.1 Sonar Large' },
  { value: 'llama-3.1-sonar-huge-128k-online', label: 'Llama 3.1 Sonar Huge' },
  { value: 'pplx-7b-online', label: 'PPLX 7B Online' },
  { value: 'pplx-70b-online', label: 'PPLX 70B Online' },
  { value: 'mistral-7b-instruct', label: 'Mistral 7B Instruct' },
  { value: 'llama-2-70b-chat', label: 'Llama 2 70B Chat' },
  { value: 'mixtral-8x7b-instruct', label: 'Mixtral 8x7B Instruct' }
];

// Validator function for node data
export const validator = (data: PerplexityApiNodeData): NodeValidationResult => {
  const errors: string[] = [];
  
  if (!data.apiKey) {
    errors.push('API key is required');
  }
  
  if (data.temperature < 0 || data.temperature > 1) {
    errors.push('Temperature must be between 0 and 1');
  }
  
  if (data.maxTokens < 1) {
    errors.push('Max tokens must be at least 1');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

// UI component for the Perplexity node using DefaultNode wrapper
export const component = memo(({ data, id, selected, isConnectable }: NodeProps<PerplexityApiNodeData>) => {
  // Combine default data with passed data
  const nodeData = { ...defaultData, ...data };
  
  // Format temperature value for display
  const formatTemperature = (temp: number) => temp.toFixed(1);
  
  // Create icon element for the header
  const iconElement = (
    <div className="bg-primary/10 p-1.5 rounded-md">
      <Brain className="h-4 w-4 text-primary" />
    </div>
  );
  
  // Create the custom content for the node
  const customContent = (
    <>
      {/* API Status */}
      {!nodeData.apiKey && (
        <div className="mt-2 p-2 bg-amber-100/50 text-amber-800 text-xs rounded-md">
          Perplexity API key required in settings
        </div>
      )}
      
      {/* Selected Model & Temperature */}
      <div className="mt-2 flex flex-col gap-1">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Model:</span>
          <span className="font-medium">{
            PERPLEXITY_MODELS.find(m => m.value === nodeData.model)?.label || nodeData.model
          }</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Temperature:</span>
          <span className="font-medium">{nodeData.temperature.toFixed(1)}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Max Tokens:</span>
          <span className="font-medium">{nodeData.maxTokens}</span>
        </div>
      </div>
      
      {/* Input Handles */}
      <Handle
        type="target"
        position={Position.Left}
        id="prompt"
        style={{ 
          top: 60, 
          width: '10px', 
          height: '10px', 
          background: 'white',
          border: '2px solid #3b82f6'
        }}
        isConnectable={isConnectable}
      />
      <div className="absolute left-2 top-[56px] text-xs text-muted-foreground text-left">
        Prompt
      </div>
      
      {nodeData.useSystemPrompt && (
        <>
          <Handle
            type="target"
            position={Position.Left}
            id="system"
            style={{ 
              top: 90, 
              width: '10px', 
              height: '10px', 
              background: 'white',
              border: '2px solid #3b82f6'
            }}
            isConnectable={isConnectable}
          />
          <div className="absolute left-2 top-[86px] text-xs text-muted-foreground text-left">
            System
          </div>
        </>
      )}
      
      {/* Output Handles */}
      <Handle
        type="source"
        position={Position.Right}
        id="response"
        style={{ 
          top: 60, 
          width: '10px', 
          height: '10px', 
          background: 'white',
          border: '2px solid #10b981'
        }}
        isConnectable={isConnectable}
      />
      <div className="absolute right-2 top-[56px] text-xs text-muted-foreground text-right">
        Response
      </div>
      
      <Handle
        type="source"
        position={Position.Right}
        id="metadata"
        style={{ 
          top: 90, 
          width: '10px', 
          height: '10px', 
          background: 'white',
          border: '2px solid #10b981'
        }}
        isConnectable={isConnectable}
      />
      <div className="absolute right-2 top-[86px] text-xs text-muted-foreground text-right">
        Metadata
      </div>
    </>
  );
  
  // Create node settings definition
  const settings = {
    title: 'Perplexity API Settings',
    fields: [
      {
        key: 'model',
        label: 'Model',
        type: 'select' as const,
        description: 'Perplexity AI model to use',
        options: PERPLEXITY_MODELS.map(model => ({ 
          value: model.value, 
          label: model.label 
        }))
      },
      {
        key: 'apiKey',
        label: 'API Key',
        type: 'text' as const,
        description: 'Your Perplexity API key'
      },
      {
        key: 'temperature',
        label: 'Temperature',
        type: 'slider' as const,
        description: 'Controls randomness (0-1)',
        min: 0,
        max: 1,
        step: 0.1
      },
      {
        key: 'maxTokens',
        label: 'Max Tokens',
        type: 'number' as const,
        description: 'Maximum number of tokens to generate'
      },
      {
        key: 'useSystemPrompt',
        label: 'Use System Prompt',
        type: 'checkbox' as const,
        description: 'Enable system prompt input'
      },
      {
        key: 'systemPrompt',
        label: 'System Prompt',
        type: 'textarea' as const,
        description: 'Instructions for the AI assistant'
      }
    ]
  };
  
  // Enhanced data with settings and icon
  const enhancedData = {
    ...nodeData,
    icon: iconElement,
    settings,
    label: "Perplexity API",
    description: "Generate text using Perplexity's AI models",
    // These properties define custom content to render inside the DefaultNode
    childrenContent: customContent,
    // Don't render the default handles since we're adding our own
    hideDefaultHandles: true
  };
  
  // Return the default node wrapper with our customizations
  return <DefaultNode 
    data={enhancedData}
    id={id} 
    selected={selected}
    isConnectable={isConnectable}
    type="perplexity_api"
  />;
});
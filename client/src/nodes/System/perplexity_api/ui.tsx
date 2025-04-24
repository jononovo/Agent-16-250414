/**
 * Perplexity API Node UI Component
 * 
 * This component renders a custom implementation of the Perplexity API node
 * with settings drawer integration but without using the full DefaultNode wrapper.
 */

import React, { memo, useEffect } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Brain, Settings, Lock } from 'lucide-react';
import { NodeContainer } from '@/components/nodes/common/NodeContainer';
import { NodeContent } from '@/components/nodes/common/NodeContent';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { NodeValidationResult } from '@/lib/types';
import { cn } from '@/lib/utils';
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

// UI component for the Perplexity node (custom implementation)
export const component = memo(({ data, id, selected, isConnectable }: NodeProps<PerplexityApiNodeData>) => {
  // Combine default data with passed data
  const nodeData = { ...defaultData, ...data };
  
  // Register with settings drawer
  useEffect(() => {
    // Define the settings for the global settings drawer
    const settings = {
      title: 'Perplexity API Settings',
      fields: [
        {
          key: 'model',
          label: 'Model',
          type: 'select',
          description: 'Perplexity AI model to use',
          options: PERPLEXITY_MODELS.map(model => ({ 
            value: model.value, 
            label: model.label 
          }))
        },
        {
          key: 'apiKey',
          label: 'API Key',
          type: 'text',
          description: 'Your Perplexity API key'
        },
        {
          key: 'temperature',
          label: 'Temperature',
          type: 'slider',
          description: 'Controls randomness (0-1)',
          min: 0,
          max: 1,
          step: 0.1
        },
        {
          key: 'maxTokens',
          label: 'Max Tokens',
          type: 'number',
          description: 'Maximum number of tokens to generate'
        },
        {
          key: 'useSystemPrompt',
          label: 'Use System Prompt',
          type: 'checkbox',
          description: 'Enable system prompt input'
        },
        {
          key: 'systemPrompt',
          label: 'System Prompt',
          type: 'textarea',
          description: 'Instructions for the AI assistant'
        }
      ]
    };
    
    // Add the settings to the node data
    const onChangeHandler = (data as any).onChange;
    if (typeof onChangeHandler === 'function') {
      onChangeHandler({
        ...data,
        settings,
        label: "Perplexity API",
        description: "Generate text using Perplexity's AI models"
      });
    }
  }, [id, data]);
  
  // Settings button click handler to open global settings drawer
  const handleSettingsClick = () => {
    const event = new CustomEvent('node-settings-open', {
      detail: { nodeId: id }
    });
    window.dispatchEvent(event);
  };
  
  // Format temperature value for display
  const formatTemperature = (temp: number) => temp.toFixed(1);
  
  return (
    <NodeContainer selected={selected} className="overflow-visible">
      {/* Header */}
      <div className={cn(
        'flex items-center justify-between p-3 border-b border-border rounded-t-md',
        'bg-gradient-to-r from-purple-500/10 to-blue-500/10'
      )}>
        <div className="flex items-center gap-2">
          <div className="flex-shrink-0 p-1.5 rounded-md bg-indigo-100 text-indigo-600">
            <Brain className="h-4 w-4" />
          </div>
          <h3 className="text-sm font-medium truncate text-indigo-700">Perplexity API</h3>
        </div>
        <div className="flex items-center gap-1">
          {!nodeData.apiKey && (
            <Badge variant="outline" className="px-1.5 py-0 h-5 text-amber-600 border-amber-200 bg-amber-50">
              <Lock size={11} className="mr-1" /> Key Required
            </Badge>
          )}
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 text-indigo-600"
            onClick={handleSettingsClick}
          >
            <Settings size={14} />
          </Button>
        </div>
      </div>
      
      {/* Content */}
      <NodeContent padding="normal">
        {/* API Status Warning */}
        {!nodeData.apiKey && (
          <div className="mt-1 p-2 bg-amber-100/50 text-amber-800 text-xs rounded-md">
            Perplexity API key required in settings
          </div>
        )}
        
        {/* Settings Summary */}
        <div className="mt-2 mb-3 flex flex-col gap-1.5 text-slate-700">
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Model:</span>
            <span className="font-medium">{
              PERPLEXITY_MODELS.find(m => m.value === nodeData.model)?.label || nodeData.model
            }</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Temperature:</span>
            <span className="font-medium">{nodeData.temperature.toFixed(1)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Max Tokens:</span>
            <span className="font-medium">{nodeData.maxTokens}</span>
          </div>
        </div>
        
        {/* Input & Output portals */}
        <div className="relative pt-4 pb-2">
          {/* Input Handles */}
          <Handle
            type="target"
            position={Position.Left}
            id="prompt"
            style={{ 
              top: 50, 
              width: '12px', 
              height: '12px', 
              background: 'white',
              border: '2px solid #6366f1'
            }}
            isConnectable={isConnectable}
          />
          <div className="absolute left-2 top-[46px] text-xs text-slate-500 text-left">
            Prompt
          </div>
          
          {nodeData.useSystemPrompt && (
            <>
              <Handle
                type="target"
                position={Position.Left}
                id="system"
                style={{ 
                  top: 80, 
                  width: '12px', 
                  height: '12px', 
                  background: 'white',
                  border: '2px solid #6366f1'
                }}
                isConnectable={isConnectable}
              />
              <div className="absolute left-2 top-[76px] text-xs text-slate-500 text-left">
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
              top: 50, 
              width: '12px', 
              height: '12px', 
              background: 'white',
              border: '2px solid #10b981'
            }}
            isConnectable={isConnectable}
          />
          <div className="absolute right-2 top-[46px] text-xs text-slate-500 text-right">
            Response
          </div>
          
          <Handle
            type="source"
            position={Position.Right}
            id="metadata"
            style={{ 
              top: 80, 
              width: '12px', 
              height: '12px', 
              background: 'white',
              border: '2px solid #10b981'
            }}
            isConnectable={isConnectable}
          />
          <div className="absolute right-2 top-[76px] text-xs text-slate-500 text-right">
            Metadata
          </div>
        </div>
      </NodeContent>
    </NodeContainer>
  );
});
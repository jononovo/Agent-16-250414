/**
 * Perplexity API Node UI Component
 * 
 * This component renders the UI for the Perplexity API node in the workflow editor.
 * It follows the Simple AI Dev inspired design system.
 */

import React, { useState } from 'react';
import { Handle, Position } from 'reactflow';
import { Brain, Settings, Lock, Info } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { NodeUIComponentProps, NodeValidationResult } from '@/lib/types';
import { cn } from '@/lib/utils';
import { PerplexityApiNodeData } from './executor';

// Re-export defaultData from executor
export { defaultData } from './executor';

// List of available Perplexity models
const PERPLEXITY_MODELS = [
  { value: 'pplx-7b-online', label: 'PPLX 7B Online' },
  { value: 'pplx-70b-online', label: 'PPLX 70B Online' },
  { value: 'pplx-7b-chat', label: 'PPLX 7B Chat' },
  { value: 'pplx-70b-chat', label: 'PPLX 70B Chat' },
  { value: 'mistral-7b-instruct', label: 'Mistral 7B Instruct' },
  { value: 'llama-2-70b-chat', label: 'Llama 2 70B Chat' },
  { value: 'codellama-34b-instruct', label: 'CodeLlama 34B Instruct' },
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

// UI component for the Perplexity node
export const component: React.FC<NodeUIComponentProps<PerplexityApiNodeData>> = ({ 
  data, 
  onChange
}) => {
  const [activeTab, setActiveTab] = useState('settings');
  
  // Handler for data changes
  const handleDataChange = (key: string, value: any) => {
    onChange({
      ...data,
      [key]: value
    });
  };
  
  // Format temperature value for display
  const formatTemperature = (temp: number) => temp.toFixed(1);
  
  // Determine if node is selected based on wrapper props
  const selected = false; // This would come from wrapper component
  const isConnectable = true; // This would come from wrapper component
  
  return (
    <div className={cn(
      'rounded-md border bg-card text-card-foreground shadow-sm transition-all',
      'min-w-[280px] max-w-[320px]',
      selected ? 'border-primary/70 shadow-md' : 'border-border'
    )}>
      {/* Node Header */}
      <div className="flex items-center justify-between p-3 border-b border-border bg-muted/40 rounded-t-md">
        <div className="flex items-center gap-2">
          <div className="flex-shrink-0 text-primary">
            <Brain size={16} />
          </div>
          <h3 className="text-sm font-medium truncate">Perplexity API</h3>
        </div>
        <div className="flex items-center gap-1">
          {!data.apiKey && (
            <div className="text-amber-500">
              <Lock size={14} />
            </div>
          )}
          {selected && (
            <TabsList className="h-7 p-0">
              <TabsTrigger
                value="settings"
                className="h-7 px-2 text-xs"
                onClick={() => setActiveTab('settings')}
              >
                <Settings size={12} className="mr-1" />
                Settings
              </TabsTrigger>
              <TabsTrigger
                value="system"
                className="h-7 px-2 text-xs"
                onClick={() => setActiveTab('system')}
              >
                <Info size={12} className="mr-1" />
                System
              </TabsTrigger>
            </TabsList>
          )}
        </div>
      </div>
      
      {/* Node Content */}
      <div className="p-0">
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
        <div className="relative py-1 ml-6 my-1 text-xs text-muted-foreground">
          Prompt
        </div>
        
        {data.useSystemPrompt && (
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
            <div className="relative py-1 ml-6 my-1 text-xs text-muted-foreground">
              System
            </div>
          </>
        )}
        
        <Tabs value={activeTab} className="w-full">
          <TabsContent value="settings" className="p-3 space-y-3 mt-0">
            {/* Model Selection */}
            <div className="space-y-1">
              <Label htmlFor="model" className="text-xs">Model</Label>
              <Select
                value={data.model}
                onValueChange={(value) => handleDataChange('model', value)}
              >
                <SelectTrigger id="model" className="h-8 text-xs">
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent>
                  {PERPLEXITY_MODELS.map((model) => (
                    <SelectItem key={model.value} value={model.value} className="text-xs">
                      {model.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* API Key */}
            <div className="space-y-1">
              <Label htmlFor="apiKey" className="text-xs">API Key</Label>
              <div className="flex gap-1">
                <Input
                  id="apiKey"
                  type="password"
                  value={data.apiKey || ''}
                  onChange={(e) => handleDataChange('apiKey', e.target.value)}
                  placeholder="Enter your Perplexity API key"
                  className="h-8 text-xs flex-1"
                />
              </div>
            </div>
            
            {/* Temperature */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <Label htmlFor="temperature" className="text-xs">Temperature: {formatTemperature(data.temperature)}</Label>
              </div>
              <Slider
                id="temperature"
                min={0}
                max={1}
                step={0.1}
                value={[data.temperature]}
                onValueChange={([value]) => handleDataChange('temperature', value)}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Precise</span>
                <span>Creative</span>
              </div>
            </div>
            
            {/* Max Tokens */}
            <div className="space-y-1">
              <Label htmlFor="maxTokens" className="text-xs">Max Tokens</Label>
              <Input
                id="maxTokens"
                type="number"
                value={data.maxTokens}
                onChange={(e) => handleDataChange('maxTokens', parseInt(e.target.value) || 0)}
                className="h-8 text-xs"
              />
            </div>
            
            {/* System Prompt Toggle */}
            <div className="flex items-center space-x-2">
              <Switch
                id="useSystemPrompt"
                checked={data.useSystemPrompt}
                onCheckedChange={(checked) => handleDataChange('useSystemPrompt', checked)}
              />
              <Label htmlFor="useSystemPrompt" className="text-xs">Use System Prompt</Label>
            </div>
          </TabsContent>
          
          <TabsContent value="system" className="p-3 space-y-3 mt-0">
            {/* System Prompt */}
            <div className="space-y-1">
              <Label htmlFor="systemPrompt" className="text-xs">System Prompt</Label>
              <Textarea
                id="systemPrompt"
                value={data.systemPrompt}
                onChange={(e) => handleDataChange('systemPrompt', e.target.value)}
                placeholder="Enter system instructions..."
                className="h-[120px] text-xs resize-none"
                disabled={!data.useSystemPrompt}
              />
              <p className="text-xs text-muted-foreground">
                Sets the behavior of the AI assistant. 
                {!data.useSystemPrompt && " Enable system prompt in Settings."}
              </p>
            </div>
          </TabsContent>
        </Tabs>
        
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
        <div className="relative py-1 mr-6 my-1 text-xs text-muted-foreground text-right">
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
        <div className="relative py-1 mr-6 my-1 text-xs text-muted-foreground text-right">
          Metadata
        </div>
      </div>
    </div>
  );
};
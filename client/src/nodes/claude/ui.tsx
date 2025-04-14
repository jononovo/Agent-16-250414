/**
 * Claude Node UI Component
 * 
 * This file contains the React component used to render the Claude node
 * in the workflow editor.
 */

import React, { useState } from 'react';
import { Handle, Position } from 'reactflow';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Default data for the node
export const defaultData = {
  prompt: '',
  model: 'claude-3-7-sonnet-20250219',
  temperature: 0.7,
  maxTokens: 1000,
  systemPrompt: '',
  apiKey: '' // Added API key field
};

// Validator for the node data
export const validator = (data: any) => {
  const errors = [];
  
  if (!data.prompt) {
    errors.push('Prompt is required');
  }
  
  if (data.temperature < 0 || data.temperature > 1) {
    errors.push('Temperature must be between 0 and 1');
  }
  
  if (data.maxTokens < 1 || data.maxTokens > 4096) {
    errors.push('Max tokens must be between 1 and 4096');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

// React component for the node
export const component = ({ data, isConnectable }: any) => {
  const [localModel, setLocalModel] = useState(data.model || 'claude-3-7-sonnet-20250219');
  const [localTemperature, setLocalTemperature] = useState(data.temperature !== undefined ? data.temperature : 0.7);
  const [localMaxTokens, setLocalMaxTokens] = useState(data.maxTokens || 1000);
  const [localPrompt, setLocalPrompt] = useState(data.prompt || '');
  const [localSystemPrompt, setLocalSystemPrompt] = useState(data.systemPrompt || '');
  const [localApiKey, setLocalApiKey] = useState(data.apiKey || '');
  
  // Update the node data when values change
  const updateNodeData = (updates: Record<string, any>) => {
    if (data && typeof data.onChange === 'function') {
      data.onChange({
        ...data,
        ...updates
      });
    }
  };
  
  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setLocalPrompt(newValue);
    updateNodeData({ prompt: newValue });
  };
  
  const handleSystemPromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setLocalSystemPrompt(newValue);
    updateNodeData({ systemPrompt: newValue });
  };
  
  const handleModelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalModel(newValue);
    updateNodeData({ model: newValue });
  };
  
  const handleTemperatureChange = (value: number[]) => {
    setLocalTemperature(value[0]);
    updateNodeData({ temperature: value[0] });
  };
  
  const handleMaxTokensChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    setLocalMaxTokens(value);
    updateNodeData({ maxTokens: value });
  };
  
  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalApiKey(newValue);
    updateNodeData({ apiKey: newValue });
  };
  
  return (
    <div className="p-3 rounded-md bg-background border shadow-sm min-w-[320px]">
      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Top}
        id="prompt"
        isConnectable={isConnectable}
        className="w-2 h-2 bg-blue-500"
      />
      
      <Tabs defaultValue="prompt" className="w-full">
        <TabsList className="w-full mb-2">
          <TabsTrigger value="prompt" className="flex-1">Prompt</TabsTrigger>
          <TabsTrigger value="settings" className="flex-1">Settings</TabsTrigger>
          <TabsTrigger value="api" className="flex-1">API</TabsTrigger>
        </TabsList>
        
        <TabsContent value="prompt" className="space-y-2">
          <div>
            <Label htmlFor="prompt">Prompt</Label>
            <Textarea
              id="prompt"
              value={localPrompt}
              onChange={handlePromptChange}
              placeholder="Enter your prompt for Claude..."
              rows={4}
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="systemPrompt">System Prompt (Optional)</Label>
            <Textarea
              id="systemPrompt"
              value={localSystemPrompt}
              onChange={handleSystemPromptChange}
              placeholder="Enter system instructions for Claude..."
              rows={2}
              className="mt-1"
            />
          </div>
        </TabsContent>
        
        <TabsContent value="settings" className="space-y-3">
          <div>
            <Label htmlFor="model">Model</Label>
            <Input
              id="model"
              value={localModel}
              onChange={(e) => handleModelChange(e.target.value)}
              placeholder="claude-3-7-sonnet-20250219"
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Use the latest model identifier from Anthropic (e.g., claude-3-7-sonnet-20250219)
            </p>
          </div>
          
          <div>
            <Label>Temperature: {localTemperature.toFixed(1)}</Label>
            <Slider
              value={[localTemperature]}
              onValueChange={handleTemperatureChange}
              min={0}
              max={1}
              step={0.1}
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="maxTokens">Max Tokens</Label>
            <Input
              id="maxTokens"
              type="number"
              value={localMaxTokens}
              onChange={handleMaxTokensChange}
              min={1}
              max={4096}
              className="mt-1"
            />
          </div>
        </TabsContent>
        
        <TabsContent value="api" className="space-y-3">
          <div>
            <Label htmlFor="apiKey">Claude API Key (Optional)</Label>
            <Input
              id="apiKey"
              type="password"
              value={localApiKey || ''}
              onChange={handleApiKeyChange}
              placeholder="Enter your Claude API key for direct access"
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {localApiKey 
                ? "✓ API key entered - will use direct Claude API access" 
                : "Leave empty to use the server's environment API key"}
            </p>
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="response"
        isConnectable={isConnectable}
        className="w-2 h-2 bg-blue-500"
      />
    </div>
  );
};
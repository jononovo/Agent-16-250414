/**
 * Claude API Node UI Component
 * 
 * This component renders the Claude API node in the workflow editor
 * following Simple AI Dev's clean design aesthetic.
 */

import React, { useState, useEffect } from 'react';
import { Handle, Position } from 'reactflow';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Settings, Check, RotateCcw, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

// List of available Claude models
const CLAUDE_MODELS = [
  { value: 'claude-3-opus-20240229', label: 'Claude 3 Opus' },
  { value: 'claude-3-sonnet-20240229', label: 'Claude 3 Sonnet' },
  { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku' },
  { value: 'claude-3-5-sonnet-20240620', label: 'Claude 3.5 Sonnet' }
];

// Default data for the node
export const defaultData = {
  model: 'claude-3-sonnet-20240229',
  temperature: 0.7,
  maxTokens: 1000,
  systemPrompt: '',
  prompt: '',
  apiKey: '',
  status: 'idle' // idle, running, completed, error
};

// Validator for the node data
export const validator = (data: any) => {
  const errors: string[] = [];
  
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

// UI component for the Claude node
export const component = ({ data, isConnectable, selected }: any) => {
  const [showSettings, setShowSettings] = useState(false);
  const [localPrompt, setLocalPrompt] = useState(data.prompt || '');
  
  // Update local prompt when data changes externally
  useEffect(() => {
    if (data.prompt !== undefined) {
      setLocalPrompt(data.prompt);
    }
  }, [data.prompt]);
  
  // Handler for data changes
  const handleDataChange = (key: string, value: any) => {
    if (data && typeof data.onChange === 'function') {
      data.onChange({
        ...data,
        [key]: value
      });
    }
  };

  // Format temperature value for display
  const formatTemperature = (temp: number) => temp.toFixed(1);
  
  // Format token count with commas
  const formatTokens = (tokens: number) => tokens.toLocaleString();
  
  // Handle prompt changes with debouncing
  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setLocalPrompt(newValue);
    handleDataChange('prompt', newValue);
  };
  
  // Handle execution status and badge display
  const getStatusBadge = () => {
    switch (data.status) {
      case 'running':
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">Running</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">Completed</Badge>;
      case 'error':
        return <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">Error</Badge>;
      default:
        return null;
    }
  };
  
  return (
    <div className={cn(
      'bg-background rounded-xl border transition-all duration-200',
      'min-w-[300px] max-w-[400px]',
      selected ? 'border-primary shadow-md' : 'border-border/40'
    )}>
      {/* Node Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 p-1.5 rounded-md">
            <Sparkles size={16} className="text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-medium">Claude API</h3>
            <p className="text-xs text-muted-foreground">Generate content with Claude AI</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge()}
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8" 
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings size={16} />
          </Button>
        </div>
      </div>
      
      {/* Node Content */}
      <div className="p-4 space-y-4">
        {/* Prompt Input */}
        <div className="space-y-2">
          <Textarea
            placeholder="Enter your prompt for Claude..."
            value={localPrompt}
            onChange={handlePromptChange}
            className="resize-none min-h-[100px] text-sm"
          />
        </div>
        
        {/* Settings Panel */}
        {showSettings && (
          <div className="space-y-4 pt-2 border-t border-border/50">
            {/* Model Selection */}
            <div className="space-y-1.5">
              <Label htmlFor="model" className="text-xs font-medium">Model</Label>
              <Select
                value={data.model || defaultData.model}
                onValueChange={(value) => handleDataChange('model', value)}
              >
                <SelectTrigger id="model" className="h-8 text-xs">
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent>
                  {CLAUDE_MODELS.map((model) => (
                    <SelectItem key={model.value} value={model.value} className="text-xs">
                      {model.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* API Key */}
            <div className="space-y-1.5">
              <Label htmlFor="apiKey" className="text-xs font-medium">API Key</Label>
              <Input
                id="apiKey"
                type="password"
                value={data.apiKey || ''}
                onChange={(e) => handleDataChange('apiKey', e.target.value)}
                placeholder="Enter your Claude API key"
                className="h-8 text-xs"
              />
              {data.apiKey ? (
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <Check size={12} /> API key provided
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Will use environment API key if available
                </p>
              )}
            </div>
            
            {/* Temperature */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <Label htmlFor="temperature" className="text-xs font-medium">
                  Temperature: {formatTemperature(data.temperature !== undefined ? data.temperature : defaultData.temperature)}
                </Label>
              </div>
              <Slider
                id="temperature"
                min={0}
                max={1}
                step={0.1}
                value={[data.temperature !== undefined ? data.temperature : defaultData.temperature]}
                onValueChange={([value]) => handleDataChange('temperature', value)}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Precise</span>
                <span>Creative</span>
              </div>
            </div>
            
            {/* Max Tokens */}
            <div className="space-y-1.5">
              <Label htmlFor="maxTokens" className="text-xs font-medium">Max Tokens</Label>
              <Input
                id="maxTokens"
                type="number"
                value={data.maxTokens !== undefined ? data.maxTokens : defaultData.maxTokens}
                onChange={(e) => handleDataChange('maxTokens', parseInt(e.target.value) || 0)}
                className="h-8 text-xs"
              />
              <p className="text-xs text-muted-foreground">
                Maximum output length: {formatTokens(data.maxTokens || defaultData.maxTokens)} tokens
              </p>
            </div>
            
            {/* System Prompt */}
            <div className="space-y-1.5">
              <Label htmlFor="systemPrompt" className="text-xs font-medium">System Prompt</Label>
              <Textarea
                id="systemPrompt"
                value={data.systemPrompt || ''}
                onChange={(e) => handleDataChange('systemPrompt', e.target.value)}
                placeholder="Instructions for the Claude assistant..."
                className="resize-none min-h-[80px] text-xs"
              />
              <p className="text-xs text-muted-foreground">
                Sets the assistant's behavior and constraints
              </p>
            </div>
          </div>
        )}
      </div>
      
      {/* Action Buttons */}
      {data.status === 'completed' && (
        <div className="px-4 py-2 border-t border-border/50 flex justify-end">
          <Button 
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => handleDataChange('status', 'idle')}
          >
            <RotateCcw size={12} className="mr-1" /> Run Again
          </Button>
        </div>
      )}
      
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
          border: '2px solid #3b82f6'
        }}
        isConnectable={isConnectable}
      />
      <div className="absolute left-2 top-[46px] text-xs text-muted-foreground">
        In
      </div>
      
      <Handle
        type="target"
        position={Position.Left}
        id="system"
        style={{ 
          top: 80, 
          width: '12px', 
          height: '12px', 
          background: 'white',
          border: '2px solid #3b82f6'
        }}
        isConnectable={isConnectable}
      />
      <div className="absolute left-2 top-[76px] text-xs text-muted-foreground">
        System
      </div>
      
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
      <div className="absolute right-2 top-[46px] text-xs text-muted-foreground text-right">
        Out
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
      <div className="absolute right-2 top-[76px] text-xs text-muted-foreground text-right">
        Meta
      </div>
    </div>
  );
};
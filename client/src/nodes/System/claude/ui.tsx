/**
 * Claude API Node UI Component
 * 
 * This file contains the React component used to render the Claude API node
 * in the workflow editor.
 */

import React, { useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { 
  Computer, Key, Sliders, ArrowDownToLine, 
  ArrowUpFromLine, Sparkles, Settings, Loader, Info 
} from 'lucide-react';

// Import the common node components
import { NodeContainer } from '@/components/nodes/common/NodeContainer';
import { NodeHeader } from '@/components/nodes/common/NodeHeader';
import { NodeContent } from '@/components/nodes/common/NodeContent';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// Node interface
interface ClaudeNodeData {
  label?: string;
  icon?: string;
  inputText?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  apiKey?: string;
  _isProcessing?: boolean;
  _hasError?: boolean;
  _errorMessage?: string;
  _generatedText?: string;
  onSettingsClick?: () => void;
  onChange?: (data: any) => void;
  [key: string]: any;
}

// Default data for the node
export const defaultData: ClaudeNodeData = {
  label: 'Claude API',
  model: 'claude-3-sonnet-20240229',
  temperature: 0.7,
  maxTokens: 2000,
  systemPrompt: '',
  apiKey: '',
  _isProcessing: false,
  _hasError: false
};

// Validator for the node data
export const validator = (data: ClaudeNodeData) => {
  const errors = [];
  
  if (!data.apiKey) {
    errors.push('API Key is not configured');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

// Claude API Node Component
export const component = ({ data, isConnectable }: any) => {
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Extract settings or use defaults
  const apiKey = data.apiKey || '';
  const model = data.model || 'claude-3-sonnet-20240229';
  const temperature = data.temperature || 0.7;
  const maxTokens = data.maxTokens || 2000;
  
  // Format model name for display
  const modelDisplay = model.includes('claude-3-sonnet') 
    ? 'CLAUDE SONNET'
    : model.includes('claude-3-opus')
    ? 'CLAUDE OPUS'
    : model.includes('claude-3-haiku')
    ? 'CLAUDE HAIKU'
    : model.toUpperCase();
  
  // Check if node is processing
  const isProcessing = data._isProcessing || isGenerating;
  
  // Handle text generation
  const handleGenerate = async () => {
    if (!data.inputText && !data._generatedText) {
      // Skip if no input provided and not already generated
      return;
    }
    
    if (!apiKey) {
      // Update node data with error info
      if (data.onChange) {
        data.onChange({
          ...data,
          _hasError: true,
          _errorMessage: 'Claude API key is not configured'
        });
      }
      return;
    }
    
    setIsGenerating(true);
    
    try {
      // Update node data to show processing state
      if (data.onChange) {
        data.onChange({
          ...data,
          _isProcessing: true,
          _hasError: false,
          _errorMessage: ''
        });
      }
      
      // Actual generation happens in the executor
      // This UI just shows the loading state
      setTimeout(() => {
        setIsGenerating(false);
        if (data.onChange) {
          data.onChange({
            ...data,
            _isProcessing: false
          });
        }
      }, 500);
    } catch (error) {
      console.error('Generation error:', error);
      setIsGenerating(false);
      
      // Update node data with error info
      if (data.onChange) {
        data.onChange({
          ...data,
          _isProcessing: false,
          _hasError: true,
          _errorMessage: error instanceof Error ? error.message : 'An unknown error occurred'
        });
      }
    }
  };
  
  // Open settings modal/drawer
  const openSettings = () => {
    if (typeof data.onSettingsClick === 'function') {
      data.onSettingsClick();
    }
  };
  
  // Create icon element for the header
  const iconElement = (
    <div className="bg-indigo-100 p-1.5 rounded-md">
      <Computer className="h-4 w-4 text-indigo-600" />
    </div>
  );
  
  // Create header actions
  const headerActions = (
    <Badge variant="outline" className="bg-indigo-100 text-indigo-800 text-xs">
      LLM
    </Badge>
  );
  
  return (
    <NodeContainer selected={false} className={data._hasError ? 'border-red-300' : ''}>
      <NodeHeader 
        title="Claude API" 
        description="Generates text using Claude"
        icon={iconElement}
        actions={headerActions}
      />
      
      <NodeContent padding="normal">
        {/* API key status */}
        {!apiKey ? (
          <div className="flex items-center text-red-500 text-xs mb-2 bg-red-50 p-1.5 rounded border border-red-100">
            <Key size={12} className="mr-1" /> 
            No API key configured
          </div>
        ) : null}
        
        {/* Model */}
        <div className="flex items-center justify-between bg-white rounded p-1.5 border border-slate-200 mb-2">
          <div className="flex items-center text-xs text-slate-600">
            <Computer size={12} className="mr-1" /> 
            Model:
          </div>
          <div className="text-xs font-medium text-slate-700">
            {modelDisplay}
          </div>
        </div>
        
        {/* Parameters */}
        <div className="flex items-center justify-between bg-white rounded p-1.5 border border-slate-200 mb-2">
          <div className="flex items-center text-xs text-slate-600">
            <Sliders size={12} className="mr-1" /> 
            Parameters:
          </div>
          <div className="text-xs text-slate-700">
            <span className="font-medium">{temperature}</span>
            <span className="mx-1">|</span>
            <span className="font-medium">{maxTokens}t</span>
          </div>
        </div>
        
        {/* Input summary */}
        <div className="bg-white rounded p-1.5 border border-slate-200 mb-3">
          <div className="flex items-center text-xs text-slate-600 mb-1">
            <ArrowDownToLine size={12} className="mr-1" /> 
            Input Prompt:
          </div>
          <div className="text-xs text-slate-600 min-h-[40px] max-h-[60px] overflow-hidden">
            {data.inputText ? (
              data.inputText.substring(0, 100) + (data.inputText.length > 100 ? '...' : '')
            ) : (
              <div className="text-slate-400 flex items-center justify-center h-[40px]">
                Waiting for input from previous node...
              </div>
            )}
          </div>
        </div>
        
        {/* Action buttons */}
        <div className="flex gap-2 mb-3">
          <Button 
            className="flex-1 flex items-center justify-center py-1 px-2 text-xs h-auto"
            size="sm"
            onClick={handleGenerate}
            disabled={isGenerating || isProcessing}
          >
            {isGenerating || isProcessing ? (
              <>
                <Loader size={12} className="mr-1 animate-spin" />
                {isProcessing ? "Processing..." : "Generating..."}
              </>
            ) : (
              <>
                <Sparkles size={12} className="mr-1" />
                Generate
              </>
            )}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="py-1 px-2 text-xs h-auto"
            onClick={openSettings}
          >
            <Settings size={12} className="mr-1" />
            Settings
          </Button>
        </div>
        
        {/* Output display */}
        <div className={`bg-white border rounded p-1.5 min-h-[60px] ${
          data._hasError ? 'border-red-300 bg-red-50' : 'border-slate-200'
        }`}>
          <div className="flex items-center text-xs text-slate-600 mb-1">
            <ArrowUpFromLine size={12} className="mr-1" /> 
            Generated Output:
          </div>
          
          {data._hasError ? (
            <div className="text-red-600 text-xs">
              {data._errorMessage || 'An error occurred during generation'}
            </div>
          ) : data._generatedText ? (
            <div className="text-xs text-slate-600 max-h-[60px] overflow-hidden">
              {typeof data._generatedText === 'string' 
                ? (data._generatedText.substring(0, 100) + 
                   (data._generatedText.length > 100 ? '...' : ''))
                : JSON.stringify(data._generatedText).substring(0, 100) + '...'}
            </div>
          ) : (
            <div className="text-slate-400 text-xs flex items-center justify-center h-[40px]">
              <Info size={12} className="mr-1" />
              No response received yet. Click Generate to run this node.
            </div>
          )}
        </div>
      </NodeContent>
      
      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        style={{ 
          top: 60, 
          width: '12px', 
          height: '12px', 
          background: 'white',
          border: '2px solid #818cf8'
        }}
        isConnectable={true}
      />
      <div className="absolute left-2 top-[56px] text-xs text-slate-500">
        In
      </div>
      
      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        style={{ 
          top: 60, 
          width: '12px', 
          height: '12px', 
          background: 'white',
          border: '2px solid #818cf8'
        }}
        isConnectable={true}
      />
      <div className="absolute right-2 top-[56px] text-xs text-slate-500 text-right">
        Out
      </div>
    </NodeContainer>
  );
};
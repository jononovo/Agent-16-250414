/**
 * Enhanced Claude API Node UI Component
 * 
 * This version uses the EnhancedBaseNode to provide consistent UI patterns
 * including settings drawer and hover/click menu.
 */

import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Computer, ArrowDownToLine, ArrowUpFromLine, Sparkles, Loader, Info } from 'lucide-react';
import { EnhancedNode } from '@/components/nodes/common/EnhancedNode';
import { Button } from '@/components/ui/button';

// Node interface (same as before)
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
  onChange?: (data: any) => void;
  [key: string]: any;
}

// Default data for the node (same as before)
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

// Validator for the node data (same as before)
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

// Enhanced Claude API Node Component using the EnhancedBaseNode
export const component = ({ data, selected, id }: NodeProps<ClaudeNodeData>) => {
  const [isGenerating, setIsGenerating] = React.useState(false);
  
  // Extract settings or use defaults
  const apiKey = data.apiKey || '';
  const model = data.model || 'claude-3-sonnet-20240229';
  const temperature = data.temperature || 0.7;
  const maxTokens = data.maxTokens || 2000;
  
  // Check if node is processing
  const isProcessing = data._isProcessing || isGenerating;
  
  // Handle text generation (same as before)
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
  
  // Create the settings configuration
  const enhancedData = {
    ...data,
    icon: <Computer className="h-4 w-4 text-indigo-600" />,
    description: "Generates text using Claude AI",
    category: "ai",
    settings: {
      title: "Claude API Settings",
      fields: [
        {
          key: "apiKey",
          label: "API Key",
          type: "text" as const,
          description: "Your Anthropic API key (leave empty to use environment variable)"
        },
        {
          key: "model",
          label: "Model",
          type: "select" as const,
          description: "Claude model to use for generation",
          options: [
            { label: "Claude 3 Sonnet", value: "claude-3-sonnet-20240229" },
            { label: "Claude 3 Opus", value: "claude-3-opus-20240229" },
            { label: "Claude 3 Haiku", value: "claude-3-haiku-20240307" }
          ]
        },
        {
          key: "temperature",
          label: "Temperature",
          type: "slider" as const,
          description: "Controls randomness of the output (higher = more random)",
          min: 0,
          max: 1,
          step: 0.1
        },
        {
          key: "maxTokens",
          label: "Max Tokens",
          type: "number" as const,
          description: "Maximum number of tokens to generate",
          min: 1,
          max: 100000
        },
        {
          key: "systemPrompt",
          label: "System Prompt",
          type: "textarea" as const,
          description: "Optional system instructions for Claude"
        }
      ]
    }
  };
  
  // The node content
  const nodeContent = (
    <>
      {/* API key status */}
      {!apiKey ? (
        <div className="flex items-center text-red-500 text-xs mb-2 bg-red-50 p-1.5 rounded border border-red-100">
          No API key configured
        </div>
      ) : null}
      
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
    </>
  );
  
  // Return the EnhancedBaseNode with our custom node content
  return (
    <EnhancedBaseNode
      id={id}
      selected={selected}
      data={enhancedData}
    >
      {nodeContent}
    </EnhancedBaseNode>
  );
};

export default component;
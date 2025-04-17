/**
 * Claude API Node - Complete Export
 * =================================
 * 
 * This file contains a complete export of the Claude API node component from the workflow system,
 * matching the exact implementation shown in the UI screenshot. It includes both the UI component 
 * and the executor logic for running the node.
 * 
 * INTEGRATION GUIDE:
 * -----------------
 * 1. Dependencies:
 *    - ReactFlow for node visualization and workflow connections
 *    - Lucide-React for icons
 *    - Tailwind CSS for styling
 * 
 * 2. Required interfaces:
 *    - NodeExecutionData interface for standardized data flow
 *    - NodeData for the component props
 * 
 * 3. Integration steps:
 *    a. Import and register the ClaudeNode component with ReactFlow's nodeTypes
 *    b. Register the executor with your workflow execution engine
 *    c. Ensure the styling dependencies are available
 * 
 * 4. API Keys:
 *    - The node looks for API keys in node configuration or environment variables
 */

//=============================================================================
// PART 1: INTERFACES & TYPES
//=============================================================================

/**
 * Node data interface - defines the props passed to the Claude API node
 */
interface NodeData {
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
  onOutputChange?: (output: string) => void;
  [key: string]: any;
}

/**
 * Node execution data for standardized data flow
 */
interface NodeExecutionData {
  items: {
    json: Record<string, any>;
    meta?: Record<string, any>;
  }[];
  meta: {
    startTime: Date;
    endTime: Date;
    error?: string;
    status?: string;
    [key: string]: any;
  };
}

//=============================================================================
// PART 2: CLAUDE API EXECUTOR
//=============================================================================

/**
 * Calls the Claude API with configured parameters
 */
async function callClaudeAPI(
  prompt: string, 
  apiKey: string, 
  model: string = 'claude-3-sonnet-20240229',
  systemPrompt?: string,
  temperature: number = 0.7,
  maxTokens: number = 2000
) {
  try {
    // Prepare messages array
    const messages = [];
    
    // Add system prompt if provided
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    
    // Add user message
    messages.push({ role: 'user', content: prompt });
    
    // Make API request
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens: maxTokens
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    if (!data.content || !data.content[0] || !data.content[0].text) {
      throw new Error('Unexpected API response format');
    }
    
    return data.content[0].text;
  } catch (error) {
    console.error('Error calling Claude API:', error);
    throw error;
  }
}

/**
 * Claude API Node Executor - handles the node execution logic
 */
export const claudeExecutor = {
  execute: async (nodeData: NodeData, inputs: Record<string, any> = {}) => {
    try {
      // Get input text either from connected nodes or from node data
      let prompt = '';
      if (inputs && Object.keys(inputs).length > 0) {
        const firstInputKey = Object.keys(inputs)[0];
        const firstInput = inputs[firstInputKey];
        prompt = firstInput?.text || firstInput?.content || firstInput?.message || '';
      } else if (nodeData.inputText) {
        prompt = nodeData.inputText;
      }
      
      if (!prompt) {
        return {
          items: [{
            json: {
              error: 'No input text provided',
              _hasError: true,
              _errorMessage: 'No input text provided'
            }
          }],
          meta: {
            startTime: new Date(),
            endTime: new Date(),
            error: 'No input text provided',
            status: 'error'
          }
        };
      }
      
      // Get API key
      const apiKey = nodeData.apiKey || import.meta.env.CLAUDE_API_KEY || '';
      
      if (!apiKey) {
        return {
          items: [{
            json: {
              error: 'Claude API key is not configured',
              _hasError: true,
              _errorMessage: 'Claude API key is not configured'
            }
          }],
          meta: {
            startTime: new Date(),
            endTime: new Date(),
            error: 'Claude API key is not configured',
            status: 'error'
          }
        };
      }
      
      // Get other settings
      const model = nodeData.model || 'claude-3-sonnet-20240229';
      const systemPrompt = nodeData.systemPrompt;
      const temperature = Number(nodeData.temperature || 0.7);
      const maxTokens = Number(nodeData.maxTokens || 2000);
      
      // Record start time
      const startTime = new Date();
      
      // Call Claude API
      const generatedText = await callClaudeAPI(
        prompt, 
        apiKey, 
        model,
        systemPrompt,
        temperature,
        maxTokens
      );
      
      // Return successful result
      return {
        items: [{
          json: {
            text: generatedText,
            output: generatedText,
            _generatedText: generatedText,
            model: model
          }
        }],
        meta: {
          startTime: startTime,
          endTime: new Date(),
          status: 'success'
        }
      };
      
    } catch (error: any) {
      // Return error result
      return {
        items: [{
          json: {
            error: error.message || 'Error processing Claude API request',
            _hasError: true,
            _errorMessage: error.message || 'Error processing Claude API request'
          }
        }],
        meta: {
          startTime: new Date(),
          endTime: new Date(),
          error: error.message || 'Error processing Claude API request',
          status: 'error'
        }
      };
    }
  }
};

//=============================================================================
// PART 3: HOVER NODE MENU COMPONENT
//=============================================================================

/**
 * Hover Node Menu Component
 * 
 * This component appears when hovering over a node and provides 4 action buttons:
 * - Duplicate (copy icon)
 * - Delete (trash icon)
 * - Settings (gear icon)
 * - Edit (pencil icon)
 * 
 * The component should be rendered as an absolute-positioned element next to the node.
 */
export const HoverNodeMenuCode = `
import React from 'react';
import { Copy, Trash2, Settings, Edit } from 'lucide-react';

// Hover menu that appears next to a node
const HoverNodeMenu = ({ 
  onDuplicate, 
  onDelete, 
  onSettings,
  onEdit 
}) => {
  return (
    <div className="absolute z-50 right-0 top-0 translate-x-[calc(100%)] bg-white rounded-md shadow-lg border border-slate-200 p-1 flex flex-col gap-1">
      {/* Duplicate button */}
      <button 
        className="h-8 w-8 hover:bg-slate-100 rounded p-1.5 flex items-center justify-center"
        onClick={onDuplicate}
        title="Duplicate node"
      >
        <Copy className="h-4 w-4" />
      </button>
      
      {/* Delete button */}
      <button 
        className="h-8 w-8 hover:bg-slate-100 rounded p-1.5 text-red-500 hover:text-red-600 flex items-center justify-center"
        onClick={onDelete}
        title="Delete node"
      >
        <Trash2 className="h-4 w-4" />
      </button>
      
      {/* Settings button */}
      <button 
        className="h-8 w-8 hover:bg-slate-100 rounded p-1.5 text-blue-500 flex items-center justify-center"
        onClick={onSettings}
        title="Node settings"
      >
        <Settings className="h-4 w-4" />
      </button>
      
      {/* Edit button */}
      <button 
        className="h-8 w-8 hover:bg-slate-100 rounded p-1.5 text-blue-500 flex items-center justify-center"
        onClick={onEdit}
        title="Edit node"
      >
        <Edit className="h-4 w-4" />
      </button>
    </div>
  );
};

export default HoverNodeMenu;
`;

//=============================================================================
// PART 4: CLAUDE API NODE COMPONENT
//=============================================================================

/**
 * Claude API Node Component
 * 
 * This component renders the Claude API node in the workflow editor, exactly as
 * shown in the screenshot. It includes:
 * - Header with title and LLM badge
 * - API key status indicator
 * - Model selection display
 * - Parameter display (temperature and max tokens)
 * - Input prompt display
 * - Generate button
 * - Settings button
 * - Output display
 * - Connection handles for workflow linking
 */
export const ClaudeNodeComponentCode = `
import React, { useState, useEffect } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { 
  Computer, Key, Sliders, ArrowDownToLine, 
  ArrowUpFromLine, Sparkles, Settings, Loader, Info 
} from 'lucide-react';

// Claude API Node Component
const ClaudeNode = ({ data, selected, id }: NodeProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Extract settings or use defaults
  const apiKey = data.apiKey || '';
  const model = data.model || 'claude-3-sonnet-20240229';
  const temperature = data.temperature || 0.7;
  const maxTokens = data.maxTokens || 2000;
  
  // Format model name for display
  const modelDisplay = model.includes('claude') 
    ? \`CLAUDE SONNET\`
    : model.toUpperCase();
  
  // Check if node is processing
  const isProcessing = data._isProcessing || false;
  
  // Handle text generation
  const handleGenerate = async () => {
    if (!data.inputText) {
      // Handle no input case
      return;
    }
    
    if (!apiKey) {
      // Handle no API key case
      return;
    }
    
    setIsGenerating(true);
    
    try {
      // Call generate function from parent if available
      if (typeof data.onGenerate === 'function') {
        await data.onGenerate();
      } else {
        // Here you would implement direct API call if not using parent handler
        // This is a simplified version to match the screenshot UI
        setTimeout(() => {
          setIsGenerating(false);
        }, 1000);
      }
    } catch (error) {
      console.error('Generation error:', error);
    } finally {
      setIsGenerating(false);
    }
  };
  
  // Open settings modal/drawer
  const openSettings = () => {
    if (typeof data.onSettingsClick === 'function') {
      data.onSettingsClick();
    }
  };
  
  return (
    <div className={\`relative bg-indigo-50 border border-indigo-200 rounded-lg shadow-sm \${
      selected ? 'ring-2 ring-indigo-400' : ''
    }\`}>
      {/* Header with icon, title and badge */}
      <div className="flex items-center justify-between border-b border-indigo-100 p-3">
        <div className="flex items-center gap-2">
          <div className="text-indigo-600">
            <Computer size={18} />
          </div>
          <span className="font-medium">Claude API</span>
        </div>
        <div className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-sm">
          LLM
        </div>
      </div>
      
      {/* API key status */}
      <div className="p-3">
        {!apiKey ? (
          <div className="flex items-center text-red-500 text-sm mb-2">
            <Key size={14} className="mr-1" /> 
            No API key configured
          </div>
        ) : null}
        
        {/* Model */}
        <div className="flex items-center justify-between bg-white rounded-md p-2 border border-indigo-100 mb-2">
          <div className="flex items-center text-sm text-indigo-700">
            <Computer size={14} className="mr-1" /> 
            Model:
          </div>
          <div className="text-sm font-medium text-indigo-800">
            {modelDisplay}
          </div>
        </div>
        
        {/* Parameters */}
        <div className="flex items-center justify-between bg-white rounded-md p-2 border border-indigo-100 mb-2">
          <div className="flex items-center text-sm text-indigo-700">
            <Sliders size={14} className="mr-1" /> 
            Parameters:
          </div>
          <div className="text-sm text-indigo-800">
            <span className="font-medium">{temperature}</span>
            <span className="mx-1">|</span>
            <span className="font-medium">{maxTokens}t</span>
          </div>
        </div>
        
        {/* Input prompt */}
        <div className="bg-white rounded-md p-2 border border-indigo-100 mb-3">
          <div className="flex items-center text-sm text-indigo-700 mb-1">
            <ArrowDownToLine size={14} className="mr-1" /> 
            Input Prompt:
          </div>
          <div className="text-sm text-slate-600 min-h-[60px]">
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
          <button 
            className={\`flex-1 flex items-center justify-center py-2 px-3 bg-indigo-600 hover:bg-indigo-700 
              text-white rounded-md text-sm font-medium \${(isGenerating || isProcessing) ? 'opacity-70' : ''}\`}
            onClick={handleGenerate}
            disabled={isGenerating || isProcessing}
          >
            {isGenerating || isProcessing ? (
              <>
                <Loader size={14} className="mr-1 animate-spin" />
                {isProcessing ? "Processing..." : "Generating..."}
              </>
            ) : (
              <>
                <Sparkles size={14} className="mr-1" />
                Generate
              </>
            )}
          </button>
          
          <button
            className="bg-white border border-indigo-300 text-indigo-700 hover:bg-indigo-50 
              px-3 py-2 rounded-md text-sm flex items-center"
            onClick={openSettings}
          >
            <Settings size={14} className="mr-1" />
            Settings
          </button>
        </div>
        
        {/* Output display */}
        <div className={\`bg-white border rounded-md p-2 min-h-[80px] \${
          data._hasError ? 'border-red-300 bg-red-50' : 'border-indigo-100'
        }\`}>
          <div className="flex items-center text-sm text-indigo-700 mb-1">
            <ArrowUpFromLine size={14} className="mr-1" /> 
            Generated Output:
          </div>
          
          {data._hasError ? (
            <div className="text-red-600 text-sm">
              {data._errorMessage || 'An error occurred during generation'}
            </div>
          ) : data._generatedText ? (
            <div className="text-sm text-slate-600">
              {typeof data._generatedText === 'string' 
                ? (data._generatedText.substring(0, 100) + 
                   (data._generatedText.length > 100 ? '...' : ''))
                : JSON.stringify(data._generatedText).substring(0, 100) + '...'}
            </div>
          ) : (
            <div className="text-slate-400 text-sm flex items-center justify-center h-[60px]">
              <Info size={14} className="mr-1" />
              No response received yet. Click Generate to run this node.
            </div>
          )}
        </div>
      </div>
      
      {/* Input and output handles for connections */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 border-2 border-indigo-500 bg-white rounded-full"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 border-2 border-indigo-500 bg-white rounded-full"
      />
    </div>
  );
};

export default ClaudeNode;
`;

//=============================================================================
// PART 5: INTEGRATION GUIDE
//=============================================================================

/**
 * INTEGRATION GUIDE
 * 
 * To integrate this Claude API node into your workflow system:
 * 
 * 1. Create the Component File:
 *    - Create a file named "ClaudeNode.jsx" or "ClaudeNode.tsx"
 *    - Copy the ClaudeNodeComponentCode content into this file
 *    - Adjust imports based on your project structure
 * 
 * 2. Create the Hover Menu Component:
 *    - Create a file named "HoverNodeMenu.jsx" or "HoverNodeMenu.tsx"
 *    - Copy the HoverNodeMenuCode content into this file
 *    - Adjust imports based on your project structure
 * 
 * 3. Create the Executor:
 *    - Create a file for your executor (e.g., "claudeExecutor.js")
 *    - Implement the executor logic based on the claudeExecutor in this file
 * 
 * 4. Register the Node:
 *    - In your ReactFlow component, register the Claude node:
 *      ```js
 *      const nodeTypes = {
 *        claudeApi: ClaudeNode,
 *        // other node types...
 *      };
 *      ```
 *    - Use the nodeTypes in your ReactFlow component
 * 
 * 5. Register the Executor:
 *    - In your workflow engine, register the executor to handle Claude API nodes
 *    - Associate the executor with the correct node type
 * 
 * 6. Style Requirements:
 *    - Ensure Tailwind CSS is configured in your project
 *    - Import Lucide icons or equivalent
 *    - Add any additional custom styles needed for proper rendering
 * 
 * IMPORTANT NOTES:
 * - The Claude node assumes a parent component will handle actual API calls
 * - Settings are expected to be managed elsewhere in the application
 * - You'll need to implement any missing utility functions
 * - Adjust styling to match your application's design system
 */
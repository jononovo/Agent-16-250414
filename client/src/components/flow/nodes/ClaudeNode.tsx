import { useState, useEffect, useRef } from 'react';
import { NodeProps, Handle, Position, useReactFlow } from 'reactflow';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import * as Lucide from 'lucide-react';
import DynamicIcon from '@/components/ui/dynamic-icon';

// This component provides a visual submenu for node operations
const NodeHoverMenu = ({ 
  nodeId, 
  nodeType, 
  nodeData, 
  position,
  onDuplicate, 
  onDelete, 
  onSettings,
  onMonkeyAgentModify 
}: { 
  nodeId: string;
  nodeType: string;
  nodeData: any;
  position: { x: number, y: number };
  onDuplicate: () => void;
  onDelete: () => void;
  onSettings: () => void;
  onMonkeyAgentModify: () => void;
}) => {
  return (
    <div className="absolute z-50 right-0 top-0 translate-x-[calc(100%)] bg-white rounded-md shadow-lg border border-slate-200 p-1 flex flex-col gap-1">
      <Button 
        variant="ghost" 
        size="icon"
        className="h-8 w-8 hover:bg-slate-100"
        onClick={onDuplicate}
        title="Duplicate node"
      >
        <Lucide.Copy className="h-4 w-4" />
      </Button>
      
      <Button 
        variant="ghost" 
        size="icon"
        className="h-8 w-8 hover:bg-slate-100 text-red-500 hover:text-red-600"
        onClick={onDelete}
        title="Delete node"
      >
        <Lucide.Trash2 className="h-4 w-4" />
      </Button>
      
      <Button 
        variant="ghost" 
        size="icon"
        className="h-8 w-8 hover:bg-slate-100 text-indigo-500"
        onClick={onSettings}
        title="Node settings"
      >
        <Lucide.Settings className="h-4 w-4" />
      </Button>
      
      <Button 
        variant="ghost" 
        size="icon"
        className="h-8 w-8 hover:bg-slate-100 text-indigo-500"
        onClick={onMonkeyAgentModify}
        title="MonkeyAgent Modify"
      >
        <Lucide.Bot className="h-4 w-4" />
      </Button>
    </div>
  );
};

// Define the node data interface
interface NodeData {
  label?: string;
  description?: string;
  icon?: string;
  inputText?: string;
  settings?: {
    model?: string;
    systemPrompt?: string;
    temperature?: number;
    maxTokens?: number;
    apiKey?: string;
    [key: string]: any;
  };
  _isProcessing?: boolean;
  _isComplete?: boolean;
  _hasError?: boolean;
  _errorMessage?: string;
  _generatedText?: string;
  onOutputChange?: (output: string) => void;
  [key: string]: any;
}

/**
 * Claude AI node for generating text using Anthropic's Claude API
 */
const ClaudeNode = ({ data, selected, id, xPos, yPos }: NodeProps<NodeData>) => {
  const [expanded, setExpanded] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedText, setGeneratedText] = useState('');
  const [showHoverMenu, setShowHoverMenu] = useState(false);
  const [hoverTimer, setHoverTimer] = useState<NodeJS.Timeout | null>(null);
  const nodeRef = useRef<HTMLDivElement>(null);
  const reactFlowInstance = useReactFlow();
  
  // Function to handle hover start
  const handleHoverStart = () => {
    // Set a timeout to show the menu after hovering for 500ms
    const timer = setTimeout(() => {
      setShowHoverMenu(true);
    }, 500);
    
    setHoverTimer(timer);
  };
  
  // Function to handle hover end
  const handleHoverEnd = () => {
    // Clear the timeout if the user stops hovering before the menu appears
    if (hoverTimer) {
      clearTimeout(hoverTimer);
      setHoverTimer(null);
    }
    setShowHoverMenu(false);
  };
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimer) {
        clearTimeout(hoverTimer);
      }
    };
  }, [hoverTimer]);
  
  // Handle node duplication
  const handleDuplicate = () => {
    // Create a new node based on the current one
    const position = { x: (xPos || 0) + 20, y: (yPos || 0) + 20 };
    
    // Clone the node with a new ID
    const newNode = {
      id: `claude-${Date.now()}`,
      type: 'claude',
      position,
      data: { ...data }
    };
    
    // Add the new node to the flow
    reactFlowInstance.addNodes(newNode);
  };
  
  // Handle node deletion
  const handleDelete = () => {
    reactFlowInstance.deleteElements({ nodes: [{ id }] });
  };
  
  // Handle MonkeyAgent modification
  const handleMonkeyAgentModify = () => {
    // Create an event with all the node details
    const nodeDetails = {
      id,
      type: 'claude',
      position: { x: xPos, y: yPos },
      data: { ...data }
    };
    
    // Dispatch a custom event that the MonkeyAgentChatOverlay will listen for
    const event = new CustomEvent('monkey-agent-modify-node', {
      detail: { nodeDetails }
    });
    
    window.dispatchEvent(event);
  };
  
  // Try to get API key from environment, settings, or direct node data
  const envApiKey = import.meta.env.CLAUDE_API_KEY;
  
  // Default node data if not provided
  const nodeLabel = data.label || 'Claude AI';
  const nodeDescription = data.description || 'Generate text using Claude AI';
  const nodeIcon = data.icon || 'Bot';
  
  // Extract settings with defaults
  const apiKey = data.settings?.apiKey || data.apiKey || envApiKey || '';
  const model = data.settings?.model || 'claude-3-sonnet-20240229';
  const temperature = data.settings?.temperature || 0.7;
  const maxTokens = data.settings?.maxTokens || 2000;
  const systemPrompt = data.settings?.systemPrompt || '';
  
  // Format model name for display
  const modelDisplay = model.includes('claude') 
    ? `CLAUDE ${model.split('-').slice(2, 3).join(' ').toUpperCase()}`
    : model.toUpperCase();
  
  // Check if workflow run is processing this node
  const isProcessing = data._isProcessing || false;
  
  // Use generated text from workflow run if available
  const displayResult = data._generatedText 
    ? (typeof data._generatedText === 'object' ? JSON.stringify(data._generatedText) : data._generatedText)
    : generatedText;
    
  // Update apiKey in data if environment variable is available
  useEffect(() => {
    if (envApiKey && !data.apiKey) {
      data.apiKey = envApiKey;
    }
  }, [envApiKey, data]);
  
  // Handle text generation with Claude API
  const handleGenerate = async () => {
    if (!data.inputText) {
      setGeneratedText('No input provided');
      return;
    }
    
    // Use environment API key if available, otherwise use input
    const effectiveApiKey = envApiKey || apiKey;
    
    if (!effectiveApiKey) {
      setGeneratedText('Please enter your Claude API key in settings');
      return;
    }
    
    setIsGenerating(true);
    
    try {
      console.log('Using Claude API:', apiKey ? 'API Key available' : 'No API key');
      
      // Prepare messages array with system prompt if available
      const messages = [];
      if (systemPrompt) {
        messages.push({
          role: "system",
          content: systemPrompt
        });
      }
      
      // Add user message
      messages.push({
        role: "user",
        content: data.inputText
      });
      
      console.log(`Making Claude API request with model: ${model}...`);
      
      // Call Claude API
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': effectiveApiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: model,
          messages: messages,
          temperature: temperature,
          max_tokens: maxTokens
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Claude API error status:', response.status);
        console.error('Claude API error text:', errorText);
        throw new Error(`API responded with status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('Claude API response received:', result);
      
      // Extract and display the assistant's response
      if (result.content && result.content.length > 0) {
        const assistantResponse = result.content[0].text;
        console.log('Claude API content:', assistantResponse.substring(0, 50) + '...');
        setGeneratedText(assistantResponse);
        
        // Send result to next node if available
        if (data.onOutputChange) {
          data.onOutputChange(assistantResponse);
        }
      } else {
        setGeneratedText('Unexpected API response format');
      }
    } catch (error: any) {
      console.error('Error generating text with Claude API:', error);
      setGeneratedText(`Error connecting to Claude API: ${error.message || 'Unknown error'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Open settings drawer when settings button is clicked
  const openSettings = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (reactFlowInstance && id) {
      // Access the flow context to trigger the settings drawer
      // This directly calls the onNodeSettingsOpen callback without triggering node selection
      // Dispatch a custom event that FlowEditor listens for
      const event = new CustomEvent('node-settings-open', { 
        detail: { nodeId: id }
      });
      window.dispatchEvent(event);
    }
  };
  
  return (
    <div 
      ref={nodeRef}
      onMouseEnter={handleHoverStart}
      onMouseLeave={handleHoverEnd}
      className="relative"
      // Extended hoverable area with padding to create a seamless interaction between node and menu
      style={{ padding: showHoverMenu ? '0 20px 0 0' : '0' }}
    >
      {showHoverMenu && (
        <NodeHoverMenu 
          nodeId={id}
          nodeType="claude"
          nodeData={data}
          position={{ x: xPos || 0, y: yPos || 0 }}
          onDuplicate={handleDuplicate}
          onDelete={handleDelete}
          onSettings={openSettings}
          onMonkeyAgentModify={handleMonkeyAgentModify}
        />
      )}
      <Card 
        className={`w-64 transition-all duration-200 ${selected ? 'ring-2 ring-primary' : ''}`}
        style={{ background: 'linear-gradient(135deg, #f0f4ff 0%, #e0e7ff 100%)' }}
      >
      <CardHeader className="flex flex-row items-center justify-between p-3 pb-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-indigo-100 flex items-center justify-center text-indigo-600">
            {typeof nodeIcon === 'string' ? <DynamicIcon icon={nodeIcon} /> : <Lucide.Bot size={14} />}
          </div>
          <span className="font-medium text-sm truncate">{nodeLabel}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            className="p-1 hover:bg-indigo-100 rounded-sm transition-colors"
            onClick={openSettings}
            title="Open node settings"
          >
            <Lucide.Settings className="h-3 w-3 text-indigo-500" />
          </button>
          <Badge variant="outline" className="bg-indigo-100 text-indigo-700 text-[10px] font-normal border-indigo-200">LLM</Badge>
        </div>
      </CardHeader>
      
      <CardContent className="p-3 pt-0">
        <div className="mb-2">
          {/* API Key Indicator */}
          {apiKey ? (
            <div className="bg-white border border-indigo-200 rounded-md p-2 text-xs mb-2 text-slate-600 flex items-center">
              <Lucide.Key className="h-3 w-3 mr-1 text-green-500" />
              API key configured
            </div>
          ) : (
            <div className="bg-white border border-indigo-200 rounded-md p-2 text-xs mb-2 text-slate-600 flex items-center">
              <Lucide.Key className="h-3 w-3 mr-1 text-red-500" />
              No API key configured
            </div>
          )}
          
          {/* Model Indicator */}
          <div className="bg-white border border-indigo-200 rounded-md p-2 text-xs mb-2 text-slate-600 flex items-center justify-between">
            <div className="flex items-center">
              <Lucide.Cpu className="h-3 w-3 mr-1 text-indigo-500" />
              <span>Model:</span>
            </div>
            <span className="text-indigo-700 font-medium">{modelDisplay}</span>
          </div>
          
          {/* Parameters Indicator */}
          <div className="bg-white border border-indigo-200 rounded-md p-2 text-xs mb-2 text-slate-600 flex items-center justify-between">
            <div className="flex items-center">
              <Lucide.Sliders className="h-3 w-3 mr-1 text-indigo-500" />
              <span>Parameters:</span>
            </div>
            <div className="flex gap-2">
              <span title="Temperature" className="text-indigo-700 font-medium">{temperature}</span>
              <span>|</span>
              <span title="Max tokens" className="text-indigo-700 font-medium">{maxTokens}t</span>
            </div>
          </div>
        </div>
        
        {/* Input text display */}
        <div className="bg-white border border-indigo-200 rounded-md p-2 min-h-[60px] text-xs mb-2">
          <div className="font-medium text-xs text-indigo-700 mb-1 flex items-center">
            <Lucide.ArrowDownToLine className="h-3 w-3 mr-1" />
            Input Prompt:
          </div>
          {data.inputText ? (
            <p className="text-slate-700">
              {typeof data.inputText === 'object' 
                ? JSON.stringify(data.inputText) 
                : String(data.inputText)}
            </p>
          ) : (
            <div className="text-slate-400 text-xs flex items-center justify-center h-full">
              Waiting for input from previous node...
            </div>
          )}
        </div>
        
        {/* Action buttons */}
        <div className="flex gap-2 mb-2">
          <Button 
            variant="default" 
            size="sm" 
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
            onClick={handleGenerate}
            disabled={isGenerating || isProcessing}
          >
            {isGenerating || isProcessing ? (
              <>
                <Lucide.Loader2 className="h-3 w-3 mr-1 animate-spin" />
                {isProcessing ? "Processing..." : "Generating..."}
              </>
            ) : (
              <>
                <Lucide.Sparkles className="h-3 w-3 mr-1" />
                Generate
              </>
            )}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="bg-white border-indigo-300 text-indigo-700 hover:bg-indigo-50"
            onClick={openSettings}
          >
            <Lucide.Settings className="h-3 w-3 mr-1" />
            Settings
          </Button>
        </div>
        
        {/* Output display */}
        <div className={`bg-white border rounded-md p-2 min-h-[80px] text-xs ${
          data._hasError ? 'border-red-300 bg-red-50' : 'border-indigo-200'
        }`}>
          <div className="font-medium text-xs text-indigo-700 mb-1 flex items-center">
            <Lucide.ArrowUpFromLine className="h-3 w-3 mr-1" />
            Generated Output:
          </div>
          
          {data._hasError ? (
            <div className="text-red-600 whitespace-pre-line">
              <Lucide.AlertTriangle className="h-3 w-3 inline mr-1" />
              {data._errorMessage || 'An error occurred during generation'}
            </div>
          ) : displayResult ? (
            <p className="text-slate-700 whitespace-pre-line">
              {displayResult}
            </p>
          ) : (
            <div className="text-slate-400 text-xs flex items-center justify-center h-[60px]">
              <Lucide.Info className="h-3 w-3 mr-1" />
              No response received yet. Click Generate to run this node.
            </div>
          )}
        </div>
        
        {/* System prompt indicator if present */}
        {systemPrompt && (
          <div className="mt-2 bg-indigo-50 border border-indigo-200 rounded-md p-2 text-xs">
            <div className="font-medium text-indigo-700 flex items-center">
              <Lucide.MessageSquare className="h-3 w-3 mr-1" />
              System Prompt:
            </div>
            <div className="text-slate-600 mt-1 line-clamp-2">
              {systemPrompt}
            </div>
          </div>
        )}
      </CardContent>
      
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !border-2 !border-indigo-400 !bg-white"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !border-2 !border-indigo-400 !bg-white"
      />
    </Card>
    </div>
  );
};

export default ClaudeNode;
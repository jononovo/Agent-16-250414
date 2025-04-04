import { Handle, Position, NodeProps, useReactFlow } from 'reactflow';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import * as Lucide from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NodeData } from '../NodeItem';
import { Badge } from '@/components/ui/badge';
import DynamicIcon from '../DynamicIcon';
import { useState, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';

const PerplexityNode = ({ data, selected, id }: NodeProps<NodeData>) => {
  // Try to get API key from environment, settings, or direct node data
  const envApiKey = import.meta.env.PERPLEXITY_API_KEY;
  const [isLoading, setIsLoading] = useState(false);
  const [searchResult, setSearchResult] = useState('');
  const reactFlowInstance = useReactFlow();
  
  // Handle different sources of API key with proper fallbacks
  const apiKey = data.settings?.apiKey || data.apiKey || envApiKey || '';
  const model = data.settings?.model || 'sonar-small-online';
  
  // Check if workflow run is processing this node
  const isProcessing = data._isProcessing || false;
  
  // Use search result from workflow run if available
  // Ensure we convert any object to string
  const displayResult = data._searchResult 
    ? (typeof data._searchResult === 'object' ? JSON.stringify(data._searchResult) : data._searchResult)
    : searchResult;

  // Update apiKey in data if environment variable is available
  useEffect(() => {
    if (envApiKey && !data.apiKey) {
      data.apiKey = envApiKey;
    }
  }, [envApiKey, data]);
  
  const handleSearch = async () => {
    if (!data.inputText) {
      setSearchResult('No input provided');
      return;
    }
    
    // Use environment API key if available, otherwise use input
    const effectiveApiKey = envApiKey || apiKey;
    
    if (!effectiveApiKey) {
      setSearchResult('Please enter your Perplexity API key');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Simple search with Perplexity API
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${effectiveApiKey}`
        },
        body: JSON.stringify({
          model: model,  // Use model from settings
          messages: [
            {
              role: "user",
              content: data.inputText
            }
          ]
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API error status:', response.status);
        console.error('API error text:', errorText);
        throw new Error(`API responded with status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log("Perplexity API response:", result);
      
      if (result.choices && result.choices[0] && result.choices[0].message) {
        const newResult = result.choices[0].message.content;
        setSearchResult(newResult);
        
        // Send result to next node if available
        if (data.onOutputChange) {
          data.onOutputChange(newResult);
        }
      } else {
        setSearchResult('Unexpected API response format');
      }
    } catch (error: any) {
      console.error('Error searching with Perplexity API:', error);
      setSearchResult(`Error connecting to Perplexity API: ${error.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Card className={`w-64 transition-all duration-200 ${selected ? 'ring-2 ring-primary' : ''}`}
        style={{ background: '#111', color: '#fff', borderColor: '#333' }}>
      <CardHeader className="flex flex-row items-center justify-between p-3 pb-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-zinc-800 flex items-center justify-center text-zinc-300">
            <DynamicIcon icon={data.icon || 'search'} />
          </div>
          <span className="font-medium text-sm truncate">{data.label || 'Perplexity API'}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            className="p-1 hover:bg-zinc-800 rounded-sm transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              // Manually trigger a click on the node which will activate the onNodeClick handler
              if (reactFlowInstance && id) {
                const node = reactFlowInstance.getNode(id);
                if (node) {
                  // Simulate a click event
                  const nodeElement = document.querySelector(`[data-id="${id}"]`);
                  if (nodeElement) {
                    nodeElement.dispatchEvent(
                      new MouseEvent('click', { bubbles: true, cancelable: true })
                    );
                  }
                }
              }
            }}
            title="Open node settings"
          >
            <Lucide.Settings className="h-3 w-3 text-zinc-400" />
          </button>
          <Badge variant="outline" className="bg-zinc-800 text-zinc-300 text-[10px] font-normal border-zinc-700">AI Search</Badge>
        </div>
      </CardHeader>
      
      <CardContent className="p-3 pt-0">
        <div className="mb-2">
          {/* API Key Indicator */}
          {apiKey ? (
            <div className="bg-zinc-900 border border-zinc-700 rounded-md p-2 text-xs mb-2 text-zinc-400 flex items-center">
              <Lucide.Key className="h-3 w-3 mr-1 text-green-500" />
              API key configured
            </div>
          ) : (
            <div className="bg-zinc-900 border border-zinc-700 rounded-md p-2 text-xs mb-2 text-zinc-400 flex items-center">
              <Lucide.Key className="h-3 w-3 mr-1 text-red-500" />
              No API key configured
            </div>
          )}
          
          {/* Model Indicator */}
          <div className="bg-zinc-900 border border-zinc-700 rounded-md p-2 text-xs mb-2 text-zinc-400 flex items-center justify-between">
            <div className="flex items-center">
              <Lucide.Zap className="h-3 w-3 mr-1 text-yellow-500" />
              <span>Model:</span>
            </div>
            <span className="text-zinc-300">{model}</span>
          </div>
        </div>
        
        <div className="bg-zinc-900 border border-zinc-700 rounded-md p-2 min-h-[60px] text-xs mb-2">
          {data.inputText ? (
            <p className="text-zinc-300">
              {typeof data.inputText === 'object' 
                ? JSON.stringify(data.inputText) 
                : String(data.inputText)}
            </p>
          ) : (
            <div className="text-zinc-500 text-xs flex items-center justify-center h-full">
              No input provided
            </div>
          )}
        </div>
        
        <div className="flex gap-2 mb-2">
          <Button 
            variant="default" 
            size="sm" 
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            onClick={handleSearch}
            disabled={isLoading || isProcessing}
          >
            {isLoading || isProcessing ? (
              <>
                <Lucide.Loader2 className="h-3 w-3 mr-1 animate-spin" />
                {isProcessing ? "Processing..." : "Searching..."}
              </>
            ) : (
              <>
                <Lucide.Search className="h-3 w-3 mr-1" />
                Search
              </>
            )}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700"
            onClick={(e) => {
              e.stopPropagation();
              // Manually trigger a click on the node which will activate the onNodeClick handler
              if (reactFlowInstance && id) {
                const node = reactFlowInstance.getNode(id);
                if (node) {
                  // Simulate a click event
                  const nodeElement = document.querySelector(`[data-id="${id}"]`);
                  if (nodeElement) {
                    nodeElement.dispatchEvent(
                      new MouseEvent('click', { bubbles: true, cancelable: true })
                    );
                  }
                }
              }
            }}
          >
            <Lucide.Settings className="h-3 w-3 mr-1" />
            Settings
          </Button>
        </div>
        
        {(displayResult || searchResult) && (
          <div className="bg-zinc-900 border border-zinc-700 rounded-md p-2 min-h-[80px] text-xs">
            <p className="text-zinc-300 whitespace-pre-line">
              {typeof displayResult === 'object' 
                ? JSON.stringify(displayResult, null, 2) 
                : typeof searchResult === 'object'
                  ? JSON.stringify(searchResult, null, 2)
                  : String(displayResult || searchResult)}
            </p>
          </div>
        )}
      </CardContent>
      
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !border-2 !border-zinc-500 !bg-zinc-900"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !border-2 !border-zinc-500 !bg-zinc-900"
      />
    </Card>
  );
};

export default PerplexityNode;
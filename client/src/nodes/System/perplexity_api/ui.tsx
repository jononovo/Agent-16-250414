/**
 * Perplexity API Node UI Component
 * 
 * This component provides the visual representation of the Perplexity API node in the ReactFlow canvas.
 */

import React, { useState } from 'react';
import { Handle, Position } from 'reactflow';
import { Search, ExternalLink, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface PerplexityApiNodeProps {
  id: string;
  data: {
    label?: string;
    settings?: {
      apiKey?: string;
      model?: string;
      searchRecencyFilter?: string;
    };
    _isProcessing?: boolean;
    _isComplete?: boolean; 
    _hasError?: boolean;
    _errorMessage?: string;
    _result?: any;
  };
  selected: boolean;
  isConnectable?: boolean;
}

const PerplexityApiNode: React.FC<PerplexityApiNodeProps> = ({ 
  id, 
  data, 
  selected,
  isConnectable = true
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Determine node state for styling
  const isConfigured = !!data.settings?.apiKey;
  const isExecuting = !!data._isProcessing;
  const hasError = !!data._hasError;
  const hasResult = !!data._result;
  
  // Get model name for display
  const getModelName = () => {
    const model = data.settings?.model || 'llama-3.1-sonar-small-128k-online';
    
    // Format model name for display
    if (model.includes('llama-3.1-sonar-small')) {
      return 'Llama 3.1 Sonar Small';
    } else if (model.includes('llama-3.1-sonar-large')) {
      return 'Llama 3.1 Sonar Large';
    } else if (model.includes('llama-3.1-sonar-huge')) {
      return 'Llama 3.1 Sonar Huge';
    }
    
    return model;
  };
  
  // Format search recency for display
  const getSearchRecencyText = () => {
    const recency = data.settings?.searchRecencyFilter || 'month';
    
    switch(recency) {
      case 'day': return 'Past day';
      case 'week': return 'Past week';
      case 'month': return 'Past month';
      case 'year': return 'Past year';
      case 'all': return 'All time';
      default: return 'Past month';
    }
  };
  
  // Get result info if available
  const getCitationCount = () => {
    if (data._result?.citations) {
      return data._result.citations.length;
    }
    return null;
  };
  
  return (
    <>
      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Top}
        id="input"
        isConnectable={isConnectable}
        className="w-2 h-2 rounded-full border-2 border-blue-500 bg-white"
      />
      
      {/* Node container */}
      <div 
        className={cn(
          "perplexity-node rounded-lg border shadow-sm min-w-[240px] max-w-[320px]",
          selected ? "ring-2 ring-blue-500" : "",
          hasError ? "border-red-300 bg-red-50" : "border-slate-200 bg-white"
        )}
      >
        {/* Node header */}
        <div className="p-3 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 mr-2">
              <Search size={12} />
            </div>
            <span className="font-medium text-sm">
              {data.label || 'Perplexity API'}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            {isExecuting && (
              <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                Searching...
              </Badge>
            )}
            
            {hasError && (
              <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">
                Error
              </Badge>
            )}
            
            {!isExecuting && !hasError && hasResult && (
              <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                Complete
              </Badge>
            )}
            
            {!isConfigured && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center">
                    <AlertCircle size={14} className="text-amber-500" />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="w-[200px] text-xs">
                    This node requires a Perplexity API key to function properly. Configure the node settings to add your key.
                  </p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
        
        {/* Node content */}
        <div className="p-3 text-sm">
          <div className="text-slate-700">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">Model:</span>
              <span className="text-xs bg-slate-100 px-2 py-1 rounded">{getModelName()}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="font-medium">Search:</span>
              <span className="text-xs text-slate-600">{getSearchRecencyText()}</span>
            </div>
            
            {/* Show results summary if available */}
            {hasResult && (
              <div onClick={() => setIsExpanded(!isExpanded)} className="mt-2 cursor-pointer">
                <div className="text-xs text-slate-500 mb-1 flex justify-between">
                  <span>Result Summary</span>
                  {getCitationCount() !== null && (
                    <span>{getCitationCount()} citation{getCitationCount() !== 1 ? 's' : ''}</span>
                  )}
                </div>
                
                {isExpanded && data._result?.answer && (
                  <div className="mt-2 p-2 text-xs bg-slate-50 rounded border border-slate-200 max-h-[100px] overflow-y-auto">
                    {data._result.answer.substring(0, 150)}
                    {data._result.answer.length > 150 && '...'}
                  </div>
                )}
                
                {isExpanded && data._result?.citations && data._result.citations.length > 0 && (
                  <div className="mt-2">
                    <span className="text-xs font-medium">Sources:</span>
                    <div className="text-xs text-slate-500">
                      {data._result.citations.slice(0, 2).map((citation: string, index: number) => (
                        <div key={index} className="flex items-center mt-1">
                          <ExternalLink size={10} className="mr-1 text-blue-500" />
                          <a 
                            href={citation} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="truncate text-blue-500 hover:underline"
                          >
                            {citation.replace(/^https?:\/\//, '').split('/')[0]}
                          </a>
                        </div>
                      ))}
                      {data._result.citations.length > 2 && (
                        <div className="text-xs mt-1">+{data._result.citations.length - 2} more</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Show error if present */}
            {hasError && data._errorMessage && (
              <div className="mt-2 text-xs text-red-600 p-2 bg-red-50 rounded border border-red-200">
                Error: {data._errorMessage}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="output"
        isConnectable={isConnectable}
        className="w-2 h-2 rounded-full border-2 border-blue-500 bg-white"
      />
    </>
  );
};

export default PerplexityApiNode;
import { useState } from 'react';
import { NodeProps, Handle, Position } from 'reactflow';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bot, Settings } from 'lucide-react';
import DynamicIcon from '@/components/ui/dynamic-icon';

// Define the node data interface
interface NodeData {
  label?: string;
  description?: string;
  icon?: string;
  settings?: {
    model?: string;
    systemPrompt?: string;
    temperature?: number;
    maxTokens?: number;
    [key: string]: any;
  };
  [key: string]: any;
}

/**
 * Claude AI node for generating text using Anthropic's Claude API
 */
const ClaudeNode = ({ data, selected }: NodeProps<NodeData>) => {
  const [expanded, setExpanded] = useState(false);
  
  // Default node data if not provided
  const nodeLabel = data.label || 'Claude AI';
  const nodeDescription = data.description || 'Generate text using Claude AI';
  const nodeIcon = data.icon || 'Bot';
  
  // Extract model information from settings
  const model = data.settings?.model || 'claude-3-sonnet-20240229';
  const modelDisplay = model.split('-').slice(0, 2).join(' ').toUpperCase();
  
  return (
    <Card 
      className={`w-56 transition-all duration-200 ${selected ? 'ring-2 ring-primary' : ''}`}
      style={{ background: 'linear-gradient(135deg, #f0f4ff 0%, #e0e7ff 100%)' }}
    >
      <CardHeader className="flex flex-row items-center justify-between p-3 pb-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-indigo-100 flex items-center justify-center text-indigo-600">
            {typeof nodeIcon === 'string' ? <DynamicIcon icon={nodeIcon} /> : <Bot size={14} />}
          </div>
          <span className="font-medium text-sm truncate">{nodeLabel}</span>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-6 w-6"
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(!expanded);
          }}
        >
          <Settings className="h-3 w-3" />
        </Button>
      </CardHeader>
      
      <CardContent className="p-3 pt-0">
        {expanded ? (
          <div className="space-y-2">
            <div className="text-xs font-medium text-indigo-600">{modelDisplay}</div>
            <div className="text-xs text-slate-500">{nodeDescription}</div>
            {data.settings?.systemPrompt && (
              <div className="mt-2 text-xs">
                <div className="font-medium text-slate-700">System Prompt:</div>
                <div className="text-slate-500 truncate">{data.settings.systemPrompt}</div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-xs text-slate-500">
            <span className="font-medium text-indigo-600 mr-1">{modelDisplay}</span>
            {nodeDescription}
          </div>
        )}
      </CardContent>
      
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !border-2 !border-indigo-400 !bg-background"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !border-2 !border-indigo-400 !bg-background"
      />
    </Card>
  );
};

export default ClaudeNode;
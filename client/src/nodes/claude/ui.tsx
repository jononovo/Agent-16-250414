/**
 * Claude Node UI Component
 * Visual representation of the Claude node in the flow editor
 */
import { useState } from 'react';
import { Handle, Position, NodeProps, useReactFlow } from 'reactflow';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, Settings, Info } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { ClaudeNodeData } from './executor';
import metadata from './metadata.json';

// The UI component for Claude node
const ClaudeNodeUI = ({ data, selected, id }: NodeProps<ClaudeNodeData>) => {
  const { setNodes } = useReactFlow();
  const [showSettings, setShowSettings] = useState(false);
  
  // Available models
  const models = [
    { value: 'claude-3-opus-20240229', label: 'Claude 3 Opus' },
    { value: 'claude-3-sonnet-20240229', label: 'Claude 3 Sonnet' },
    { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku' }
  ];
  
  // Update node data when configuration changes
  const updateNodeData = (updates: Partial<ClaudeNodeData>) => {
    setNodes(nodes => 
      nodes.map(node => {
        if (node.id === id) {
          return {
            ...node,
            data: {
              ...node.data,
              ...updates
            }
          };
        }
        return node;
      })
    );
  };
  
  return (
    <Card className={`w-72 transition-all duration-200 ${selected ? 'ring-2 ring-primary' : ''}`}
        style={{ background: '#111', color: '#fff', borderColor: '#333' }}>
      <CardHeader className="flex flex-row items-center justify-between p-3 pb-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-purple-900 flex items-center justify-center text-purple-300">
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="font-medium text-sm truncate">{data.label || metadata.name}</span>
        </div>
        <Badge variant="outline" className="bg-purple-950 text-purple-300 text-[10px] font-normal border-purple-800">AI</Badge>
      </CardHeader>
      
      <CardContent className="p-3 pt-0">
        {showSettings ? (
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs text-zinc-400">Model</label>
              <Select
                value={data.model || 'claude-3-opus-20240229'}
                onValueChange={(value) => updateNodeData({ model: value })}
              >
                <SelectTrigger className="h-8 text-xs bg-zinc-900 border-zinc-700">
                  <SelectValue placeholder="Select Model" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700 text-zinc-300">
                  {models.map((model) => (
                    <SelectItem key={model.value} value={model.value} className="text-xs">
                      {model.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-1">
              <div className="flex justify-between">
                <label className="text-xs text-zinc-400">Temperature</label>
                <span className="text-xs text-zinc-400">{data.temperature || 0.7}</span>
              </div>
              <Slider 
                value={[data.temperature || 0.7]}
                min={0}
                max={1}
                step={0.1}
                onValueChange={([value]) => updateNodeData({ temperature: value })}
                className="py-1"
              />
            </div>
            
            <div className="space-y-1">
              <div className="flex justify-between">
                <label className="text-xs text-zinc-400">Max Tokens</label>
                <span className="text-xs text-zinc-400">{data.maxTokens || 1000}</span>
              </div>
              <Slider 
                value={[data.maxTokens || 1000]}
                min={100}
                max={4000}
                step={100}
                onValueChange={([value]) => updateNodeData({ maxTokens: value })}
                className="py-1"
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-xs text-zinc-400">System Prompt</label>
              <Textarea 
                placeholder="Instructions for Claude"
                className="bg-zinc-900 border-zinc-700 text-zinc-300 min-h-[80px] text-xs"
                value={data.systemPrompt || ''}
                onChange={(e) => updateNodeData({ systemPrompt: e.target.value })}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-xs text-purple-300 rounded-sm bg-purple-950/30 p-2 border border-purple-900/50">
              <div className="flex items-center gap-1 mb-1">
                <Info className="h-3 w-3" />
                <span className="font-medium">Claude AI</span>
              </div>
              <p className="text-xs opacity-80">
                Generates AI responses using Claude language models.
              </p>
            </div>
            
            <div>
              <Badge variant="outline" className="bg-zinc-900 text-zinc-400 text-[10px] border-zinc-800">
                {data.model || 'claude-3-opus-20240229'}
              </Badge>
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="p-2 flex justify-between items-center border-t border-zinc-800">
        <Badge className="bg-purple-950 text-purple-300 text-[10px] border-none">
          {showSettings ? 'Settings' : 'Claude AI'}
        </Badge>
        <Button 
          variant="outline" 
          size="sm" 
          className="h-7 text-xs bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700"
          onClick={() => setShowSettings(!showSettings)}
        >
          {showSettings ? 'Back' : <Settings className="h-3 w-3" />}
        </Button>
      </CardFooter>
      
      {/* Input handles */}
      <Handle
        type="target"
        position={Position.Left}
        id="prompt"
        className="!w-3 !h-3 !-ml-0.5 !border-2 !border-zinc-500 !bg-zinc-900"
      />
      <Handle
        type="target"
        position={Position.Top}
        id="systemPrompt"
        className="!w-3 !h-3 !-mt-0.5 !border-2 !border-zinc-500 !bg-zinc-900"
      />
      
      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="response"
        className="!w-3 !h-3 !-mr-0.5 !border-2 !border-purple-500 !bg-zinc-900"
      />
    </Card>
  );
};

export default ClaudeNodeUI;
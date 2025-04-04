import { Handle, Position, NodeProps } from 'reactflow';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import * as Lucide from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { NodeData } from '../NodeItem';
import DynamicIcon from '../DynamicIcon';

const GenerateTextNode = ({ data, selected }: NodeProps<NodeData>) => {
  return (
    <Card className={`w-64 transition-all duration-200 ${selected ? 'ring-2 ring-primary' : ''}`}
        style={{ background: '#111', color: '#fff', borderColor: '#333' }}>
      <CardHeader className="flex flex-row items-center justify-between p-3 pb-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-zinc-800 flex items-center justify-center text-zinc-300">
            <DynamicIcon icon={data.icon || 'cpu'} />
          </div>
          <span className="font-medium text-sm truncate">{data.label || 'Generate Text'}</span>
        </div>
        <Badge variant="outline" className="bg-zinc-800 text-zinc-300 text-[10px] font-normal border-zinc-700">AI</Badge>
      </CardHeader>
      
      <CardContent className="p-3 pt-0 text-xs text-zinc-400">
        <div className="mb-2">
          <Select 
            defaultValue={data.model || 'claude-3.5-sonnet'} 
            onValueChange={(value) => {
              if (data.onChange) {
                data.onChange({ ...data, model: value });
              }
            }}
          >
            <SelectTrigger className="h-7 text-xs bg-zinc-800 text-zinc-300 border-zinc-700">
              <SelectValue placeholder="Select model" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-800 text-zinc-300 border-zinc-700">
              <SelectItem value="claude-3.5-sonnet">claude-3.5-sonnet</SelectItem>
              <SelectItem value="claude-3-opus">claude-3-opus</SelectItem>
              <SelectItem value="claude-3-sonnet">claude-3-sonnet</SelectItem>
              <SelectItem value="claude-3-haiku">claude-3-haiku</SelectItem>
              <SelectItem value="llama-3.3-70b-versatile">llama-3.3-70b-versatile</SelectItem>
              <SelectItem value="llama-3.1-8b">llama-3.1-8b</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Accordion type="single" collapsible className="mb-1">
          <AccordionItem value="system" className="border-zinc-800">
            <AccordionTrigger className="py-1 text-xs text-zinc-400 hover:text-zinc-200 hover:no-underline">System</AccordionTrigger>
            <AccordionContent>
              <Textarea 
                className="bg-zinc-900 border-zinc-700 text-zinc-300 min-h-[60px] text-xs font-mono"
                placeholder="Enter system prompt..."
                value={data.systemPrompt || 'You are a helpful AI assistant.'}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                  if (data.onChange) {
                    data.onChange({ ...data, systemPrompt: e.target.value });
                  }
                }}
              />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="prompt" className="border-zinc-800">
            <AccordionTrigger className="py-1 text-xs text-zinc-400 hover:text-zinc-200 hover:no-underline">Prompt</AccordionTrigger>
            <AccordionContent>
              <Textarea 
                className="bg-zinc-900 border-zinc-700 text-zinc-300 min-h-[60px] text-xs font-mono"
                placeholder="Enter user prompt..."
                value={data.userPrompt || 'Route the input here if the request is about...'}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                  if (data.onChange) {
                    data.onChange({ ...data, userPrompt: e.target.value });
                  }
                }}
              />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="outputs" className="border-zinc-800">
            <AccordionTrigger className="py-1 text-xs text-zinc-400 hover:text-zinc-200 hover:no-underline">Tool outputs</AccordionTrigger>
            <AccordionContent>
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between p-2 bg-zinc-800 rounded">
                  <span className="text-xs text-zinc-300">blog-expert</span>
                  <Button variant="ghost" size="sm" className="h-5 w-5 p-0 text-zinc-400 hover:text-zinc-200">
                    <Lucide.Copy className="h-3 w-3" />
                  </Button>
                </div>
                <div className="flex items-center justify-between p-2 bg-zinc-800 rounded">
                  <span className="text-xs text-zinc-300">short-form-expert</span>
                  <Button variant="ghost" size="sm" className="h-5 w-5 p-0 text-zinc-400 hover:text-zinc-200">
                    <Lucide.Copy className="h-3 w-3" />
                  </Button>
                </div>
                <div className="flex items-center justify-between p-2 bg-zinc-800 rounded">
                  <span className="text-xs text-zinc-300">seo-web-expert</span>
                  <Button variant="ghost" size="sm" className="h-5 w-5 p-0 text-zinc-400 hover:text-zinc-200">
                    <Lucide.Copy className="h-3 w-3" />
                  </Button>
                </div>
                <Button variant="outline" size="sm" className="h-6 text-[10px] mt-1 bg-zinc-800 text-zinc-300 border-zinc-700">
                  <Lucide.Plus className="h-3 w-3 mr-1" />
                  New tool output
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        
        <div className="flex items-center justify-between mt-2">
          <div className="flex gap-2">
            <Badge className="bg-blue-900 text-blue-300 text-[10px] border-none">Input</Badge>
            <Badge className="bg-blue-900 text-blue-300 text-[10px] border-none">Result</Badge>
          </div>
          <Button variant="outline" size="sm" className="h-6 text-xs bg-zinc-800 text-zinc-300 border-zinc-700">
            <Lucide.Settings className="h-3 w-3 mr-1" />
            Configure
          </Button>
        </div>
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

export default GenerateTextNode;
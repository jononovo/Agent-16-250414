import { Handle, Position, NodeProps } from 'reactflow';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import * as Lucide from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { NodeData } from '../NodeItem';
import DynamicIcon from '../DynamicIcon';

const PromptCrafterNode = ({ data, selected }: NodeProps<NodeData>) => {
  return (
    <Card className={`w-64 transition-all duration-200 ${selected ? 'ring-2 ring-primary' : ''}`}
        style={{ background: '#111', color: '#fff', borderColor: '#333' }}>
      <CardHeader className="flex flex-row items-center justify-between p-3 pb-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-zinc-800 flex items-center justify-center text-zinc-300">
            <DynamicIcon icon={data.icon || 'sparkles'} />
          </div>
          <span className="font-medium text-sm truncate">{data.label || 'Prompt Crafter'}</span>
        </div>
        <Badge variant="outline" className="bg-zinc-800 text-zinc-300 text-[10px] font-normal border-zinc-700">AI</Badge>
      </CardHeader>
      
      <CardContent className="p-3 pt-0">
        <Accordion type="single" collapsible defaultValue="template" className="mb-2">
          <AccordionItem value="template" className="border-zinc-800">
            <AccordionTrigger className="py-1 text-xs text-zinc-400 hover:text-zinc-200 hover:no-underline">
              Template
            </AccordionTrigger>
            <AccordionContent>
              <Textarea 
                className="bg-zinc-900 border-zinc-700 text-zinc-300 min-h-[100px] text-xs font-mono"
                placeholder="Insert your prompt template here..."
                value={data.promptTemplate || `You are a helpful assistant.
{{system_message}}
User: {{input}}
Assistant:`}
              />
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="variables" className="border-zinc-800">
            <AccordionTrigger className="py-1 text-xs text-zinc-400 hover:text-zinc-200 hover:no-underline">
              Variables
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-zinc-800 rounded">
                  <span className="text-xs text-zinc-300">system_message</span>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-zinc-400 hover:text-zinc-200">
                      <Lucide.Edit className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-zinc-400 hover:text-zinc-200">
                      <Lucide.Trash className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between p-2 bg-zinc-800 rounded">
                  <span className="text-xs text-zinc-300">input</span>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-zinc-400 hover:text-zinc-200">
                      <Lucide.Edit className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-zinc-400 hover:text-zinc-200">
                      <Lucide.Trash className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full h-7 text-xs bg-zinc-800 text-zinc-300 border-zinc-700">
                  <Lucide.Plus className="h-3 w-3 mr-1" />
                  Add Variable
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="outputs" className="border-zinc-800">
            <AccordionTrigger className="py-1 text-xs text-zinc-400 hover:text-zinc-200 hover:no-underline">
              Tool outputs
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                <div className="p-2 bg-zinc-800 rounded text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-zinc-300">original-article</span>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-zinc-400 hover:text-zinc-200">
                      <Lucide.Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <p className="mt-1 text-zinc-400 text-[10px]">Content unchanged from input</p>
                </div>
                <div className="flex items-center p-2 gap-1">
                  <span className="text-xs text-zinc-400">Handling:</span>
                  <Badge className="bg-green-900 text-green-300 text-[10px] border-none">input</Badge>
                  <Badge className="bg-blue-900 text-blue-300 text-[10px] border-none">output</Badge>
                </div>
                <Button variant="outline" size="sm" className="w-full h-7 text-xs bg-zinc-800 text-zinc-300 border-zinc-700">
                  <Lucide.Plus className="h-3 w-3 mr-1" />
                  New tool output
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
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

export default PromptCrafterNode;
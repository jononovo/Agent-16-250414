import { Handle, Position, NodeProps } from 'reactflow';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import * as Lucide from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { NodeData } from '../NodeItem';

const DynamicIcon = ({ name }: { name: string }) => {
  const IconComponent = (Lucide as any)[name.charAt(0).toUpperCase() + name.slice(1)];
  
  if (!IconComponent) {
    return <Lucide.Circle className="h-4 w-4" />;
  }
  
  return <IconComponent className="h-4 w-4" />;
};

const GenerateTextNode = ({ data, selected }: NodeProps<NodeData>) => {
  return (
    <Card className={`w-64 transition-all duration-200 ${selected ? 'ring-2 ring-primary' : ''}`}>
      <CardHeader className="flex flex-row items-center justify-between p-3 pb-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-green-100 flex items-center justify-center text-green-600">
            <DynamicIcon name={data.icon || 'cpu'} />
          </div>
          <span className="font-medium text-sm truncate">{data.label || 'Generate Text'}</span>
        </div>
        <Badge variant="outline" className="bg-green-50 text-green-600 text-[10px] font-normal border-green-200">Generate</Badge>
      </CardHeader>
      
      <CardContent className="p-3 pt-0 text-xs text-slate-500">
        <div className="mb-2">
          <Select defaultValue={data.model || 'llama-3.3-70b-versatile'}>
            <SelectTrigger className="h-7 text-xs">
              <SelectValue placeholder="Select model" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="llama-3.3-70b-versatile">llama-3.3-70b-versatile</SelectItem>
              <SelectItem value="llama-3.1-8b">llama-3.1-8b</SelectItem>
              <SelectItem value="claude-3.5-sonnet">claude-3.5-sonnet</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Accordion type="single" collapsible className="mb-1">
          <AccordionItem value="system">
            <AccordionTrigger className="py-1 text-xs">System</AccordionTrigger>
            <AccordionContent>
              <div className="bg-slate-50 p-2 rounded text-xs font-mono">
                {data.systemPrompt || 'Tool outputs'}
              </div>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="prompt">
            <AccordionTrigger className="py-1 text-xs">Prompt</AccordionTrigger>
            <AccordionContent>
              <div className="bg-slate-50 p-2 rounded text-xs font-mono">
                {data.userPrompt || 'Route the input here if the request is about...'}
              </div>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="outputs">
            <AccordionTrigger className="py-1 text-xs">Outputs</AccordionTrigger>
            <AccordionContent>
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs">blog-expert</span>
                  <Button variant="ghost" size="sm" className="h-5 text-[10px]">
                    <Lucide.Plus className="h-2.5 w-2.5 mr-1" />
                    Add
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs">short-form-expert</span>
                  <Button variant="ghost" size="sm" className="h-5 text-[10px]">
                    <Lucide.Plus className="h-2.5 w-2.5 mr-1" />
                    Add
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs">seo-web-expert</span>
                  <Button variant="ghost" size="sm" className="h-5 text-[10px]">
                    <Lucide.Plus className="h-2.5 w-2.5 mr-1" />
                    Add
                  </Button>
                </div>
                <Button variant="outline" size="sm" className="h-6 text-[10px] mt-1">
                  <Lucide.Plus className="h-3 w-3 mr-1" />
                  New output
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        
        <div className="mt-2 flex justify-end">
          <Button variant="ghost" size="sm" className="h-6 text-xs">
            <Lucide.Settings className="h-3 w-3 mr-1" />
            Configure
          </Button>
        </div>
      </CardContent>
      
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !border-2 !border-green-500 !bg-background"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !border-2 !border-green-500 !bg-background"
      />
    </Card>
  );
};

export default GenerateTextNode;
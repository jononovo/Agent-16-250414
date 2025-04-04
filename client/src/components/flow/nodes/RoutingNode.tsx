import { Handle, Position, NodeProps } from 'reactflow';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import * as Lucide from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { NodeData } from '../NodeItem';

const DynamicIcon = ({ name }: { name: string }) => {
  const IconComponent = (Lucide as any)[name.charAt(0).toUpperCase() + name.slice(1)];
  
  if (!IconComponent) {
    return <Lucide.Circle className="h-4 w-4" />;
  }
  
  return <IconComponent className="h-4 w-4" />;
};

const RouteItem = ({ label, description }: { label: string, description: string }) => (
  <div className="border border-slate-200 rounded p-2 mb-2">
    <div className="flex items-center justify-between mb-1">
      <span className="font-medium text-xs">{label}</span>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" className="h-5 w-5 p-0">
          <Lucide.Pencil className="h-3 w-3" />
        </Button>
        <Button variant="ghost" size="sm" className="h-5 w-5 p-0">
          <Lucide.Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
    <p className="text-xs text-slate-500">{description}</p>
  </div>
);

const RoutingNode = ({ data, selected }: NodeProps<NodeData>) => {
  return (
    <Card className={`w-64 transition-all duration-200 ${selected ? 'ring-2 ring-primary' : ''}`}>
      <CardHeader className="flex flex-row items-center justify-between p-3 pb-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-amber-100 flex items-center justify-center text-amber-600">
            <DynamicIcon name={data.icon || 'gitFork'} />
          </div>
          <span className="font-medium text-sm truncate">{data.label || 'Route Content'}</span>
        </div>
        <Badge variant="outline" className="bg-amber-50 text-amber-600 text-[10px] font-normal border-amber-200">Router</Badge>
      </CardHeader>
      
      <CardContent className="p-3 pt-0 text-xs text-slate-500">
        <Accordion type="single" collapsible defaultValue="routes">
          <AccordionItem value="routes">
            <AccordionTrigger className="py-1 text-xs">Routes</AccordionTrigger>
            <AccordionContent>
              <div className="mb-2">
                <RouteItem 
                  label="blog-expert" 
                  description="Route the input here if the request is about writing blogs, or related"
                />
                <RouteItem 
                  label="short-form-expert" 
                  description="Route the input here if the request is about short form content"
                />
                <RouteItem 
                  label="seo-web-expert" 
                  description="Route the input here if the request is to optimize for search engines"
                />
                <Button variant="outline" size="sm" className="h-6 w-full text-[10px]">
                  <Lucide.Plus className="h-3 w-3 mr-1" />
                  Add Route
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
        className="!w-3 !h-3 !border-2 !border-amber-500 !bg-background"
      />
      <Handle
        id="blog-expert"
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !border-2 !border-amber-500 !bg-background !-translate-x-10"
      />
      <Handle
        id="short-form-expert"
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !border-2 !border-amber-500 !bg-background"
      />
      <Handle
        id="seo-web-expert"
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !border-2 !border-amber-500 !bg-background !translate-x-10"
      />
    </Card>
  );
};

export default RoutingNode;
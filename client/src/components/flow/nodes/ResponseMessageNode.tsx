import { Handle, Position, NodeProps } from 'reactflow';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import * as Lucide from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { NodeData } from '../NodeItem';

type IconProps = {
  name: string | React.ComponentType<any>;
};

const DynamicIcon = ({ name }: IconProps) => {
  if (typeof name !== 'string') {
    const Icon = name;
    return <Icon className="h-4 w-4" />;
  }
  
  const IconComponent = (Lucide as any)[name.charAt(0).toUpperCase() + name.slice(1)];
  
  if (!IconComponent) {
    return <Lucide.MessageSquare className="h-4 w-4" />;
  }
  
  return <IconComponent className="h-4 w-4" />;
};

const ResponsePath = ({ label, description, type }: { label: string, description: string, type: 'success' | 'error' }) => (
  <div className={`${type === 'success' ? 'bg-green-950' : 'bg-red-950'} rounded p-2 mb-2`}>
    <div className="flex items-center justify-between mb-1">
      <div className="flex items-center gap-1">
        {type === 'success' ? (
          <Lucide.CheckCircle className="h-3 w-3 text-green-400" />
        ) : (
          <Lucide.XCircle className="h-3 w-3 text-red-400" />
        )}
        <span className={`font-medium text-xs ${type === 'success' ? 'text-green-300' : 'text-red-300'}`}>{label}</span>
      </div>
    </div>
    <p className="text-xs text-zinc-300">{description}</p>
  </div>
);

const ResponseMessageNode = ({ data, selected }: NodeProps<NodeData>) => {
  // Default values if not provided
  const settings = data.settings || {};
  const successMessage = settings.successMessage || "Your agent has been created successfully!";
  const errorMessage = settings.errorMessage || "There was an error creating your agent.";
  const conditionField = settings.conditionField || "result";
  const successValue = settings.successValue || "success";
  
  return (
    <Card className={`w-64 transition-all duration-200 ${selected ? 'ring-2 ring-primary' : ''}`}
        style={{ background: '#111', color: '#fff', borderColor: '#333' }}>
      <CardHeader className="flex flex-row items-center justify-between p-3 pb-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-zinc-800 flex items-center justify-center text-zinc-300">
            <DynamicIcon name={data.icon || 'messageSquare'} />
          </div>
          <span className="font-medium text-sm truncate">{data.label || 'Response Message'}</span>
        </div>
        <Badge variant="outline" className="bg-zinc-800 text-zinc-300 text-[10px] font-normal border-zinc-700">Response</Badge>
      </CardHeader>
      
      <CardContent className="p-3 pt-0 text-xs text-zinc-400">
        <p className="mb-2">Displays appropriate response message based on condition.</p>
        
        <Accordion type="single" collapsible defaultValue="paths" className="mb-2">
          <AccordionItem value="paths" className="border-zinc-800">
            <AccordionTrigger className="py-1 text-xs text-zinc-400 hover:text-zinc-200 hover:no-underline">
              Response Paths
            </AccordionTrigger>
            <AccordionContent>
              <div className="mb-2">
                <ResponsePath 
                  label="Success Path" 
                  description={successMessage}
                  type="success"
                />
                <ResponsePath 
                  label="Error Path" 
                  description={errorMessage}
                  type="error"
                />
              </div>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="condition" className="border-zinc-800">
            <AccordionTrigger className="py-1 text-xs text-zinc-400 hover:text-zinc-200 hover:no-underline">
              Condition Logic
            </AccordionTrigger>
            <AccordionContent>
              <div className="flex flex-col gap-1 bg-zinc-800 p-2 rounded text-[10px]">
                <div className="flex items-center gap-1">
                  <span className="text-zinc-300">IF</span>
                  <Badge className="bg-blue-900 text-blue-300 text-[10px] border-none">{conditionField}</Badge>
                  <span className="text-zinc-300">==</span>
                  <Badge className="bg-green-900 text-green-300 text-[10px] border-none">{successValue}</Badge>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-zinc-300 ml-2">THEN</span>
                  <Badge className="bg-green-900 text-green-300 text-[10px] border-none">Success Path</Badge>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-zinc-300">ELSE</span>
                  <Badge className="bg-red-900 text-red-300 text-[10px] border-none">Error Path</Badge>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        
        <div className="flex items-center justify-between mt-2">
          <Badge className="bg-blue-900 text-blue-300 text-[10px] border-none">Input</Badge>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-6 text-xs bg-zinc-800 text-zinc-300 border-zinc-700"
            onClick={() => {
              // Trigger settings drawer
              if (data.onSettingsClick) {
                data.onSettingsClick();
              } else {
                // Fallback to dispatch event
                const event = new CustomEvent('node-settings-open', {
                  detail: { nodeId: data.id }
                });
                window.dispatchEvent(event);
              }
            }}
          >
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
        id="success"
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !border-2 !border-green-500 !bg-green-900 !-translate-x-10"
      />
      <Handle
        id="error"
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !border-2 !border-red-500 !bg-red-900 !translate-x-10"
      />
    </Card>
  );
};

export default ResponseMessageNode;
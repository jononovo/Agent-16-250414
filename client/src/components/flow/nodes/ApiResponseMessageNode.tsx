import React, { useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { MessageCircle, Check, AlertTriangle, Settings } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { NodeResizer } from '@reactflow/node-resizer';
import '@reactflow/node-resizer/dist/style.css';

// Node component for API Response Message
const ApiResponseMessageNode: React.FC<NodeProps> = ({ data, selected, id }) => {
  // Get settings with defaults
  const settings = data.settings || {};
  const successMessage = settings.successMessage || 'Operation completed successfully!';
  const errorMessage = settings.errorMessage || 'Operation failed. Please try again.';
  const conditionField = settings.conditionField || 'status';
  const successValue = settings.successValue || 'success';
  const targetEndpoint = settings.targetEndpoint || '/api/chat';
  
  const openSettingsDrawer = () => {
    // Trigger settings drawer via custom event
    const event = new CustomEvent('node-settings-open', {
      detail: { nodeId: id }
    });
    window.dispatchEvent(event);
  };
  
  return (
    <>
      <NodeResizer 
        minWidth={280}
        minHeight={200}
        isVisible={selected}
        lineClassName="border-primary"
        handleClassName="bg-primary border-primary"
      />
      
      <Card className="w-64 min-h-[200px] transition-all duration-200" 
          style={{ background: '#111', color: '#fff', borderColor: '#333' }}>
        <CardHeader className="p-3 pb-2 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-zinc-800 flex items-center justify-center text-zinc-300">
              <MessageCircle className="h-4 w-4" />
            </div>
            <span className="font-medium text-sm truncate">
              {data.label || 'API Response Message'}
            </span>
          </div>
          <Badge variant="outline" className="bg-zinc-800 text-zinc-300 text-[10px] font-normal border-zinc-700">Message</Badge>
        </CardHeader>
        
        <CardContent className="p-3 pt-0 text-xs text-zinc-400">
          <p className="mb-2">
            {data.description || 'Sends a direct message to the chat UI.'}
          </p>
          
          <Accordion type="single" collapsible defaultValue="paths" className="mb-2">
            <AccordionItem value="paths" className="border-zinc-800">
              <AccordionTrigger className="py-1 text-xs text-zinc-400 hover:text-zinc-200 hover:no-underline">
                Response Paths
              </AccordionTrigger>
              <AccordionContent>
                <div className="flex items-center gap-1 mb-2 bg-green-950 p-2 rounded">
                  <Check size={14} className="text-green-400" />
                  <span className="line-clamp-2 text-green-300">{successMessage}</span>
                </div>
                
                <div className="flex items-center gap-1 bg-red-950 p-2 rounded">
                  <AlertTriangle size={14} className="text-red-400" />
                  <span className="line-clamp-2 text-red-300">{errorMessage}</span>
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
              onClick={openSettingsDrawer}
            >
              <Settings className="h-3 w-3 mr-1" />
              Configure
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !border-2 !border-zinc-500 !bg-zinc-900"
      />
      
      {/* Output handles */}
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
    </>
  );
};

export default ApiResponseMessageNode;
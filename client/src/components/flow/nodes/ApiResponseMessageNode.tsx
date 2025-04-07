import React, { useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { ArrowRight, MessageCircle, Check, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { NodeResizer } from '@reactflow/node-resizer';
import '@reactflow/node-resizer/dist/style.css';

// Node component for API Response Message
const ApiResponseMessageNode: React.FC<NodeProps> = ({ data, selected, id }) => {
  const [expanded, setExpanded] = useState(false);
  
  // Get settings with defaults
  const settings = data.settings || {};
  const successMessage = settings.successMessage || 'Operation completed successfully!';
  const errorMessage = settings.errorMessage || 'Operation failed. Please try again.';
  const targetEndpoint = settings.targetEndpoint || '/api/chat';
  
  return (
    <>
      <NodeResizer 
        minWidth={200}
        minHeight={100}
        isVisible={selected}
        lineClassName="border-primary"
        handleClassName="bg-primary border-primary"
      />
      
      <Card className={`w-full min-w-[280px] max-w-[400px] overflow-hidden ${expanded ? 'h-auto' : 'h-[120px]'} transition-all duration-200`}>
        <CardHeader className="p-3 pb-1 flex flex-row items-center justify-between">
          <div className="flex gap-2 items-center">
            <MessageCircle size={16} className="text-primary" />
            <CardTitle className="text-sm font-medium">
              {data.label || 'API Response Message'}
            </CardTitle>
          </div>
          
          <Badge variant="outline" className="ml-2 text-xs">
            {data.type === 'api_response_message' ? 'API' : 'Message'}
          </Badge>
        </CardHeader>
        
        <CardContent className="p-3 pt-0">
          <CardDescription className="text-xs mb-1 line-clamp-1">
            {data.description || 'Sends a direct message to the chat UI.'}
          </CardDescription>
          
          <div className="mt-3 text-xs">
            <div className="flex items-center gap-1 mb-1">
              <Check size={14} className="text-emerald-500" />
              <span className="line-clamp-1">{successMessage}</span>
            </div>
            
            <div className="flex items-center gap-1">
              <AlertTriangle size={14} className="text-amber-500" />
              <span className="line-clamp-1">{errorMessage}</span>
            </div>
            
            {expanded && (
              <div className="mt-2 border-t border-border pt-2">
                <p className="text-xs opacity-70">Target: {targetEndpoint}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-2 h-6 rounded-sm bg-primary border-primary"
      />
      
      {/* Output handles */}
      <Handle
        type="source"
        position={Position.Right}
        id="success"
        className="w-2 h-3 rounded-sm bg-emerald-500 border-emerald-600 -translate-y-3"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="error"
        className="w-2 h-3 rounded-sm bg-amber-500 border-amber-600 translate-y-3"
      />
    </>
  );
};

export default ApiResponseMessageNode;
import { useCallback } from 'react';
import { Handle, Position } from 'reactflow';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import DynamicIcon from '@/components/flow/DynamicIcon';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// Props interface for the internal node
interface InternalNodeProps {
  id: string;
  data: {
    label?: string;
    description?: string;
    operation?: string;
    icon?: string;
    agent_id?: number;
    workflow_id?: number;
    trigger_type?: string;
    parameters?: Record<string, any>;
    [key: string]: any;
  };
  selected?: boolean;
}

/**
 * InternalNode Component
 * 
 * This component represents nodes that can trigger internal operations like
 * creating new agents or triggering processes within the application.
 */
export default function InternalNode({ id, data, selected }: InternalNodeProps) {
  // Default values for node appearance
  const label = data.label || 'Internal Node';
  const description = data.description || 'Executes internal system operations';
  const icon = data.icon || 'BrainCircuit';
  const operation = data.operation || 'internal_operation';
  
  // Handle node selection for editing
  const handleSelect = useCallback(() => {
    // Can be extended for additional behavior when node is selected
    console.log('Internal node selected:', id, data);
  }, [id, data]);

  return (
    <div onDoubleClick={handleSelect}>
      <Card 
        className={`w-[280px] overflow-hidden shadow-md ${
          selected ? 'ring-2 ring-primary' : ''
        }`}
      >
        <CardHeader className="p-3 pb-0">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <DynamicIcon 
                icon={icon} 
                className="text-primary w-5 h-5" 
              />
              <CardTitle className="text-sm font-medium">{label}</CardTitle>
            </div>
            
            <Badge variant="outline" className="text-xs">
              {operation}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="p-3 pt-2">
          <p className="text-xs text-muted-foreground">{description}</p>
          
          {data.agent_id && (
            <div className="mt-2 text-xs">
              <span className="font-semibold">Agent Template:</span> #{data.agent_id}
            </div>
          )}
          
          {data.workflow_id && (
            <div className="mt-1 text-xs">
              <span className="font-semibold">Workflow Template:</span> #{data.workflow_id}
            </div>
          )}
          
          {data.trigger_type && (
            <div className="mt-1 text-xs">
              <span className="font-semibold">Trigger:</span> {data.trigger_type}
            </div>
          )}
        </CardContent>
        
        <CardFooter className="p-3 pt-0 flex justify-end">
          <Button size="sm" variant="secondary" className="text-xs h-7">
            Configure
          </Button>
        </CardFooter>
      </Card>
      
      {/* Input handle on the left side */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-2 h-2 bg-primary border-2 border-background"
      />
      
      {/* Output handle on the right side */}
      <Handle
        type="source"
        position={Position.Right}
        className="w-2 h-2 bg-primary border-2 border-background"
      />
    </div>
  );
}
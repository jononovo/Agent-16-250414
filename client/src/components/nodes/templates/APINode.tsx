/**
 * APINode
 * 
 * A specialized node template for API integrations.
 * Provides a consistent structure for nodes that interact with external APIs.
 */

import React, { ReactNode, useState } from 'react';
import { NodeProps, Position, useUpdateNodeInternals } from 'reactflow';
import { Globe, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { nanoid } from 'nanoid';
import { NodeContainer } from '../common/NodeContainer';
import { NodeHeader } from '../common/NodeHeader';
import { NodeContent } from '../common/NodeContent';
import { EditableHandle } from '../handles/EditableHandle';

interface Port {
  id: string;
  label: string;
}

interface APINodeProps extends Omit<NodeProps, 'isConnectable'> {
  title: string;
  icon?: ReactNode;
  description?: string;
  headerActions?: ReactNode;
  children?: ReactNode;
  apiKey?: string;
  initialInputs?: Port[];
  initialOutputs?: Port[];
  isConnectable?: boolean;
}

export function APINode({
  title,
  icon = <Globe size={16} />,
  description,
  headerActions,
  children,
  apiKey,
  initialInputs = [{ id: 'prompt', label: 'Prompt' }],
  initialOutputs = [{ id: 'response', label: 'Response' }],
  isConnectable = true,
  selected,
  ...props
}: APINodeProps) {
  // State for dynamic inputs and outputs
  const [inputs, setInputs] = useState<Port[]>(initialInputs);
  const [outputs, setOutputs] = useState<Port[]>(initialOutputs);
  
  // Update node internals whenever ports change
  const updateNodeInternals = useUpdateNodeInternals();
  
  // Handle input port changes
  const handleInputLabelChange = (id: string, newLabel: string) => {
    setInputs(prev => prev.map(input => 
      input.id === id ? { ...input, label: newLabel } : input
    ));
  };
  
  const handleDeleteInput = (id: string) => {
    setInputs(prev => prev.filter(input => input.id !== id));
  };
  
  const handleAddInput = () => {
    const newId = `input_${nanoid(6)}`;
    setInputs(prev => [...prev, { id: newId, label: 'New Input' }]);
    // Use props.id for updateNodeInternals
    if (props.id) {
      updateNodeInternals(props.id);
    }
  };
  
  // Handle output port changes
  const handleOutputLabelChange = (id: string, newLabel: string) => {
    setOutputs(prev => prev.map(output => 
      output.id === id ? { ...output, label: newLabel } : output
    ));
  };
  
  const handleDeleteOutput = (id: string) => {
    setOutputs(prev => prev.filter(output => output.id !== id));
  };
  
  const handleAddOutput = () => {
    const newId = `output_${nanoid(6)}`;
    setOutputs(prev => [...prev, { id: newId, label: 'New Output' }]);
    // Use props.id for updateNodeInternals
    if (props.id) {
      updateNodeInternals(props.id);
    }
  };
  
  return (
    <NodeContainer selected={selected}>
      <NodeHeader 
        title={title} 
        icon={icon}
        description={description}
        actions={headerActions}
      />
      <NodeContent>
        {/* Input handles */}
        <div className="mb-2">
          {inputs.map((input) => (
            <EditableHandle
              key={input.id}
              type="target"
              position={Position.Left}
              id={input.id}
              label={input.label}
              isConnectable={isConnectable}
              onLabelChange={handleInputLabelChange}
              onDelete={inputs.length > 1 ? handleDeleteInput : undefined}
            />
          ))}
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex items-center text-xs ml-6 mt-1 h-7 px-2"
            onClick={handleAddInput}
          >
            <Plus size={12} className="mr-1" />
            Add Input
          </Button>
        </div>
        
        {/* Node content */}
        <div className="p-3 space-y-3 border-y border-border">
          {children}
        </div>
        
        {/* Output handles */}
        <div className="mt-2">
          {outputs.map((output) => (
            <EditableHandle
              key={output.id}
              type="source"
              position={Position.Right}
              id={output.id}
              label={output.label}
              isConnectable={isConnectable}
              onLabelChange={handleOutputLabelChange}
              onDelete={outputs.length > 1 ? handleDeleteOutput : undefined}
            />
          ))}
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex items-center text-xs ml-6 mt-1 h-7 px-2"
            onClick={handleAddOutput}
          >
            <Plus size={12} className="mr-1" />
            Add Output
          </Button>
        </div>
      </NodeContent>
    </NodeContainer>
  );
}
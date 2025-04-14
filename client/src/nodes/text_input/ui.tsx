/**
 * Text Input Node Component
 * UI representation of the Text Input node
 */
import { useState } from 'react';
import { Handle, Position, NodeProps, useReactFlow } from 'reactflow';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { SendHorizontal } from 'lucide-react';
import DynamicIcon from '../../components/flow/DynamicIcon';
import { TextInputNodeData } from './executor';
import TextInputIcon from './icon';

// Node component for text input
const TextInputNodeUI = ({ data, selected, id }: NodeProps<TextInputNodeData>) => {
  const [inputText, setInputText] = useState(data.inputText || '');
  const { setNodes } = useReactFlow();
  
  // Update node data when input changes
  const handleInputChange = (value: string) => {
    setInputText(value);
    
    // Update node data with new input text
    setNodes(nodes => 
      nodes.map(node => {
        if (node.id === id) {
          return {
            ...node,
            data: {
              ...node.data,
              inputText: value
            }
          };
        }
        return node;
      })
    );
  };
  
  return (
    <Card className={`w-64 transition-all duration-200 ${selected ? 'ring-2 ring-primary' : ''}`}
        style={{ background: '#111', color: '#fff', borderColor: '#333' }}>
      <CardHeader className="flex flex-row items-center justify-between p-3 pb-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-zinc-800 flex items-center justify-center text-zinc-300">
            <DynamicIcon icon={data.icon || 'type'} />
          </div>
          <span className="font-medium text-sm truncate">{data.label || 'Text Input'}</span>
        </div>
        <Badge variant="outline" className="bg-zinc-800 text-zinc-300 text-[10px] font-normal border-zinc-700">Input</Badge>
      </CardHeader>
      
      <CardContent className="p-3 pt-0">
        <Textarea 
          placeholder={data.placeholder || "Enter your text here..."}
          className="bg-zinc-900 border-zinc-700 text-zinc-300 min-h-[80px] text-xs"
          value={inputText}
          onChange={(e) => handleInputChange(e.target.value)}
        />
        
        <div className="mt-2 flex justify-between items-center">
          <Badge className="bg-blue-900 text-blue-300 text-[10px] border-none">Result</Badge>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-7 text-xs bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700"
          >
            <SendHorizontal className="h-3 w-3 mr-1" />
            Submit
          </Button>
        </div>
      </CardContent>
      
      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !border-2 !border-zinc-500 !bg-zinc-900"
      />
    </Card>
  );
};

export default TextInputNodeUI;
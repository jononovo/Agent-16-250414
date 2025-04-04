import { Handle, Position, NodeProps } from 'reactflow';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import * as Lucide from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { NodeData } from '../NodeItem';
import { Badge } from '@/components/ui/badge';
import DynamicIcon from '../DynamicIcon';

const TextInputNode = ({ data, selected }: NodeProps<NodeData>) => {
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
          placeholder="Enter your text here..."
          className="bg-zinc-900 border-zinc-700 text-zinc-300 min-h-[80px] text-xs"
          defaultValue={data.inputText || ''}
          onChange={(e) => {
            if (data.onInputChange) {
              data.onInputChange(e.target.value);
            }
          }}
        />
        
        <div className="mt-2 flex justify-between items-center">
          <Badge className="bg-blue-900 text-blue-300 text-[10px] border-none">Result</Badge>
          <Button variant="outline" size="sm" className="h-7 text-xs bg-zinc-800 text-zinc-300 border-zinc-700">
            <Lucide.SendHorizontal className="h-3 w-3 mr-1" />
            Submit
          </Button>
        </div>
      </CardContent>
      
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !border-2 !border-zinc-500 !bg-zinc-900"
      />
    </Card>
  );
};

export default TextInputNode;
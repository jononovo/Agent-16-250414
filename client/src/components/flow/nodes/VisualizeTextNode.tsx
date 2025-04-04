import { Handle, Position, NodeProps } from 'reactflow';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import * as Lucide from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { NodeData } from '../NodeItem';
import DynamicIcon from '../DynamicIcon';

const VisualizeTextNode = ({ data, selected }: NodeProps<NodeData>) => {
  return (
    <Card className={`w-64 transition-all duration-200 ${selected ? 'ring-2 ring-primary' : ''}`}
        style={{ background: '#111', color: '#fff', borderColor: '#333' }}>
      <CardHeader className="flex flex-row items-center justify-between p-3 pb-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-zinc-800 flex items-center justify-center text-zinc-300">
            <DynamicIcon icon={data.icon || 'eye'} />
          </div>
          <span className="font-medium text-sm truncate">{data.label || 'Visualize Text'}</span>
        </div>
        <Badge variant="outline" className="bg-zinc-800 text-zinc-300 text-[10px] font-normal border-zinc-700">Output</Badge>
      </CardHeader>
      
      <CardContent className="p-3 pt-0">
        <div className="bg-zinc-900 border border-zinc-700 rounded-md p-3 min-h-[100px] text-xs">
          {data.textContent ? (
            <p className="text-zinc-300">{data.textContent}</p>
          ) : (
            <div className="text-zinc-500 text-xs flex items-center justify-center h-full">
              No text to display
            </div>
          )}
        </div>
        
        <div className="mt-2 flex items-center">
          <Badge className="bg-blue-900 text-blue-300 text-[10px] border-none">Input</Badge>
        </div>
      </CardContent>
      
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !border-2 !border-zinc-500 !bg-zinc-900"
      />
    </Card>
  );
};

export default VisualizeTextNode;
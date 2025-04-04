import { Handle, Position, NodeProps } from 'reactflow';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import * as Lucide from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { NodeData } from '../NodeItem';

const DynamicIcon = ({ name }: { name: string }) => {
  const IconComponent = (Lucide as any)[name.charAt(0).toUpperCase() + name.slice(1)];
  
  if (!IconComponent) {
    return <Lucide.Circle className="h-4 w-4" />;
  }
  
  return <IconComponent className="h-4 w-4" />;
};

const VisualizeTextNode = ({ data, selected }: NodeProps<NodeData>) => {
  return (
    <Card className={`w-64 transition-all duration-200 ${selected ? 'ring-2 ring-primary' : ''}`}>
      <CardHeader className="flex flex-row items-center justify-between p-3 pb-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-indigo-100 flex items-center justify-center text-indigo-600">
            <DynamicIcon name={data.icon || 'eye'} />
          </div>
          <span className="font-medium text-sm truncate">{data.label || 'Visualize Text'}</span>
        </div>
        <Badge variant="outline" className="bg-indigo-50 text-indigo-600 text-[10px] font-normal border-indigo-200">Output</Badge>
      </CardHeader>
      
      <CardContent className="p-3 pt-0">
        <div className="bg-slate-50 border border-slate-200 rounded-md p-3 min-h-[100px] text-sm">
          {data.textContent ? (
            <p className="text-slate-800">{data.textContent}</p>
          ) : (
            <div className="text-slate-400 text-sm flex items-center justify-center h-full">
              No text to display
            </div>
          )}
        </div>
      </CardContent>
      
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !border-2 !border-indigo-500 !bg-background"
      />
    </Card>
  );
};

export default VisualizeTextNode;
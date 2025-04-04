import { Handle, Position, NodeProps } from 'reactflow';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import * as Lucide from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NodeData } from '../NodeItem';

const DynamicIcon = ({ name }: { name: string }) => {
  const IconComponent = (Lucide as any)[name.charAt(0).toUpperCase() + name.slice(1)];
  
  if (!IconComponent) {
    return <Lucide.Circle className="h-4 w-4" />;
  }
  
  return <IconComponent className="h-4 w-4" />;
};

const CustomNode = ({ data, selected }: NodeProps<NodeData>) => {
  return (
    <Card className={`w-52 transition-all duration-200 ${selected ? 'ring-2 ring-primary' : ''}`}>
      <CardHeader className="flex flex-row items-center justify-between p-3 pb-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center text-primary">
            <DynamicIcon name={data.icon || 'code'} />
          </div>
          <span className="font-medium text-sm truncate">{data.label || 'Custom Node'}</span>
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6">
          <Lucide.Settings className="h-3 w-3" />
        </Button>
      </CardHeader>
      
      {data.description && (
        <CardContent className="p-3 pt-0 text-xs text-slate-500">
          {data.description}
        </CardContent>
      )}
      
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !border-2 !border-primary !bg-background"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !border-2 !border-primary !bg-background"
      />
    </Card>
  );
};

export default CustomNode;
import { Handle, Position, NodeProps } from 'reactflow';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import * as Lucide from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NodeData } from '../NodeItem';
import { Badge } from '@/components/ui/badge';
import DynamicIcon from '../DynamicIcon';

const OutputNode = ({ data, selected }: NodeProps<NodeData>) => {
  return (
    <Card className={`w-52 transition-all duration-200 ${selected ? 'ring-2 ring-primary' : ''}`}>
      <CardHeader className="flex flex-row items-center justify-between p-3 pb-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-amber-100 flex items-center justify-center text-amber-600">
            <DynamicIcon icon={data.icon || 'arrowLeft'} />
          </div>
          <span className="font-medium text-sm truncate">{data.label || 'Output'}</span>
        </div>
        <Badge variant="outline" className="bg-amber-50 text-amber-600 text-[10px] font-normal border-amber-200">Output</Badge>
      </CardHeader>
      
      {data.description && (
        <CardContent className="p-3 pt-0 text-xs text-slate-500">
          {data.description}
          
          <div className="mt-2 flex justify-end">
            <Button variant="ghost" size="sm" className="h-6 text-xs">
              <Lucide.Settings className="h-3 w-3 mr-1" />
              Configure
            </Button>
          </div>
        </CardContent>
      )}
      
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !border-2 !border-amber-500 !bg-background"
      />
    </Card>
  );
};

export default OutputNode;
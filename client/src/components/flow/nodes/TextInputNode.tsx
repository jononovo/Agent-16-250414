import { Handle, Position, NodeProps } from 'reactflow';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import * as Lucide from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { NodeData } from '../NodeItem';
import { Badge } from '@/components/ui/badge';

const DynamicIcon = ({ name }: { name: string }) => {
  const IconComponent = (Lucide as any)[name.charAt(0).toUpperCase() + name.slice(1)];
  
  if (!IconComponent) {
    return <Lucide.Circle className="h-4 w-4" />;
  }
  
  return <IconComponent className="h-4 w-4" />;
};

const TextInputNode = ({ data, selected }: NodeProps<NodeData>) => {
  return (
    <Card className={`w-64 transition-all duration-200 ${selected ? 'ring-2 ring-primary' : ''}`}>
      <CardHeader className="flex flex-row items-center justify-between p-3 pb-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-purple-100 flex items-center justify-center text-purple-600">
            <DynamicIcon name={data.icon || 'type'} />
          </div>
          <span className="font-medium text-sm truncate">{data.label || 'Text Input'}</span>
        </div>
        <Badge variant="outline" className="bg-purple-50 text-purple-600 text-[10px] font-normal border-purple-200">Input</Badge>
      </CardHeader>
      
      <CardContent className="p-3 pt-0">
        <Textarea 
          placeholder="Enter your text here..."
          className="min-h-[80px] text-sm"
          value={data.inputText || ''}
        />
        
        <div className="mt-2 flex justify-end">
          <Button variant="outline" size="sm" className="h-7 text-xs">
            <Lucide.SendHorizontal className="h-3 w-3 mr-1" />
            Submit
          </Button>
        </div>
      </CardContent>
      
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !border-2 !border-purple-500 !bg-background"
      />
    </Card>
  );
};

export default TextInputNode;
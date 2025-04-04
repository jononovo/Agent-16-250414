import { memo } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import * as Lucide from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export interface NodeData {
  label: string;
  description?: string;
  icon?: string;
  [key: string]: any;
}

export interface NodeItemProps {
  node: {
    type: string;
    name: string;
    description: string | null;
    icon: string | null;
    data: NodeData;
    [key: string]: any;
  };
  expanded?: boolean;
}

const DynamicIcon = ({ name }: { name: string | null }) => {
  const iconName = name || 'circle';
  const IconComponent = (Lucide as any)[iconName.charAt(0).toUpperCase() + iconName.slice(1)];
  
  if (!IconComponent) {
    return <Lucide.Circle className="h-4 w-4" />;
  }
  
  return <IconComponent className="h-4 w-4" />;
};

const NodeItem = ({ node, expanded = false }: NodeItemProps) => {
  const onDragStart = (event: React.DragEvent, nodeType: string, data: NodeData) => {
    event.dataTransfer.setData('application/reactflow/type', nodeType);
    event.dataTransfer.setData('application/reactflow/data', JSON.stringify(data));
    event.dataTransfer.effectAllowed = 'move';
  };

  const getNodeColorClass = () => {
    switch (node.type) {
      case 'trigger':
        return 'bg-blue-50 border-blue-200 text-blue-600';
      case 'processor':
        return 'bg-green-50 border-green-200 text-green-600';
      case 'output':
        return 'bg-amber-50 border-amber-200 text-amber-600';
      default:
        return 'bg-slate-50 border-slate-200 text-slate-600';
    }
  };

  const getIconColorClass = () => {
    switch (node.type) {
      case 'trigger':
        return 'bg-blue-100 text-blue-600';
      case 'processor':
        return 'bg-green-100 text-green-600';
      case 'output':
        return 'bg-amber-100 text-amber-600';
      default:
        return 'bg-primary/10 text-primary';
    }
  };

  return (
    <Card 
      className={`mb-2 cursor-grab border ${getNodeColorClass()} shadow-sm transition-all duration-200 hover:shadow-md active:cursor-grabbing`}
      draggable
      onDragStart={(event) => onDragStart(event, node.type, {
        label: node.name,
        description: node.description || '',
        icon: node.icon || 'circle',
      })}
    >
      <CardHeader className="flex flex-row items-center p-3 pb-2">
        <div className="flex items-center gap-2">
          <div className={`w-6 h-6 rounded-md ${getIconColorClass()} flex items-center justify-center`}>
            <DynamicIcon name={node.icon} />
          </div>
          <span className="font-medium text-sm">{node.name}</span>
        </div>
        {!expanded && (
          <Badge variant="outline" className={`ml-auto text-[10px] font-normal ${getNodeColorClass()}`}>
            {node.type.charAt(0).toUpperCase() + node.type.slice(1)}
          </Badge>
        )}
      </CardHeader>
      
      {(expanded || (node.description && node.description.length < 60)) && (
        <CardContent className="p-3 pt-0 text-xs text-slate-500">
          {node.description || 'No description provided'}
        </CardContent>
      )}
    </Card>
  );
};

export default memo(NodeItem);
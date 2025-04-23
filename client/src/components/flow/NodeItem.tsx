import { memo } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import * as Lucide from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Circle } from 'lucide-react';

export interface NodeData {
  label: string;
  description?: string;
  icon?: string | React.ComponentType<any>;
  [key: string]: any;
}

export interface NodeItemProps {
  node: {
    type: string;
    name: string;
    description: string | null;
    icon?: string | null | React.ComponentType<any>;
    data: NodeData;
    [key: string]: any;
  };
  expanded?: boolean;
}

// Helper type for icon components
type IconComponent = React.ComponentType<{ className?: string }>;

const DynamicIcon = ({ icon }: { icon?: string | IconComponent | null | object }) => {
  // If icon is not provided or is null/undefined
  if (!icon) {
    return <Circle className="h-5 w-5" />;
  }
  
  // If icon is a React component
  if (typeof icon === 'function') {
    const IconComponent = icon as IconComponent;
    return <IconComponent className="h-5 w-5" />;
  }
  
  // If icon is an object (empty or otherwise)
  if (typeof icon === 'object') {
    return <Circle className="h-5 w-5" />;
  }
  
  // If icon is a string
  if (typeof icon === 'string') {
    try {
      const iconName = icon || 'circle';
      // Ensure we have a valid string before calling methods on it
      const capitalizedName = typeof iconName === 'string' && iconName.charAt 
        ? iconName.charAt(0).toUpperCase() + iconName.slice(1) 
        : 'Circle';
        
      const IconComponent = (Lucide as any)[capitalizedName];
      
      if (!IconComponent) {
        return <Circle className="h-5 w-5" />;
      }
      
      return <IconComponent className="h-5 w-5" />;
    } catch (error) {
      console.error("Error rendering icon in NodeItem:", error);
      return <Circle className="h-5 w-5" />;
    }
  }
  
  // Default fallback for any other case
  return <Circle className="h-5 w-5" />;
};

const NodeItem = ({ node, expanded = false }: NodeItemProps) => {
  const onDragStart = (event: React.DragEvent, nodeType: string, data: NodeData) => {
    event.dataTransfer.setData('application/reactflow/type', nodeType);
    event.dataTransfer.setData('application/reactflow/data', JSON.stringify({
      ...data,
      // Convert the icon component to a string for JSON serialization if needed
      icon: typeof data.icon === 'function' ? data.icon.name : data.icon,
    }));
    event.dataTransfer.effectAllowed = 'move';
  };

  // Get icon from the node data or node itself
  const nodeIcon = node.data?.icon || node.icon;

  // Apply dark mode styling for nodes in screenshot
  const getCategoryColor = () => {
    const category = node.category || '';
    
    switch (category) {
      case 'ai':
        return 'border-purple-500/20 bg-purple-500/5 text-purple-500';
      case 'data':
        return 'border-blue-500/20 bg-blue-500/5 text-blue-500';
      case 'triggers':
        return 'border-amber-500/20 bg-amber-500/5 text-amber-500';
      case 'actions':
        return 'border-green-500/20 bg-green-500/5 text-green-500';
      default:
        return 'border-gray-500/20 bg-gray-500/5 text-gray-500';
    }
  };

  return (
    <div 
      className="mb-3 cursor-grab transition-all duration-200 active:cursor-grabbing"
      draggable
      onDragStart={(event) => onDragStart(event, node.type, {
        label: node.name,
        description: node.description || '',
        icon: nodeIcon || undefined,
        category: node.category
      })}
    >
      <div className="flex items-start gap-3">
        <div className={`mt-1 w-6 h-6 rounded-md flex items-center justify-center ${getCategoryColor()}`}>
          <DynamicIcon icon={nodeIcon} />
        </div>
        <div className="flex-1">
          <h4 className="font-medium text-sm text-foreground">{node.name}</h4>
          <p className="text-xs text-muted-foreground">{node.description || 'No description provided'}</p>
        </div>
      </div>
    </div>
  );
};

export default memo(NodeItem);
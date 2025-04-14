import { Handle, Position, NodeProps, useReactFlow } from 'reactflow';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import * as Lucide from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NodeData } from '../NodeItem';
import DynamicIcon from '../DynamicIcon';
import { useState, useRef, useEffect } from 'react';

// This component provides a visual submenu for node operations
const NodeHoverMenu = ({ 
  nodeId, 
  nodeType, 
  nodeData, 
  position,
  onDuplicate, 
  onDelete, 
  onMonkeyAgentModify 
}: { 
  nodeId: string;
  nodeType: string;
  nodeData: NodeData;
  position: { x: number, y: number };
  onDuplicate: () => void;
  onDelete: () => void;
  onMonkeyAgentModify: () => void;
}) => {
  return (
    <div className="absolute z-50 bg-white rounded-md shadow-lg border border-slate-200 p-1 flex flex-col gap-1">
      <Button 
        variant="ghost" 
        size="sm" 
        className="flex items-center justify-start px-2 py-1 h-8 hover:bg-slate-100"
        onClick={onDuplicate}
      >
        <Lucide.Copy className="h-4 w-4 mr-2" />
        <span className="text-xs">Duplicate</span>
      </Button>
      
      <Button 
        variant="ghost" 
        size="sm" 
        className="flex items-center justify-start px-2 py-1 h-8 hover:bg-slate-100 text-red-500 hover:text-red-600"
        onClick={onDelete}
      >
        <Lucide.Trash2 className="h-4 w-4 mr-2" />
        <span className="text-xs">Delete</span>
      </Button>
      
      <Button 
        variant="ghost" 
        size="sm" 
        className="flex items-center justify-start px-2 py-1 h-8 hover:bg-slate-100 text-primary"
        onClick={onMonkeyAgentModify}
      >
        <Lucide.Bot className="h-4 w-4 mr-2" />
        <span className="text-xs">MonkeyAgent Modify</span>
      </Button>
    </div>
  );
};

const CustomNode = ({ id, type, data, selected, xPos, yPos }: NodeProps<NodeData>) => {
  const [showHoverMenu, setShowHoverMenu] = useState(false);
  const [hoverTimer, setHoverTimer] = useState<NodeJS.Timeout | null>(null);
  const nodeRef = useRef<HTMLDivElement>(null);
  const reactFlowInstance = useReactFlow();
  
  // Function to handle hover start
  const handleHoverStart = () => {
    // Set a timeout to show the menu after hovering for 500ms
    const timer = setTimeout(() => {
      setShowHoverMenu(true);
    }, 500);
    
    setHoverTimer(timer);
  };
  
  // Function to handle hover end
  const handleHoverEnd = () => {
    // Clear the timeout if the user stops hovering before the menu appears
    if (hoverTimer) {
      clearTimeout(hoverTimer);
      setHoverTimer(null);
    }
    setShowHoverMenu(false);
  };
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimer) {
        clearTimeout(hoverTimer);
      }
    };
  }, [hoverTimer]);
  
  // Handle node duplication
  const handleDuplicate = () => {
    // Create a new node based on the current one
    const position = { x: (xPos || 0) + 20, y: (yPos || 0) + 20 };
    
    // Clone the node with a new ID
    const newNode = {
      id: `${type}-${Date.now()}`,
      type,
      position,
      data: { ...data }
    };
    
    // Add the new node to the flow
    reactFlowInstance.addNodes(newNode);
  };
  
  // Handle node deletion
  const handleDelete = () => {
    reactFlowInstance.deleteElements({ nodes: [{ id }] });
  };
  
  // Handle MonkeyAgent modification
  const handleMonkeyAgentModify = () => {
    // Create an event with all the node details
    const nodeDetails = {
      id,
      type,
      position: { x: xPos, y: yPos },
      data: { ...data }
    };
    
    // Dispatch a custom event that the MonkeyAgentChatOverlay will listen for
    const event = new CustomEvent('monkey-agent-modify-node', {
      detail: { nodeDetails }
    });
    
    window.dispatchEvent(event);
  };
  
  return (
    <div 
      ref={nodeRef}
      onMouseEnter={handleHoverStart}
      onMouseLeave={handleHoverEnd}
      className="relative"
      // Extended hoverable area with padding to create a seamless interaction between node and menu
      style={{ padding: showHoverMenu ? '0 20px 0 0' : '0' }}
    >
      <Card className={`w-52 transition-all duration-200 ${selected ? 'ring-2 ring-primary' : ''}`}>
        <CardHeader className="flex flex-row items-center justify-between p-3 pb-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center text-primary">
              <DynamicIcon icon={data.icon || 'code'} />
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
      
      {/* Node hover menu */}
      {showHoverMenu && (
        <NodeHoverMenu 
          nodeId={id}
          nodeType={type}
          nodeData={data}
          position={{ x: xPos || 0, y: yPos || 0 }}
          onDuplicate={handleDuplicate}
          onDelete={handleDelete}
          onMonkeyAgentModify={handleMonkeyAgentModify}
        />
      )}
    </div>
  );
};

export default CustomNode;
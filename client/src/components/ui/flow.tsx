import React, { useCallback, useRef, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  Connection,
  Edge,
  Node,
  NodeTypes,
} from 'reactflow';
import 'reactflow/dist/style.css';

// Custom node component
const CustomNode = ({ data }: any) => {
  return (
    <div className="bg-white rounded-lg border border-slate-300 p-3 shadow-sm">
      <div className="flex items-center mb-2">
        <div className={`w-6 h-6 rounded-full ${data.bgColor || 'bg-indigo-100'} flex items-center justify-center ${data.textColor || 'text-indigo-600'} mr-2`}>
          <i className={`fas fa-${data.icon || 'cube'} text-xs`}></i>
        </div>
        <div className="font-medium text-sm">{data.label}</div>
      </div>
      {data.description && (
        <div className="text-xs text-slate-500 mt-1">{data.description}</div>
      )}
    </div>
  );
};

// Node types definition
const nodeTypes: NodeTypes = {
  custom: CustomNode,
};

// Initial nodes
const initialNodes: Node[] = [
  {
    id: '1',
    type: 'custom',
    position: { x: 250, y: 100 },
    data: { 
      label: 'Input Node', 
      icon: 'arrow-right-to-bracket',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-600',
      description: 'Workflow entry point'
    },
  },
  {
    id: '2',
    type: 'custom',
    position: { x: 250, y: 200 },
    data: { 
      label: 'Process Node', 
      icon: 'cogs',
      bgColor: 'bg-green-100',
      textColor: 'text-green-600',
      description: 'Transforms data'
    },
  },
  {
    id: '3',
    type: 'custom',
    position: { x: 250, y: 300 },
    data: { 
      label: 'Output Node', 
      icon: 'arrow-right-from-bracket',
      bgColor: 'bg-amber-100',
      textColor: 'text-amber-600',
      description: 'Workflow output'
    },
  },
];

// Initial edges
const initialEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2' },
  { id: 'e2-3', source: '2', target: '3' },
];

interface FlowProps {
  placeholder?: boolean;
}

const Flow: React.FC<FlowProps> = ({ placeholder = false }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  
  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  );

  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();

      if (!reactFlowWrapper.current || !reactFlowInstance) {
        return;
      }

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const type = event.dataTransfer.getData('application/reactflow');

      // Check if the dropped element is valid
      if (typeof type === 'undefined' || !type) {
        return;
      }

      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      const newNode = {
        id: `${nodes.length + 1}`,
        type: 'custom',
        position,
        data: { label: `${type} node` },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, nodes, setNodes]
  );

  if (placeholder) {
    return (
      <div className="react-flow h-[400px] rounded-md bg-slate-50 border border-slate-200 flex items-center justify-center">
        <div className="text-center p-6">
          <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-primary mx-auto mb-4">
            <i className="fas fa-sitemap text-xl"></i>
          </div>
          <h3 className="font-medium text-slate-700 mb-2">Workflow Editor</h3>
          <p className="text-sm text-slate-600 mb-4 max-w-md">
            Create your workflow by dragging nodes from the panel on the right and connecting them together.
          </p>
          <button className="text-sm px-4 py-2 bg-primary text-white rounded-md hover:bg-indigo-700">
            Start Building
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={reactFlowWrapper} className="react-flow h-[400px] rounded-md" onDrop={onDrop} onDragOver={onDragOver}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onInit={setReactFlowInstance}
        nodeTypes={nodeTypes}
        fitView
      >
        <Controls />
        <MiniMap />
        <Background color="#aaa" gap={16} />
      </ReactFlow>
    </div>
  );
};

export default Flow;

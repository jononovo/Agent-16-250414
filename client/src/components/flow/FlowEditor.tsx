import { useState, useCallback, useRef, useEffect } from 'react';
import ReactFlow, { 
  ReactFlowProvider, 
  Background, 
  Controls, 
  Node, 
  Edge, 
  Connection, 
  addEdge, 
  useNodesState,
  useEdgesState,
  NodeTypes,
  MarkerType,
  NodeChange,
  EdgeChange,
  applyNodeChanges,
  applyEdgeChanges
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Workflow } from '@shared/schema';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import NodesPanel from './NodesPanel';
import { useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { apiRequest } from '@/lib/queryClient';
import { ArrowLeft, Save } from 'lucide-react';

// Import node components
import CustomNode from '../flow/nodes/CustomNode';
import TriggerNode from '../flow/nodes/TriggerNode';
import ProcessorNode from '../flow/nodes/ProcessorNode';
import OutputNode from '../flow/nodes/OutputNode';
import TextInputNode from '../flow/nodes/TextInputNode';
import GenerateTextNode from '../flow/nodes/GenerateTextNode';
import VisualizeTextNode from '../flow/nodes/VisualizeTextNode';
import RoutingNode from '../flow/nodes/RoutingNode';
import PromptCrafterNode from '../flow/nodes/PromptCrafterNode';
import ValidResponseNode from '../flow/nodes/ValidResponseNode';

const nodeTypes: NodeTypes = {
  custom: CustomNode,
  trigger: TriggerNode,
  processor: ProcessorNode,
  output: OutputNode,
  textInput: TextInputNode,
  generateText: GenerateTextNode,
  visualizeText: VisualizeTextNode,
  routing: RoutingNode,
  promptCrafter: PromptCrafterNode,
  validResponse: ValidResponseNode
};

interface FlowEditorProps {
  workflow?: Workflow;
  isNew?: boolean;
}

const FlowEditor = ({ workflow, isNew = false }: FlowEditorProps) => {
  const [, navigate] = useLocation();
  const [editingName, setEditingName] = useState(isNew);
  const [name, setName] = useState(workflow?.name || 'New Workflow');
  const flowData = workflow?.flowData ? 
    (typeof workflow.flowData === 'string' ? JSON.parse(workflow.flowData) : workflow.flowData) 
    : { nodes: [], edges: [] };
  const initialNodes = flowData.nodes || [];
  const initialEdges = flowData.edges || [];
  
  const [nodes, setNodes] = useNodesState(initialNodes);
  const [edges, setEdges] = useEdgesState(initialEdges);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);

  const saveMutation = useMutation({
    mutationFn: async (data: { name: string, data: { nodes: Node[], edges: Edge[] } }) => {
      const flowDataJson = JSON.stringify({
        nodes: data.data.nodes,
        edges: data.data.edges
      });
      
      if (isNew) {
        const postData = {
          name: data.name,
          type: 'custom',
          description: 'Custom workflow',
          icon: 'flow-chart',
          flowData: flowDataJson
        };
        
        return apiRequest(
          'POST',
          '/api/workflows',
          postData
        );
      } else {
        const patchData = {
          name: data.name,
          flowData: flowDataJson
        };
        
        return apiRequest(
          'PATCH',
          `/api/workflows/${workflow?.id}`,
          patchData
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/workflows'] });
      if (isNew) {
        navigate('/');
      }
    }
  });

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    [setNodes]
  );
  
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [setEdges]
  );

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge({
      ...connection,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 20,
        height: 20
      },
      style: {
        strokeWidth: 2
      }
    }, eds)),
    [setEdges]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      if (!reactFlowWrapper.current || !reactFlowInstance) return;

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const type = event.dataTransfer.getData('application/reactflow/type');
      const nodeData = JSON.parse(event.dataTransfer.getData('application/reactflow/data'));

      // Check if the dropped element is valid
      if (!type || !nodeData) return;

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      const newNode = {
        id: `${type}-${Date.now()}`,
        type,
        position,
        data: nodeData,
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes]
  );

  const handleSave = () => {
    saveMutation.mutate({
      name,
      data: {
        nodes,
        edges
      }
    });
  };

  return (
    <div className="flex h-screen">
      <div className="w-64 bg-gray-50 border-r">
        <div className="p-4">
          <Button 
            variant="ghost" 
            size="sm" 
            className="mb-4"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Builder
          </Button>

          <NodesPanel />
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="border-b p-4 flex justify-between items-center">
          {editingName ? (
            <div className="flex items-center gap-2">
              <Input 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-64"
                placeholder="Workflow name"
                autoFocus
              />
              <Button
                size="sm"
                onClick={() => setEditingName(false)}
              >
                Set
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold">{name}</h1>
              <Button 
                size="sm" 
                variant="ghost"
                onClick={() => setEditingName(true)}
              >
                Edit
              </Button>
            </div>
          )}

          <Button 
            onClick={handleSave}
            disabled={saveMutation.isPending}
          >
            <Save className="h-4 w-4 mr-2" />
            Save Workflow
          </Button>
        </div>

        <div className="flex-1" ref={reactFlowWrapper}>
          <ReactFlowProvider>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onInit={setReactFlowInstance}
              onDrop={onDrop}
              onDragOver={onDragOver}
              nodeTypes={nodeTypes}
              fitView
              snapToGrid
              attributionPosition="bottom-left"
            >
              <Background />
              <Controls />
            </ReactFlow>
          </ReactFlowProvider>
        </div>
      </div>
    </div>
  );
};

export default FlowEditor;
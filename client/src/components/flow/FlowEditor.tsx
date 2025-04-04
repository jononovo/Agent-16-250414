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
import { ArrowLeft, Save, Play } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
import PerplexityNode from '../flow/nodes/PerplexityNode';

// Register node types according to the documentation
const nodeTypes: NodeTypes = {
  // Specialized AI nodes
  text_input: TextInputNode,
  generate_text: GenerateTextNode,
  visualize_text: VisualizeTextNode,
  prompt_crafter: PromptCrafterNode,
  valid_response: ValidResponseNode,
  perplexity: PerplexityNode,
  
  // Legacy/basic node types (with mapping to specialized versions)
  custom: CustomNode,
  trigger: TriggerNode,
  processor: ProcessorNode,
  output: OutputNode,
  
  // Maintain backward compatibility
  textInput: TextInputNode,
  generateText: GenerateTextNode,
  visualizeText: VisualizeTextNode,
  routing: RoutingNode,
  promptCrafter: PromptCrafterNode,
  validResponse: ValidResponseNode,
  
  // Generic node types from documentation
  webhook: TriggerNode,
  scheduler: TriggerNode,
  email_trigger: TriggerNode,
  http_request: ProcessorNode,
  email_send: OutputNode,
  database_query: ProcessorNode,
  data_transform: ProcessorNode,
  filter: ProcessorNode
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

  const { toast } = useToast();
  const [isRunning, setIsRunning] = useState(false);

  const handleSave = () => {
    saveMutation.mutate({
      name,
      data: {
        nodes,
        edges
      }
    });
  };
  
  const handleRunWorkflow = () => {
    setIsRunning(true);
    
    // Find text input nodes to get initial inputs
    const textInputNodes = nodes.filter(node => 
      node.type === 'text_input' || 
      node.type === 'textInput'
    );
    
    // Get input text from input nodes
    let inputText = "No input provided";
    if (textInputNodes.length > 0 && textInputNodes[0].data && textInputNodes[0].data.inputText) {
      inputText = textInputNodes[0].data.inputText;
    }
    
    // Show loading state in Perplexity node
    setNodes(nds => 
      nds.map(node => {
        if (node.type === 'perplexity') {
          return {
            ...node,
            data: {
              ...node.data,
              _isProcessing: true
            }
          };
        }
        return node;
      })
    );
    
    // Simulate workflow execution
    setTimeout(() => {
      // Find Perplexity nodes to simulate search
      const perplexityNodes = nodes.filter(node => 
        node.type === 'perplexity'
      );
      
      // Simulate Perplexity search result based on input
      let searchResult = "";
      if (inputText.toLowerCase().includes("capital") && inputText.toLowerCase().includes("azerbaijan")) {
        searchResult = "The capital of Azerbaijan is Baku. It is the largest city in Azerbaijan and the Caucasus region.";
      } else if (inputText.toLowerCase().includes("capital")) {
        searchResult = "Based on your query about a capital, I would need more specific information about which country or region you're asking about.";
      } else {
        searchResult = "Results for: " + inputText + "\n\nHere would be real search results from the Perplexity API. To get actual results, you would need to integrate with the Perplexity API using your API key.";
      }
      
      // Update Perplexity nodes with the result and remove loading state
      if (perplexityNodes.length > 0) {
        setNodes(nds => 
          nds.map(node => {
            if (node.type === 'perplexity') {
              return {
                ...node,
                data: {
                  ...node.data,
                  _searchResult: searchResult,
                  _isProcessing: false
                }
              };
            }
            return node;
          })
        );
      }
      
      // Find visualize text nodes to update with results
      const visualizeNodes = nodes.filter(node => 
        node.type === 'visualize_text' || 
        node.type === 'visualizeText'
      );
      
      // Update visualization nodes with the search result
      if (visualizeNodes.length > 0) {
        setNodes(nds => 
          nds.map(node => {
            if (node.type === 'visualize_text' || node.type === 'visualizeText') {
              return {
                ...node,
                data: {
                  ...node.data,
                  textContent: searchResult
                }
              };
            }
            return node;
          })
        );
      }
      
      setIsRunning(false);
      toast({
        title: "Workflow Execution",
        description: "Workflow ran successfully!",
      });
    }, 1500);
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

          <div className="flex space-x-2">
            <Button 
              onClick={handleRunWorkflow}
              disabled={isRunning}
              variant="outline"
            >
              <Play className="h-4 w-4 mr-2" />
              Run Workflow
            </Button>
            <Button 
              onClick={handleSave}
              disabled={saveMutation.isPending}
            >
              <Save className="h-4 w-4 mr-2" />
              Save Workflow
            </Button>
          </div>
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
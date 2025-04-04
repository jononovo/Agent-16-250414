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
import { ArrowLeft, Save, Play, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import NodeSettingsDrawer from './NodeSettingsDrawer';

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
  const [settingsDrawerOpen, setSettingsDrawerOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  const handleSave = () => {
    saveMutation.mutate({
      name,
      data: {
        nodes,
        edges
      }
    });
  };
  
  const handleNodeClick = (event: React.MouseEvent, node: Node) => {
    // Don't open settings for every node type, only those that have settings
    if (node.type && ['perplexity', 'generate_text', 'http_request'].includes(node.type)) {
      setSelectedNode(node);
      setSettingsDrawerOpen(true);
    }
  };
  
  const handleSettingsChange = (nodeId: string, settingsData: Record<string, any>) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          // Extract nodeProperties if they exist
          const { nodeProperties, ...otherSettings } = settingsData;
          
          // Create updated node with new settings and properties
          const updatedNode = {
            ...node,
            data: {
              ...node.data,
              settings: otherSettings,
            },
          };
          
          // If nodeProperties exist, update the label and description
          if (nodeProperties) {
            if (nodeProperties.label) {
              updatedNode.data.label = nodeProperties.label;
            }
            if (nodeProperties.description) {
              updatedNode.data.description = nodeProperties.description;
            }
          }
          
          return updatedNode;
        }
        return node;
      })
    );
    
    toast({
      title: "Node Updated",
      description: "Node configuration has been updated successfully.",
    });
  };
  
  const handleRunWorkflow = async () => {
    setIsRunning(true);
    
    try {
      // Import the workflow engine and node executors
      const { executeWorkflow } = await import('@/lib/workflowEngine');
      const { registerAllNodeExecutors } = await import('@/lib/nodeExecutors');
      
      // Register all node executors
      registerAllNodeExecutors();
      
      // Show all nodes as processing
      setNodes(nds => 
        nds.map(node => ({
          ...node,
          data: {
            ...node.data,
            _isProcessing: true
          }
        }))
      );
      
      // Execute the workflow
      await executeWorkflow(
        nodes,
        edges,
        // Node state change handler
        (nodeId, nodeState) => {
          setNodes(nds => 
            nds.map(node => {
              if (node.id === nodeId) {
                return {
                  ...node,
                  data: {
                    ...node.data,
                    _isProcessing: nodeState.state === 'running',
                    _isComplete: nodeState.state === 'complete',
                    _hasError: nodeState.state === 'error',
                    _errorMessage: nodeState.error,
                    _searchResult: nodeState.data, // Store result in node data
                    textContent: nodeState.data,   // Update text content for visualization nodes
                  }
                };
              }
              return node;
            })
          );
        },
        // Workflow completion handler
        (finalState) => {
          // Check if there were any errors
          const hasErrors = Object.values(finalState.nodeStates).some(
            state => state.state === 'error'
          );
          
          if (hasErrors || finalState.status === 'error') {
            toast({
              title: "Workflow Execution",
              description: finalState.error || "Workflow completed with errors. Check node states for details.",
              variant: "destructive"
            });
          } else {
            toast({
              title: "Workflow Execution",
              description: "Workflow ran successfully!",
            });
          }
          
          // Measure execution time
          const duration = finalState.endTime && finalState.startTime
            ? (finalState.endTime.getTime() - finalState.startTime.getTime()) / 1000
            : null;
            
          console.log(`Workflow execution completed in ${duration}s with status: ${finalState.status}`);
        }
      );
    } catch (error) {
      console.error('Error executing workflow:', error);
      toast({
        title: "Workflow Execution Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
    }
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
              onNodeClick={handleNodeClick}
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
      
      {/* Node Settings Drawer */}
      <NodeSettingsDrawer
        isOpen={settingsDrawerOpen}
        onClose={() => setSettingsDrawerOpen(false)}
        node={selectedNode}
        onSettingsChange={handleSettingsChange}
      />
    </div>
  );
};

export default FlowEditor;
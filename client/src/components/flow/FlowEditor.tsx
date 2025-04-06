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
import { ArrowLeft, Save, Play, Settings, TestTube } from 'lucide-react';
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
import ClaudeNode from '../flow/nodes/ClaudeNode';
import TextPromptNode from '../flow/nodes/TextPromptNode';
import TransformNode from '../flow/nodes/TransformNode';
import ChatInterfaceNode from '../flow/nodes/ChatInterfaceNode';
import InternalNode from '../flow/nodes/InternalNode';
import AgentTriggerNode from '../flow/nodes/AgentTriggerNode';
import WorkflowTriggerNode from '../flow/nodes/WorkflowTriggerNode';

// Register node types according to the documentation
const nodeTypes: NodeTypes = {
  // Enhanced system node types
  text_input: TextInputNode,
  text_prompt: TextPromptNode,
  output: OutputNode,
  visualize_text: VisualizeTextNode,
  transform: TransformNode,
  chat_interface: ChatInterfaceNode,
  claude: ClaudeNode,
  
  // Specialized AI nodes
  generate_text: GenerateTextNode,
  prompt_crafter: PromptCrafterNode,
  valid_response: ValidResponseNode,
  perplexity: PerplexityNode,
  
  // Agent and Workflow node types
  agent_trigger: AgentTriggerNode,
  workflow_trigger: WorkflowTriggerNode,
  
  // Internal system node types
  internal_new_agent: InternalNode,
  internal_ai_chat_agent: InternalNode,
  internal: InternalNode,
  
  // Legacy/basic node types (with mapping to specialized versions)
  custom: CustomNode,
  trigger: TriggerNode,
  processor: ProcessorNode,
  
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
  
  // Parse and handle the flow data properly
  // Define a type for the parsed flow data to ensure it has the correct shape
  interface ParsedFlowData {
    nodes: any[];
    edges: any[];
  }
  
  // Initialize with empty arrays
  let parsedFlowData: ParsedFlowData = { nodes: [], edges: [] };
  
  try {
    if (workflow?.flowData) {
      // Handle different data types correctly
      if (typeof workflow.flowData === 'string') {
        const parsed = JSON.parse(workflow.flowData) as any;
        // Ensure the parsed data has the correct shape
        parsedFlowData = {
          nodes: Array.isArray(parsed.nodes) ? parsed.nodes : [],
          edges: Array.isArray(parsed.edges) ? parsed.edges : []
        };
      } else if (typeof workflow.flowData === 'object' && workflow.flowData !== null) {
        // Ensure the object has the correct shape
        const flowObj = workflow.flowData as any;
        parsedFlowData = {
          nodes: Array.isArray(flowObj.nodes) ? flowObj.nodes : [],
          edges: Array.isArray(flowObj.edges) ? flowObj.edges : []
        };
      }
      
      console.log("Loaded workflow data:", 
        `Nodes: ${parsedFlowData.nodes.length}, ` +
        `Edges: ${parsedFlowData.edges.length}`
      );
    }
  } catch (error) {
    console.error("Error parsing workflow data:", error);
    // Continue with empty nodes/edges
  }
  
  const initialNodes = parsedFlowData.nodes || [];
  const initialEdges = parsedFlowData.edges || [];
  
  const [nodes, setNodes] = useNodesState(initialNodes);
  const [edges, setEdges] = useEdgesState(initialEdges);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);

  const saveMutation = useMutation({
    mutationFn: async (data: { name: string, data: { nodes: Node[], edges: Edge[] } }) => {
      // Create a clean version of nodes without circular references
      const cleanNodes = data.data.nodes.map(node => {
        if (!node || typeof node !== 'object') {
          return node; // Return as is if not an object
        }
        return {
          ...(node as object),
          // Don't include any functions or circular references
          data: node.data ? {
            ...(node.data as object),
            // Remove any potentially circular references or functions
            _reactFlow_edge: undefined,
            _reactFlow_node: undefined
          } : {}
        };
      });
      
      // Create a clean version of edges
      const cleanEdges = data.data.edges.map(edge => {
        if (!edge || typeof edge !== 'object') {
          return edge; // Return as is if not an object
        }
        
        // Create a simpler edge object with only the essential properties
        return {
          id: edge.id,
          source: edge.source,
          target: edge.target,
          sourceHandle: edge.sourceHandle,
          targetHandle: edge.targetHandle,
          // Create a new style object if it exists
          style: edge.style ? { 
            strokeWidth: edge.style.strokeWidth,
            stroke: edge.style.stroke
          } : undefined,
          // Create a simple markerEnd reference if it exists
          markerEnd: edge.markerEnd ? edge.markerEnd.toString() : undefined
        };
      });
      
      // Create the JSON string with clean data
      const flowDataJson = JSON.stringify({
        nodes: cleanNodes,
        edges: cleanEdges
      });
      
      console.log("Saving workflow with flowData:", flowDataJson.slice(0, 100) + "...");
      
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
    onSuccess: (data) => {
      toast({
        title: "Workflow Saved",
        description: "Your workflow has been saved successfully."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/workflows'] });
      if (isNew) {
        navigate('/');
      }
    },
    onError: (error) => {
      console.error("Error saving workflow:", error);
      toast({
        title: "Error Saving Workflow",
        description: "There was a problem saving your workflow. Please try again.",
        variant: "destructive"
      });
    }
  });

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    [setNodes]
  );
  
  // Add onSettingsClick to node data for generate_text nodes
  useEffect(() => {
    setNodes(nodes => nodes.map(node => {
      if (node.type === 'generate_text') {
        return {
          ...node,
          data: {
            ...node.data,
            onSettingsClick: () => {
              setSelectedNode(node);
              setSettingsDrawerOpen(true);
            }
          }
        };
      }
      return node;
    }));
  }, []);
  
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [setEdges]
  );

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge({
      ...connection,
      // Use the MarkerType enum directly which is allowed
      markerEnd: MarkerType.ArrowClosed,
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

      // Add onSettingsClick to specific node types
      const nodeDataWithHandlers = {
        ...nodeData,
        // Add settings click handler for node types that need configuration
        ...((type === 'generate_text' || type === 'agent_trigger' || type === 'workflow_trigger') ? {
          onSettingsClick: () => {
            // We need to find the node by ID later because this is a closure
            const node = reactFlowInstance.getNode(`${type}-${Date.now()}`);
            if (node) {
              setSelectedNode(node);
              setSettingsDrawerOpen(true);
            }
          }
        } : {})
      };

      const newNode = {
        id: `${type}-${Date.now()}`,
        type,
        position,
        data: nodeDataWithHandlers,
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
  
  // Custom handler for node settings open via button clicks inside nodes
  useEffect(() => {
    const handleNodeSettingsOpen = (event: CustomEvent) => {
      if (event.detail && event.detail.nodeId) {
        const nodeId = event.detail.nodeId;
        const node = nodes.find(n => n.id === nodeId);
        if (node) {
          console.log('Opening settings for node:', node.id);
          setSelectedNode(node);
          setSettingsDrawerOpen(true);
        }
      }
    };

    const handleAgentTriggerUpdate = (event: CustomEvent) => {
      if (event.detail && event.detail.nodeId && event.detail.settings) {
        const { nodeId, settings } = event.detail;
        
        // Update the node with the new settings
        setNodes(nds => {
          return nds.map(node => {
            if (node.id === nodeId) {
              // Update node with new settings
              return {
                ...node,
                data: {
                  ...node.data,
                  settings: {
                    ...node.data.settings,
                    ...settings
                  }
                }
              };
            }
            return node;
          });
        });
      }
    };

    const handleWorkflowTriggerUpdate = (event: CustomEvent) => {
      if (event.detail && event.detail.nodeId && event.detail.settings) {
        const { nodeId, settings } = event.detail;
        
        // Update the node with the new settings (same behavior as agent trigger)
        setNodes(nds => {
          return nds.map(node => {
            if (node.id === nodeId) {
              // Update node with new settings
              return {
                ...node,
                data: {
                  ...node.data,
                  settings: {
                    ...node.data.settings,
                    ...settings
                  }
                }
              };
            }
            return node;
          });
        });
      }
    };

    // Add event listeners for custom events
    window.addEventListener('node-settings-open', handleNodeSettingsOpen as EventListener);
    window.addEventListener('agent-trigger-update', handleAgentTriggerUpdate as EventListener);
    window.addEventListener('workflow-trigger-update', handleWorkflowTriggerUpdate as EventListener);
    
    // Cleanup function to remove event listeners
    return () => {
      window.removeEventListener('node-settings-open', handleNodeSettingsOpen as EventListener);
      window.removeEventListener('agent-trigger-update', handleAgentTriggerUpdate as EventListener);
      window.removeEventListener('workflow-trigger-update', handleWorkflowTriggerUpdate as EventListener);
    };
  }, [nodes, setSelectedNode, setSettingsDrawerOpen]);
  
  const handleNodeClick = (event: React.MouseEvent, node: Node) => {
    // Don't automatically open settings for most node types
    // Only specific nodes should open settings when their main body is clicked
    if (
      (node.type && node.type.startsWith('internal_')) 
      // Removed agent_trigger from here to allow dropdown interaction
    ) {
      console.log('Node clicked that supports settings:', node.type, node.data);
      
      // Open settings drawer for supported nodes
      setSelectedNode(node);
      setSettingsDrawerOpen(true);
    }
    // For other node types, we'll handle settings opening
    // via the button click in the node component itself
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
      // Import the enhanced workflow engine
      const { executeEnhancedWorkflow, registerAllEnhancedNodeExecutors } = await import('@/lib/enhancedWorkflowEngine');
      
      // Register all enhanced node executors, which includes legacy node compatibility
      await registerAllEnhancedNodeExecutors();
      
      // Show all nodes as processing - using type assertion to satisfy TypeScript
      setNodes(nodes.map(node => {
        return {
          ...node,
          data: {
            ...node.data,
            _isProcessing: true
          }
        };
      }) as Node[]);
      
      // Convert ReactFlow nodes/edges to workflow format
      const workflowData = {
        nodes: nodes.map(node => ({
          id: node.id,
          type: node.type || 'unknown',
          data: { ...node.data },
          position: node.position
        })),
        edges: edges.map(edge => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          sourceHandle: edge.sourceHandle ? edge.sourceHandle : undefined,
          targetHandle: edge.targetHandle ? edge.targetHandle : undefined
        }))
      };
      
      // Execute the enhanced workflow with new data format
      await executeEnhancedWorkflow(
        workflowData,
        // Node state change handler
        (nodeId, nodeState) => {
          const updatedNodes = nodes.map(node => {
            if (node.id === nodeId) {
              return {
                ...node,
                data: {
                  ...node.data,
                  _isProcessing: nodeState.status === 'running',
                  _isComplete: nodeState.status === 'completed',
                  _hasError: nodeState.status === 'error',
                  _errorMessage: nodeState.error,
                  _searchResult: nodeState.output?.items?.[0]?.json, // Store result in node data
                  textContent: nodeState.output?.items?.[0]?.json,   // Update text content for visualization nodes
                }
              };
            }
            return node;
          });
          setNodes(updatedNodes as Node[]);
        },
        // Workflow completion handler
        (finalState) => {
          // Check if there were any errors
          const hasErrors = Object.values(finalState.nodeStates).some(
            state => state.status === 'error'
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
          
          // Display the final workflow output if available
          if (finalState.output) {
            console.log('Workflow final output:', finalState.output);
          }
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
            {workflow?.id && (
              <Button
                onClick={() => navigate(`/workflow-test/${workflow.id}`)}
                variant="outline"
              >
                <TestTube className="h-4 w-4 mr-2" />
                Test Workflow
              </Button>
            )}
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
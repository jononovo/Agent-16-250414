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
import MonkeyAgentChatOverlay from '@/components/workflows/MonkeyAgentChatOverlay';
import NodeSettingsDrawer from './NodeSettingsDrawer';

// Import basic fallback node for backward compatibility
import InternalNode from '../flow/nodes/InternalNode';

// Import folder-based node components
import { component as functionNode } from '../../nodes/function/ui';
import { component as claudeNode } from '../../nodes/claude/ui';
import { component as textInputNode } from '../../nodes/text_input/ui';
import { component as httpRequestNode } from '../../nodes/http_request/ui';

// Wrap imports with defensive code to handle potential incompatibility issues
let textTemplateNode = InternalNode;
let dataTransformNode = InternalNode;
let decisionNode = InternalNode;
let jsonPathNode = InternalNode;

// Import other components and use try/catch to handle import errors safely
try {
  // These imports might fail if the components don't match ReactFlow's expected interface
  const textTemplate = require('../../nodes/text_template/ui');
  const dataTransform = require('../../nodes/data_transform/ui');
  const decision = require('../../nodes/decision/ui');
  const jsonPath = require('../../nodes/json_path/ui');
  
  textTemplateNode = textTemplate.component;
  dataTransformNode = dataTransform.component;
  decisionNode = decision.component;
  jsonPathNode = jsonPath.component;
} catch (error) {
  console.warn('Some folder-based node components could not be imported:', error);
}

// Register node types with folder-based implementations
const nodeTypes: NodeTypes = {
  // Folder-based node implementations
  text_input: textInputNode,
  claude: claudeNode,
  http_request: httpRequestNode,
  text_template: textTemplateNode,
  data_transform: dataTransformNode,
  decision: decisionNode,
  function: functionNode,
  json_path: jsonPathNode,
  
  // Internal node types for backward compatibility - fallback to InternalNode for all legacy node types
  internal_new_agent: InternalNode,
  internal_ai_chat_agent: InternalNode,
  internal: InternalNode,
  custom: InternalNode,
  trigger: InternalNode,
  processor: InternalNode,
  output: InternalNode,
  
  // Legacy mappings to folder-based versions where available
  textInput: textInputNode,
  
  // Fallback types for other legacy nodes
  webhook: InternalNode,
  scheduler: InternalNode,
  email_trigger: InternalNode,
  email_send: InternalNode,
  database_query: InternalNode,
  filter: InternalNode,
  
  // Other legacy types we need to handle
  text_prompt: InternalNode,
  visualize_text: InternalNode,
  transform: InternalNode,
  chat_interface: InternalNode,
  generate_text: InternalNode,
  prompt_crafter: InternalNode,
  valid_response: InternalNode,
  perplexity: InternalNode,
  agent_trigger: InternalNode,
  workflow_trigger: InternalNode,
  response_message: InternalNode,
  api_response_message: InternalNode,
  generateText: InternalNode,
  visualizeText: InternalNode,
  routing: InternalNode,
  promptCrafter: InternalNode,
  validResponse: InternalNode
};

interface FlowEditorProps {
  workflow?: Workflow;
  isNew?: boolean;
  onWorkflowUpdate?: (workflowId: number) => void;
}

const FlowEditor = ({ 
  workflow, 
  isNew = false,
  onWorkflowUpdate
}: FlowEditorProps) => {
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
      
      // Log the workflow data
      console.log("Loaded workflow data:", 
        `Nodes: ${parsedFlowData.nodes.length}, ` +
        `Edges: ${parsedFlowData.edges.length}`
      );
      
      // If we have nodes, log one for debugging
      if (parsedFlowData.nodes.length > 0) {
        console.log("Sample node:", JSON.stringify(parsedFlowData.nodes[0]).substring(0, 200) + "...");
      }
      
      // Process nodes to ensure they have all required properties
      parsedFlowData.nodes = parsedFlowData.nodes.map(node => {
        // Make sure the node has a proper position
        if (!node.position || typeof node.position.x !== 'number' || typeof node.position.y !== 'number') {
          console.log("Fixing position for node:", node.id);
          return {
            ...node,
            position: { x: 100, y: 100 }
          };
        }
        
        // Make sure data property exists
        if (!node.data) {
          console.log("Missing data property for node:", node.id);
          return {
            ...node,
            data: { label: node.id, type: node.type }
          };
        }
        
        return node;
      });
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
        ...((type === 'generate_text' || type === 'agent_trigger' || type === 'workflow_trigger' || type === 'response_message' || type === 'api_response_message') ? {
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
    
    // Handle node updates from MonkeyAgent
    const handleMonkeyAgentNodeUpdate = (event: CustomEvent) => {
      if (event.detail && event.detail.nodeId && event.detail.updateData) {
        const { nodeId, updateData } = event.detail;
        
        console.log('MonkeyAgent updating node:', nodeId, updateData);
        
        // Update the node with the new data
        setNodes(nds => {
          return nds.map(node => {
            if (node.id === nodeId) {
              // Create a new node data object with the updates applied
              const newData = { ...node.data };
              
              // Apply each update to the appropriate part of the node data
              Object.entries(updateData).forEach(([key, value]) => {
                if (key === 'settings' && typeof value === 'object') {
                  // For settings, merge with existing settings
                  newData.settings = {
                    ...newData.settings,
                    ...value
                  };
                  
                  // Also check for specific Claude API settings to provide feedback
                  if (node.type === 'claude') {
                    // Log the specific settings being changed to help debug
                    const valueObj = value as Record<string, any>;
                    if (valueObj) {
                      const updatedSettings = Object.keys(valueObj);
                      console.log(`Updating Claude node settings: ${updatedSettings.join(', ')}`);
                    }
                    
                    // For Claude nodes, update the model display if the model is changed
                    const valueObject = value as Record<string, any>;
                    if (valueObject && valueObject.model) {
                      console.log(`Claude model updated to: ${valueObject.model}`);
                    }
                    
                    // For Claude nodes, update system prompt if it's changed
                    if (valueObject && valueObject.systemPrompt) {
                      const promptPrefix = valueObject.systemPrompt.substring(0, 30);
                      console.log(`System prompt updated to: ${promptPrefix}...`);
                    }
                  }
                } else if (key === 'label') {
                  // Update label
                  newData.label = value;
                  console.log(`Updated label to: ${value}`);
                } else if (key === 'description') {
                  // Update description
                  newData.description = value;
                  console.log(`Updated description to: ${value}`);
                } else if (key === 'content' && node.type === 'text_prompt') {
                  // For text_prompt nodes, update the content
                  newData.content = value;
                  console.log(`Updated content for text_prompt node`);
                } else {
                  // For any other property, just set it directly
                  newData[key] = value;
                  console.log(`Updated ${key} to:`, value);
                }
              });
              
              // Log the updated node data
              console.log('Updated node data:', newData);
              
              // Return a new node with the updated data
              return {
                ...node,
                data: newData
              };
            }
            return node;
          });
        });
        
        // Display a toast to confirm the update
        toast({
          title: "Node Updated",
          description: `Successfully updated node: ${nodeId}`,
        });
        
        // Trigger a save after updating the node
        setTimeout(() => {
          saveMutation.mutate({
            name,
            data: {
              nodes,
              edges
            }
          });
        }, 500);
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
    window.addEventListener('monkey-agent-update-node', handleMonkeyAgentNodeUpdate as EventListener);
    
    // Cleanup function to remove event listeners
    return () => {
      window.removeEventListener('node-settings-open', handleNodeSettingsOpen as EventListener);
      window.removeEventListener('agent-trigger-update', handleAgentTriggerUpdate as EventListener);
      window.removeEventListener('workflow-trigger-update', handleWorkflowTriggerUpdate as EventListener);
      window.removeEventListener('monkey-agent-update-node', handleMonkeyAgentNodeUpdate as EventListener);
    };
  }, [nodes, setNodes, setSelectedNode, setSettingsDrawerOpen, name, edges, saveMutation]);
  
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

  // Handler for when a workflow is generated by the chat
  const handleWorkflowGenerated = (workflowId: number) => {
    // If we're already on this workflow ID, simply update our nodes and edges
    if (workflow?.id === workflowId) {
      queryClient.invalidateQueries({ queryKey: ['/api/workflows', workflowId] });
      
      // Call the parent's update handler if provided
      if (onWorkflowUpdate) {
        onWorkflowUpdate(workflowId);
      }
    } else {
      // If we're on a different workflow, navigate to the new one
      navigate(`/workflow-editor/${workflowId}`);
    }
  };

  return (
    <div className="flex h-screen relative">
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
      
      {/* Monkey Agent Chat Overlay */}
      <MonkeyAgentChatOverlay 
        onWorkflowGenerated={handleWorkflowGenerated}
        workflow={workflow}
        isNew={isNew}
      />
    </div>
  );
};

export default FlowEditor;
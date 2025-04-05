import { Node, Edge } from 'reactflow';
import { 
  EnhancedNodeExecutor,
  NodeExecutionData, 
  WorkflowData, 
  WorkflowExecutionState, 
  NodeState,
  WorkflowItem,
  createWorkflowItem
} from './types/workflow';

const nodeRegistry: Record<string, EnhancedNodeExecutor> = {};

/**
 * Create an enhanced node executor with standard interfaces
 */
export function createEnhancedNodeExecutor(
  definition: {
    type: string;
    displayName: string;
    description: string;
    icon: string;
    category: string;
    version: string;
    inputs: Record<string, {
      type: string;
      displayName: string;
      description: string;
      required?: boolean;
      default?: any;
    }>;
    outputs: Record<string, {
      type: string;
      displayName: string;
      description: string;
    }>;
  },
  executorFn: (nodeData: Record<string, any>, inputs: Record<string, NodeExecutionData>) => Promise<NodeExecutionData>
): EnhancedNodeExecutor {
  return {
    definition,
    execute: executorFn
  };
}

/**
 * Register a node executor for a specific node type
 */
export function registerEnhancedNodeExecutor(nodeType: string, executor: EnhancedNodeExecutor): void {
  nodeRegistry[nodeType] = executor;
  console.log(`Registered enhanced node executor for type: ${nodeType}`);
}

/**
 * Register all enhanced node executors
 */
export async function registerAllEnhancedNodeExecutors(): Promise<void> {
  try {
    // Import all executors
    const { textInputExecutor } = await import('./enhancedNodeExecutors/textInputExecutor');
    const { claudeExecutor } = await import('./enhancedNodeExecutors/claudeExecutor');
    const { visualizeTextExecutor } = await import('./enhancedNodeExecutors/visualizeTextExecutor');
    const { transformExecutor } = await import('./enhancedNodeExecutors/transformExecutor');
    const { outputExecutor } = await import('./enhancedNodeExecutors/outputExecutor');
    const { chatInterfaceExecutor } = await import('./enhancedNodeExecutors/chatInterfaceExecutor');
    
    // Register all executors
    registerEnhancedNodeExecutor('text_input', textInputExecutor);
    registerEnhancedNodeExecutor('claude', claudeExecutor);
    registerEnhancedNodeExecutor('visualize_text', visualizeTextExecutor);
    registerEnhancedNodeExecutor('transform', transformExecutor);
    registerEnhancedNodeExecutor('output', outputExecutor);
    registerEnhancedNodeExecutor('chat_interface', chatInterfaceExecutor);
    
    // Register legacy/compatibility aliases
    registerEnhancedNodeExecutor('generate_text', claudeExecutor);
    registerEnhancedNodeExecutor('perplexity', claudeExecutor);
    
    console.log('All enhanced node executors registered successfully');
  } catch (error) {
    console.error('Error registering enhanced node executors:', error);
    throw error;
  }
}

/**
 * Create a dependency graph from workflow nodes and edges
 */
function createNodeDependencyGraph(workflowData: WorkflowData): Record<string, string[]> {
  const dependencyGraph: Record<string, string[]> = {};
  
  // Initialize empty arrays for all nodes
  workflowData.nodes.forEach(node => {
    dependencyGraph[node.id] = [];
  });
  
  // Add dependencies based on edges
  workflowData.edges.forEach(edge => {
    if (dependencyGraph[edge.target]) {
      dependencyGraph[edge.target].push(edge.source);
    }
  });
  
  return dependencyGraph;
}

/**
 * Resolve execution order based on dependency graph (topological sort)
 */
function resolveExecutionOrder(dependencyGraph: Record<string, string[]>): string[] {
  const visited: Record<string, boolean> = {};
  const temp: Record<string, boolean> = {};
  const order: string[] = [];
  
  // Define DFS function for topological sort
  function dfs(nodeId: string): void {
    // If node is in temp, we have a cycle
    if (temp[nodeId]) {
      throw new Error(`Cycle detected in workflow at node ${nodeId}`);
    }
    
    // If node is already visited, skip
    if (visited[nodeId]) {
      return;
    }
    
    // Mark node as temporarily visited
    temp[nodeId] = true;
    
    // Visit all dependencies first
    const dependencies = dependencyGraph[nodeId] || [];
    for (const depId of dependencies) {
      dfs(depId);
    }
    
    // Mark node as permanently visited
    temp[nodeId] = false;
    visited[nodeId] = true;
    
    // Add node to order
    order.push(nodeId);
  }
  
  // Run DFS for all nodes
  for (const nodeId in dependencyGraph) {
    if (!visited[nodeId]) {
      dfs(nodeId);
    }
  }
  
  return order;
}

/**
 * Get input mapping for nodes (which input connects to which output)
 */
function getInputMapping(workflowData: WorkflowData): Record<string, Record<string, { nodeId: string, outputKey: string }>> {
  const inputMapping: Record<string, Record<string, { nodeId: string, outputKey: string }>> = {};
  
  // Initialize empty objects for all nodes
  workflowData.nodes.forEach(node => {
    inputMapping[node.id] = {};
  });
  
  // Create mappings based on edges
  workflowData.edges.forEach(edge => {
    const targetNode = edge.target;
    const targetHandle = edge.targetHandle || 'default';
    const sourceNode = edge.source;
    const sourceHandle = edge.sourceHandle || 'default';
    
    if (inputMapping[targetNode]) {
      inputMapping[targetNode][targetHandle] = {
        nodeId: sourceNode,
        outputKey: sourceHandle
      };
    }
  });
  
  return inputMapping;
}

/**
 * Execute an enhanced workflow
 */
export async function executeEnhancedWorkflow(
  workflowData: WorkflowData,
  onNodeStateChange?: (nodeId: string, state: NodeState) => void,
  onWorkflowComplete?: (state: WorkflowExecutionState) => void
): Promise<WorkflowExecutionState> {
  console.log('Executing enhanced workflow with', workflowData.nodes.length, 'nodes');
  
  // Create initial execution state
  const executionState: WorkflowExecutionState = {
    status: 'running',
    nodeStates: {},
    startTime: new Date(),
    endTime: null,
    nodeOutputs: {}
  };
  
  // Create dependency graph and resolve execution order
  const dependencyGraph = createNodeDependencyGraph(workflowData);
  let executionOrder: string[];
  
  try {
    executionOrder = resolveExecutionOrder(dependencyGraph);
    console.log('Resolved execution order:', executionOrder);
  } catch (error) {
    executionState.status = 'error';
    executionState.error = error instanceof Error ? error.message : String(error);
    executionState.endTime = new Date();
    
    if (onWorkflowComplete) {
      onWorkflowComplete(executionState);
    }
    
    throw new Error(`Error resolving execution order: ${executionState.error}`);
  }
  
  // Get input mapping
  const inputMapping = getInputMapping(workflowData);
  
  // Node map for quick lookup
  const nodeMap = new Map<string, any>();
  workflowData.nodes.forEach(node => {
    nodeMap.set(node.id, node);
  });
  
  // Execute nodes in order
  try {
    for (const nodeId of executionOrder) {
      const node = nodeMap.get(nodeId);
      
      if (!node) {
        throw new Error(`Node with id ${nodeId} not found in workflow`);
      }
      
      const nodeType = node.type;
      const nodeData = node.data || {};
      
      // Get executor for node type
      const executor = nodeRegistry[nodeType];
      
      if (!executor) {
        throw new Error(`No executor registered for node type ${nodeType}`);
      }
      
      // Prepare node state in execution state
      executionState.nodeStates[nodeId] = {
        status: 'running',
        startTime: new Date(),
        endTime: null,
        output: undefined
      };
      
      // Notify of node state change
      if (onNodeStateChange) {
        onNodeStateChange(nodeId, executionState.nodeStates[nodeId]);
      }
      
      try {
        // Collect inputs from connected nodes
        const inputs: Record<string, NodeExecutionData> = {};
        const nodeInputMapping = inputMapping[nodeId] || {};
        
        // For each input target, get the output from the source node
        for (const [inputKey, { nodeId: sourceNodeId, outputKey }] of Object.entries(nodeInputMapping)) {
          const sourceOutput = executionState.nodeOutputs[sourceNodeId];
          
          if (!sourceOutput) {
            throw new Error(`No output available from source node ${sourceNodeId}`);
          }
          
          // Get the output with the matching outputKey, or use the default if available
          // Some nodes might not use named outputs
          inputs[inputKey] = sourceOutput;
        }
        
        // Use node data as inputs for any configured values
        for (const [key, value] of Object.entries(nodeData)) {
          if (key !== 'label' && key !== 'description' && !key.startsWith('_')) {
            if (!inputs[key] && value !== undefined) {
              // Create a workflow item from the value if not already an input
              inputs[key] = {
                items: [createWorkflowItem(value, 'static')],
                meta: { startTime: new Date(), endTime: new Date() }
              };
            }
          }
        }
        
        // Execute the node
        console.log(`Executing node ${nodeId} (${nodeType})`);
        const output = await executor.execute(nodeData, inputs);
        
        // Store output
        executionState.nodeOutputs[nodeId] = output;
        
        // Update node state
        executionState.nodeStates[nodeId] = {
          status: 'completed',
          startTime: executionState.nodeStates[nodeId].startTime,
          endTime: new Date(),
          output
        };
        
        // Check if this is the last node in the workflow
        const isLastNodeInFlow = executionOrder[executionOrder.length - 1] === nodeId;
        if (isLastNodeInFlow) {
          executionState.output = output;
        }
        
        // Notify of node state change
        if (onNodeStateChange) {
          onNodeStateChange(nodeId, executionState.nodeStates[nodeId]);
        }
      } catch (error) {
        console.error(`Error executing node ${nodeId} (${nodeType}):`, error);
        
        // Update node state with error
        executionState.nodeStates[nodeId] = {
          status: 'error',
          startTime: executionState.nodeStates[nodeId].startTime,
          endTime: new Date(),
          error: error instanceof Error ? error.message : String(error)
        };
        
        // Notify of node state change
        if (onNodeStateChange) {
          onNodeStateChange(nodeId, executionState.nodeStates[nodeId]);
        }
        
        // Stop execution if node is marked as critical
        if (nodeData.critical) {
          throw new Error(`Critical node ${nodeId} (${nodeType}) failed: ${executionState.nodeStates[nodeId].error}`);
        }
      }
    }
    
    // Mark workflow as completed
    executionState.status = 'completed';
  } catch (error) {
    console.error('Error executing workflow:', error);
    
    // Mark workflow as failed
    executionState.status = 'error';
    executionState.error = error instanceof Error ? error.message : String(error);
  } finally {
    // Set end time
    executionState.endTime = new Date();
    
    // Notify of workflow completion
    if (onWorkflowComplete) {
      onWorkflowComplete(executionState);
    }
  }
  
  return executionState;
}
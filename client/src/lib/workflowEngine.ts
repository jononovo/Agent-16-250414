import { Edge, Node } from 'reactflow';

export type NodeState = 'idle' | 'running' | 'complete' | 'error';

export interface NodeExecutionState {
  state: NodeState;
  data: any;
  error?: string;
}

export interface WorkflowExecutionState {
  status: 'idle' | 'running' | 'complete' | 'error';
  nodeStates: Record<string, NodeExecutionState>;
  startTime?: Date;
  endTime?: Date;
  error?: string;
}

export interface NodeExecutor {
  execute: (nodeData: any, inputs: Record<string, any>) => Promise<any>;
  getNodeInputs?: (node: Node, nodeStates: Record<string, NodeExecutionState>, edges: Edge[]) => Record<string, any>;
}

// Registry of node executors by node type
const nodeExecutors: Record<string, NodeExecutor> = {};

/**
 * Register a node executor for a specific node type
 */
export function registerNodeExecutor(nodeType: string, executor: NodeExecutor): void {
  nodeExecutors[nodeType] = executor;
}

/**
 * Get input data for a node based on incoming edges
 */
function getNodeInputs(node: Node, nodeStates: Record<string, NodeExecutionState>, edges: Edge[]): Record<string, any> {
  // If the node type has a custom input handler, use it
  const nodeType = node.type || '';
  if (nodeExecutors[nodeType]?.getNodeInputs) {
    return nodeExecutors[nodeType].getNodeInputs!(node, nodeStates, edges);
  }

  // Default input handling logic
  const inputs: Record<string, any> = {};
  
  // Find all incoming edges to this node
  const incomingEdges = edges.filter(edge => edge.target === node.id);
  
  for (const edge of incomingEdges) {
    // Get source node state
    const sourceNodeState = nodeStates[edge.source];
    if (sourceNodeState && sourceNodeState.state === 'complete') {
      // Use the data from the completed source node
      inputs[edge.sourceHandle || 'default'] = sourceNodeState.data;
    }
  }
  
  return inputs;
}

/**
 * Check if a node's dependencies are satisfied
 */
function areNodeDependenciesSatisfied(node: Node, nodeStates: Record<string, NodeExecutionState>, edges: Edge[]): boolean {
  // Find all incoming edges to this node
  const incomingEdges = edges.filter(edge => edge.target === node.id);
  
  // If no incoming edges, the node is ready to execute
  if (incomingEdges.length === 0) {
    return true;
  }
  
  // Check if all source nodes are complete
  for (const edge of incomingEdges) {
    const sourceNodeState = nodeStates[edge.source];
    if (!sourceNodeState || sourceNodeState.state !== 'complete') {
      return false;
    }
  }
  
  return true;
}

/**
 * Find the next nodes to execute
 */
function findNextNodes(nodes: Node[], nodeStates: Record<string, NodeExecutionState>, edges: Edge[]): Node[] {
  return nodes.filter(node => {
    // Skip nodes that are already running, completed, or in error state
    const nodeState = nodeStates[node.id];
    if (nodeState && (nodeState.state === 'running' || nodeState.state === 'complete' || nodeState.state === 'error')) {
      return false;
    }
    
    // Check if all dependencies are satisfied
    return areNodeDependenciesSatisfied(node, nodeStates, edges);
  });
}

/**
 * Execute a workflow
 */
export async function executeWorkflow(
  nodes: Node[], 
  edges: Edge[],
  onNodeStateChange: (nodeId: string, state: NodeExecutionState) => void,
  onExecutionComplete: (state: WorkflowExecutionState) => void
): Promise<WorkflowExecutionState> {
  // Initialize execution state
  const executionState: WorkflowExecutionState = {
    status: 'running',
    nodeStates: {},
    startTime: new Date(),
  };
  
  // Initialize all nodes to idle state
  nodes.forEach(node => {
    executionState.nodeStates[node.id] = { state: 'idle', data: node.data };
  });
  
  // Execute workflow until all nodes are processed or error occurs
  let executionComplete = false;
  
  try {
    while (!executionComplete) {
      // Find the next nodes to execute
      const nextNodes = findNextNodes(nodes, executionState.nodeStates, edges);
      
      // If no more nodes to execute, we're done
      if (nextNodes.length === 0) {
        // Check if all nodes are complete or error
        const allNodesProcessed = nodes.every(node => {
          const state = executionState.nodeStates[node.id].state;
          return state === 'complete' || state === 'error';
        });
        
        if (allNodesProcessed) {
          executionComplete = true;
          executionState.status = 'complete';
        } else {
          // We have a deadlock or circular dependency
          throw new Error('Workflow execution stalled. Possible circular dependency detected.');
        }
        break;
      }
      
      // Execute all ready nodes in parallel
      const nodeExecutionPromises = nextNodes.map(async node => {
        // Mark node as running
        executionState.nodeStates[node.id].state = 'running';
        onNodeStateChange(node.id, executionState.nodeStates[node.id]);
        
        try {
          // Get the executor for this node type
          const nodeType = node.type || '';
          const executor = nodeExecutors[nodeType];
          if (!executor) {
            throw new Error(`No executor registered for node type: ${nodeType}`);
          }
          
          // Get inputs for this node
          const inputs = getNodeInputs(node, executionState.nodeStates, edges);
          
          // Execute the node
          const result = await executor.execute(node.data, inputs);
          
          // Update node state to complete with the result data
          executionState.nodeStates[node.id] = {
            state: 'complete',
            data: result
          };
          
          onNodeStateChange(node.id, executionState.nodeStates[node.id]);
        } catch (error) {
          // Update node state to error
          executionState.nodeStates[node.id] = {
            state: 'error',
            data: node.data,
            error: error instanceof Error ? error.message : String(error)
          };
          
          onNodeStateChange(node.id, executionState.nodeStates[node.id]);
        }
      });
      
      // Wait for all current nodes to complete
      await Promise.all(nodeExecutionPromises);
    }
  } catch (error) {
    // Set workflow to error state
    executionState.status = 'error';
    executionState.error = error instanceof Error ? error.message : String(error);
  } finally {
    // Mark execution as complete
    executionState.endTime = new Date();
    onExecutionComplete(executionState);
  }
  
  return executionState;
}

/**
 * Create a simple node executor
 */
export function createSimpleNodeExecutor(
  executeFn: (nodeData: any, inputs: Record<string, any>) => Promise<any>
): NodeExecutor {
  return {
    execute: executeFn
  };
}
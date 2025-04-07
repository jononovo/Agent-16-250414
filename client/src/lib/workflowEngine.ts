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
  
  // Standard case for all nodes
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
  
  // Standard case - check for OR vs AND behavior based on node type
  const nodeType = node.type || '';
  // Some node types only need one of their dependencies to be satisfied
  // This allows multiple potential trigger sources where only one is active
  const isORDependencyNode = nodeType === 'claude';
  
  if (isORDependencyNode) {
    // For OR-dependency nodes, we only need ONE of the dependencies to be satisfied
    for (const edge of incomingEdges) {
      const sourceNodeState = nodeStates[edge.source];
      if (sourceNodeState && sourceNodeState.state === 'complete') {
        return true;
      }
    }
    return false;
  }
  
  // Standard case - all source nodes must be complete
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
  // First, check for trigger nodes that need priority handling
  // In workflows with multiple potential trigger nodes (like workflow 15),
  // we need to make sure both trigger nodes are processed before moving on
  
  // Step 1: Find all available trigger nodes
  const availableTriggerNodes = nodes.filter(node => {
    // Only consider internal node types that act as triggers
    const isTriggerNode = node.type?.includes('internal_') && node.type?.includes('_agent');
                           
    if (!isTriggerNode) return false;
    
    // Skip nodes that are already running, completed, or in error state
    const nodeState = nodeStates[node.id];
    if (nodeState && (nodeState.state === 'running' || nodeState.state === 'complete' || nodeState.state === 'error')) {
      return false;
    }
    
    return true;
  });
  
  // If we have available trigger nodes, prioritize processing them first
  if (availableTriggerNodes.length > 0) {
    console.log(`Prioritizing processing of trigger nodes: ${availableTriggerNodes.map(n => n.id).join(', ')}`);
    return availableTriggerNodes;
  }
  
  // Standard case: filter nodes ready for execution
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
        // Check if all nodes are complete, error, or can be considered "processed"
        const allNodesProcessed = nodes.every(node => {
          const nodeState = executionState.nodeStates[node.id];
          const state = nodeState.state;
          
          // Check for special case where a node is meant to be skipped
          // This is used by internal nodes that should be ignored in certain contexts
          const isSkippedNode = nodeState.data && 
                              (nodeState.data._skipped === true || 
                               nodeState.data.status === 'skipped');
          
          return state === 'complete' || state === 'error' || isSkippedNode;
        });
        
        if (allNodesProcessed) {
          executionComplete = true;
          executionState.status = 'complete';
        } else {
          // Log the unprocessed nodes for debugging
          const unprocessedNodes = nodes
            .filter(node => {
              const nodeState = executionState.nodeStates[node.id];
              const state = nodeState.state;
              const isSkippedNode = nodeState.data && 
                                 (nodeState.data._skipped === true || 
                                  nodeState.data.status === 'skipped');
              return state !== 'complete' && state !== 'error' && !isSkippedNode;
            })
            .map(node => node.id);
            
          console.error(`Workflow execution stalled. Unprocessed nodes: ${unprocessedNodes.join(', ')}`);
          
          // Check if this is a debug test run - if so, we'll allow it to proceed with "skipped" nodes
          // First, check for special debug flags in any node
          const anyNodeState = Object.values(executionState.nodeStates).find(nodeState => 
            nodeState?.data?.metadata?.debug === true || 
            nodeState?.data?.metadata?.bypassCircularDependency === true
          );
          
          const hasDebugFlag = Boolean(anyNodeState);
          const forceSkipNodes = anyNodeState?.data?.metadata?.forceSkipNodes || [];
          
          // Look for nodes that should be forcibly skipped (even if not in unprocessedNodes)
          if (hasDebugFlag && forceSkipNodes.length > 0) {
            console.log(`Specific nodes configured to be skipped in debug mode: ${forceSkipNodes.join(', ')}`);
            
            // Add all force-skip nodes to unprocessed if they're not already there
            forceSkipNodes.forEach((nodeId: string) => {
              if (!unprocessedNodes.includes(nodeId)) {
                unprocessedNodes.push(nodeId);
              }
            });
          }
          
          if (hasDebugFlag) {
            console.log('Debug mode detected - allowing workflow to continue despite stalled execution');
            
            // Mark all unprocessed nodes as "skipped" for this debug run
            unprocessedNodes.forEach(nodeId => {
              executionState.nodeStates[nodeId].data = {
                ...executionState.nodeStates[nodeId].data,
                _skipped: true,
                _debugSkipped: true
              };
              executionState.nodeStates[nodeId].state = 'complete';
              onNodeStateChange(nodeId, executionState.nodeStates[nodeId]);
            });
            
            // Set workflow to complete with a warning
            executionComplete = true;
            executionState.status = 'complete';
            executionState.error = 'Some nodes were skipped in debug mode to avoid circular dependency';
            break;
          }
          
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
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
  
  // Special case for claude-1 node in workflow 15 (Build New Agent Structure)
  // Claude node needs to accept input from either trigger node
  if (node.id === 'claude-1' && node.type === 'claude') {
    // Check if we have any completed internal nodes as sources
    for (const edge of incomingEdges) {
      const sourceNodeId = edge.source;
      const sourceNode = nodeStates[sourceNodeId];
      
      if (sourceNode && (sourceNode.state === 'complete' || sourceNode.state === 'running')) {
        console.log(`Claude node receiving input from ${sourceNodeId}:`, sourceNode.data);
        inputs[edge.sourceHandle || 'default'] = sourceNode.data;
        
        // Once we have one valid input for claude, we can break as only one input is needed
        break;
      }
    }
    
    // If we don't have any valid inputs yet, we need to check for any node data with workflow input
    if (Object.keys(inputs).length === 0) {
      for (const nodeId in nodeStates) {
        const nodeState = nodeStates[nodeId];
        if (nodeState && nodeState.data && nodeState.data._workflowInput) {
          console.log(`Claude node using workflow input from node ${nodeId}`);
          inputs['default'] = { 
            inputText: nodeState.data._workflowInput.prompt,
            prompt: nodeState.data._workflowInput.prompt
          };
          break;
        }
      }
    }
    
    // Log the inputs for debugging
    console.log(`Claude node inputs:`, JSON.stringify(inputs));
    return inputs;
  }
  
  // Standard case for all other nodes
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
  
  // Special case for claude-1 node in workflows with multiple possible trigger nodes
  if (node.id === 'claude-1' && node.type === 'claude') {
    // For claude node, we only need ONE of its dependencies to be satisfied
    // This allows it to work with multiple trigger nodes where only one will be active
    let hasCompletedSource = false;
    
    for (const edge of incomingEdges) {
      const sourceNodeState = nodeStates[edge.source];
      // Either the source is complete OR it's been marked with our special flag to be skipped
      if (sourceNodeState && 
          (sourceNodeState.state === 'complete' || 
           (sourceNodeState.data && sourceNodeState.data._skipped === true))) {
        hasCompletedSource = true;
        break;
      }
    }
    
    // If at least one source is complete, or we have a direct workflow input, we can proceed
    if (hasCompletedSource) {
      return true;
    }
    
    // If no completed sources, check if there's a workflow input we can use directly
    // This fallback ensures claude can run even if no trigger nodes are complete
    for (const nodeId in nodeStates) {
      const nodeState = nodeStates[nodeId];
      if (nodeState && nodeState.data && nodeState.data._workflowInput) {
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
    const isTriggerNode = node.type?.includes('internal_') && 
                          (node.id === 'internal_new_agent-1' || 
                           node.id === 'internal_ai_chat_agent-1');
                           
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
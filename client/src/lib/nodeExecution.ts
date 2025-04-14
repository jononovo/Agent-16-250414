/**
 * Node Execution Utilities
 * 
 * This file provides utility functions for node execution in workflows.
 */

import { getNodeByType } from '../nodes/registry';

/**
 * Execute a node with the given data and inputs
 * 
 * @param nodeType The type of node to execute
 * @param nodeData The configuration data for the node
 * @param inputs The inputs provided to the node
 * @returns The execution result
 */
export async function executeNode(
  nodeType: string,
  nodeData: any,
  inputs?: any
): Promise<any> {
  // Get the node from the registry
  const node = getNodeByType(nodeType);
  
  if (!node) {
    throw new Error(`Node type not found: ${nodeType}`);
  }
  
  // Execute the node using its executor
  try {
    return await node.executor.execute(nodeData, inputs);
  } catch (error: any) {
    console.error(`Error executing node ${nodeType}:`, error);
    
    // Return a standardized error response
    return {
      meta: {
        status: 'error',
        message: error.message || `Error executing ${nodeType} node`,
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString()
      },
      items: []
    };
  }
}

/**
 * Create a simple workflow execution engine for testing
 * This is a simplified version of a workflow execution engine
 */
export async function executeSimpleWorkflow(
  nodes: any[],
  edges: any[],
  inputData: any = {}
): Promise<any> {
  // Map of node ID to its output data
  const nodeOutputs: Record<string, any> = {};
  
  // Find input nodes (nodes with no incoming edges)
  const inputNodes = nodes.filter(node => {
    return !edges.some(edge => edge.target === node.id);
  });
  
  // Apply input data to input nodes
  for (const node of inputNodes) {
    nodeOutputs[node.id] = {
      output: inputData[node.id] || null
    };
  }
  
  // Create a queue of nodes to process
  const nodeQueue = [...nodes.filter(node => !inputNodes.includes(node))];
  
  // Process nodes until the queue is empty
  while (nodeQueue.length > 0) {
    const nodeToProcess = nodeQueue[0];
    
    // Get all inputs to this node
    const nodeInputs: Record<string, any> = {};
    const inputEdges = edges.filter(edge => edge.target === nodeToProcess.id);
    
    // Check if all inputs are available
    const allInputsAvailable = inputEdges.every(edge => nodeOutputs[edge.source]);
    
    if (!allInputsAvailable) {
      // Move this node to the end of the queue and continue
      nodeQueue.shift();
      nodeQueue.push(nodeToProcess);
      continue;
    }
    
    // Collect input data for the node
    for (const edge of inputEdges) {
      nodeInputs[edge.source] = nodeOutputs[edge.source];
    }
    
    try {
      // Execute the node
      const result = await executeNode(
        nodeToProcess.data.type,
        nodeToProcess.data,
        nodeInputs
      );
      
      // Store the output
      nodeOutputs[nodeToProcess.id] = result;
      
      // Remove the node from the queue
      nodeQueue.shift();
    } catch (error) {
      console.error(`Error executing node ${nodeToProcess.id}:`, error);
      // Remove the node from the queue to avoid infinite loops
      nodeQueue.shift();
    }
  }
  
  // Return all node outputs
  return nodeOutputs;
}
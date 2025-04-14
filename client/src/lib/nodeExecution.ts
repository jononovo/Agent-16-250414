/**
 * Node Execution Utilities
 * 
 * This file provides utility functions for node execution in workflows.
 */
import { getNodeByType } from './nodeRegistry';
import { NodeExecutionData } from './types/workflow';

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
  inputs: Record<string, NodeExecutionData> = {}
): Promise<NodeExecutionData> {
  // Get the node definition from the registry
  const node = getNodeByType(nodeType);
  
  if (!node) {
    throw new Error(`Node type not found: ${nodeType}`);
  }
  
  try {
    // Execute the node with the provided data and inputs
    return await node.executor.execute(nodeData, inputs);
  } catch (error: any) {
    console.error(`Error executing node ${nodeType}:`, error);
    
    // Return error result
    return {
      items: [],
      meta: {
        startTime: new Date(),
        endTime: new Date(),
        status: 'error',
        message: error.message || `Error executing node ${nodeType}`
      }
    };
  }
}

/**
 * Create a simple workflow execution engine for testing
 * This is a simplified version of a workflow execution engine
 */
export async function executeSimpleWorkflow(
  nodes: Array<{type: string, id: string, data: any}>,
  edges: Array<{source: string, sourceHandle: string, target: string, targetHandle: string}>,
  inputData: Record<string, any> = {}
): Promise<Record<string, NodeExecutionData>> {
  // Store node execution results by node ID
  const results: Record<string, NodeExecutionData> = {};
  
  // Determine node execution order (simple topological sort)
  const visited = new Set<string>();
  const executionOrder: string[] = [];
  
  // Create a map of node dependencies
  const incomingEdges: Record<string, Array<{source: string, sourceHandle: string, targetHandle: string}>> = {};
  
  // Initialize empty arrays for all nodes
  nodes.forEach(node => {
    incomingEdges[node.id] = [];
  });
  
  // Populate incoming edges
  edges.forEach(edge => {
    if (!incomingEdges[edge.target]) {
      incomingEdges[edge.target] = [];
    }
    incomingEdges[edge.target].push({
      source: edge.source,
      sourceHandle: edge.sourceHandle,
      targetHandle: edge.targetHandle
    });
  });
  
  // Find nodes with no dependencies
  const startNodes = nodes.filter(node => incomingEdges[node.id].length === 0);
  
  // Simple recursive function to process nodes in order
  const processNode = (nodeId: string) => {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);
    
    // Process all dependencies first
    for (const edge of incomingEdges[nodeId]) {
      processNode(edge.source);
    }
    
    executionOrder.push(nodeId);
  };
  
  // Start with nodes that have no incoming edges
  startNodes.forEach(node => {
    processNode(node.id);
  });
  
  // Execute nodes in order
  for (const nodeId of executionOrder) {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) continue;
    
    // Gather inputs from connected nodes
    const nodeInputs: Record<string, NodeExecutionData> = {};
    
    // Get edges that target this node
    for (const edge of incomingEdges[nodeId]) {
      const sourceNode = results[edge.source];
      if (!sourceNode) continue;
      
      // Connect the source output to target input based on handles
      nodeInputs[edge.targetHandle || 'default'] = sourceNode;
    }
    
    // Add any direct inputs from the workflow input
    if (inputData[nodeId]) {
      if (!nodeInputs.input) {
        nodeInputs.input = { items: [], meta: { startTime: new Date(), endTime: new Date(), status: 'success' } };
      }
      
      nodeInputs.input.items = [{ json: inputData[nodeId] }];
    }
    
    // Execute the node
    console.log(`Executing node ${nodeId} (${node.type})...`);
    results[nodeId] = await executeNode(node.type, node.data, nodeInputs);
  }
  
  return results;
}

export default {
  executeNode,
  executeSimpleWorkflow
};
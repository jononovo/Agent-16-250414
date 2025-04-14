/**
 * Node System
 * 
 * This module connects the folder-based node structure with the workflow execution engine.
 * It automatically discovers and registers node executors from the node registry.
 */

import { getNode, getAllNodes } from '../nodes/registry';
import { registerNodeExecutor } from './enhancedNodeExecutors';
import { registerEnhancedNodeExecutor, createEnhancedNodeExecutor } from './enhancedWorkflowEngine';

/**
 * Register all node executors from the folder-based node registry
 * This bridges the new node system with the workflow execution engine
 */
export function registerNodeExecutorsFromRegistry(): void {
  console.log('Registering node executors from folder-based registry...');
  
  // Get all nodes from the registry
  const nodes = getAllNodes();
  
  // Register each node's executor with both executor systems
  nodes.forEach(node => {
    if (node.executor && node.executor.execute) {
      console.log(`Registering executor for node type: ${node.type}`);
      
      // Register with enhancedNodeExecutors
      registerNodeExecutor(node.type, {
        execute: async (nodeData, inputs) => {
          try {
            // Execute the node's folder-based executor
            return await node.executor.execute(nodeData, inputs);
          } catch (error) {
            console.error(`Error executing ${node.type} node:`, error);
            return {
              error: error instanceof Error ? error.message : String(error)
            };
          }
        }
      });
      
      // Register with enhancedWorkflowEngine
      registerEnhancedNodeExecutor(
        node.type,
        createEnhancedNodeExecutor(
          {
            type: node.type,
            displayName: node.metadata.name,
            description: node.metadata.description,
            icon: 'bolt',
            category: node.metadata.category,
            version: node.metadata.version,
            inputs: Object.fromEntries(
              Object.entries(node.schema.inputs).map(([key, value]) => [
                key,
                {
                  type: value.type,
                  displayName: key,
                  description: value.description,
                  required: value.required
                }
              ])
            ),
            outputs: Object.fromEntries(
              Object.entries(node.schema.outputs).map(([key, value]) => [
                key,
                {
                  type: value.type,
                  displayName: key,
                  description: value.description
                }
              ])
            )
          },
          async (nodeData, inputs) => {
            try {
              // Execute the node's folder-based executor
              const result = await node.executor.execute(nodeData, inputs);
              
              // Format the result as a NodeExecutionData object
              return {
                items: Array.isArray(result) 
                  ? result.map(item => ({ json: item, text: JSON.stringify(item) }))
                  : [{ json: result, text: typeof result === 'string' ? result : JSON.stringify(result) }],
                meta: { startTime: new Date(), endTime: new Date() }
              };
            } catch (error) {
              console.error(`Error executing ${node.type} node with enhanced workflow engine:`, error);
              return {
                items: [{
                  json: { error: error instanceof Error ? error.message : String(error) },
                  text: error instanceof Error ? error.message : String(error)
                }],
                meta: { startTime: new Date(), endTime: new Date(), error: true }
              };
            }
          }
        )
      );
    }
  });
  
  console.log('Node executors registration complete');
}

// Register specific node executor
export function registerSingleNodeExecutor(nodeType: string): void {
  const node = getNode(nodeType);
  
  if (!node) {
    console.error(`Node type ${nodeType} not found in registry`);
    return;
  }
  
  if (node.executor && node.executor.execute) {
    console.log(`Registering executor for node type: ${nodeType}`);
    
    // Register with enhancedNodeExecutors
    registerNodeExecutor(nodeType, {
      execute: async (nodeData, inputs) => {
        try {
          // Execute the node's folder-based executor
          return await node.executor.execute(nodeData, inputs);
        } catch (error) {
          console.error(`Error executing ${nodeType} node:`, error);
          return {
            error: error instanceof Error ? error.message : String(error)
          };
        }
      }
    });
  }
}
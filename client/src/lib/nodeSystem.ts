/**
 * Node System
 * 
 * This module connects the folder-based node structure with the workflow execution engine.
 * It automatically discovers and registers node executors using dynamic imports.
 */

import { registerNodeExecutor } from './enhancedNodeExecutors';
import { registerEnhancedNodeExecutor, createEnhancedNodeExecutor } from './enhancedWorkflowEngine';

// List of known node types that are implemented in the folder-based system
const FOLDER_BASED_NODE_TYPES = [
  'text_input',
  'claude',
  'http_request',
  'text_template',
  'data_transform',
  'decision',
  'function',
  'json_path'
];

/**
 * Register all node executors from the folder-based node registry
 * This dynamically imports node modules from their folders and registers them
 */
export function registerNodeExecutorsFromRegistry(): void {
  console.log('Registering node executors from folder-based registry...');
  
  // Register each node by dynamically importing it
  FOLDER_BASED_NODE_TYPES.forEach(nodeType => {
    try {
      // Dynamically import the node's executor
      import(/* @vite-ignore */ `../nodes/${nodeType}/executor.ts`).then(executor => {
        if (executor && executor.execute) {
          console.log(`Registering executor for node type: ${nodeType}`);
          
          // Register with enhancedNodeExecutors
          registerNodeExecutor(nodeType, async (nodeData: any, inputs: any) => {
            try {
              // Execute the node's folder-based executor
              return await executor.execute(nodeData, inputs);
            } catch (error) {
              console.error(`Error executing ${nodeType} node:`, error);
              return {
                error: error instanceof Error ? error.message : String(error)
              };
            }
          });
          
          // Also import the node's definition for enhanced workflow engine registration
          import(/* @vite-ignore */ `../nodes/${nodeType}/definition.ts`).then(definition => {
            if (definition && definition.default) {
              const nodeDefinition = definition.default;
              
              // Register with enhancedWorkflowEngine
              registerEnhancedNodeExecutor(
                nodeType,
                createEnhancedNodeExecutor(
                  {
                    type: nodeType,
                    displayName: nodeDefinition.name || nodeType,
                    description: nodeDefinition.description || '',
                    icon: 'bolt',
                    category: nodeDefinition.category || 'general',
                    version: nodeDefinition.version || '1.0.0',
                    inputs: Object.fromEntries(
                      Object.entries(nodeDefinition.inputs || {}).map(([key, value]: [string, any]) => [
                        key,
                        {
                          type: value.type || 'string',
                          displayName: key,
                          description: value.description || '',
                          required: value.optional ? !value.optional : true
                        }
                      ])
                    ),
                    outputs: Object.fromEntries(
                      Object.entries(nodeDefinition.outputs || {}).map(([key, value]: [string, any]) => [
                        key,
                        {
                          type: value.type || 'string',
                          displayName: key,
                          description: value.description || ''
                        }
                      ])
                    )
                  },
                  async (nodeData, inputs) => {
                    try {
                      // Execute the node's folder-based executor
                      const result = await executor.execute(nodeData, inputs);
                      
                      // Format the result as a NodeExecutionData object
                      return {
                        items: Array.isArray(result) 
                          ? result.map(item => ({ json: item, text: JSON.stringify(item) }))
                          : [{ json: result, text: typeof result === 'string' ? result : JSON.stringify(result) }],
                        meta: { startTime: new Date(), endTime: new Date() }
                      };
                    } catch (error) {
                      console.error(`Error executing ${nodeType} node with enhanced workflow engine:`, error);
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
              
              console.log(`Registered enhanced node executor for type: ${nodeType}`);
            }
          }).catch(error => {
            console.error(`Error importing definition for node type ${nodeType}:`, error);
          });
        }
      }).catch(error => {
        console.error(`Error importing executor for node type ${nodeType}:`, error);
      });
    } catch (error) {
      console.error(`Failed to register node type ${nodeType}:`, error);
    }
  });
  
  console.log('Node executors registration complete');
}
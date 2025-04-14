/**
 * Node System
 * 
 * This module connects the folder-based node structure with the workflow execution engine.
 * It automatically discovers and registers node executors using dynamic imports.
 */

import { registerEnhancedNodeExecutor, createEnhancedNodeExecutor } from './enhancedWorkflowEngine';
import { validateNodeDefinition } from './nodeValidation';

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
  
  // Track missing node definitions or executors for reporting
  const missingComponents: Record<string, string[]> = {};
  
  // Register each node by dynamically importing it
  FOLDER_BASED_NODE_TYPES.forEach(nodeType => {
    try {
      // Dynamically import the node's executor
      import(/* @vite-ignore */ `../nodes/${nodeType}/executor`).then(executor => {
        if (executor && executor.execute) {
          // Also import the node's definition for enhanced workflow engine registration
          import(/* @vite-ignore */ `../nodes/${nodeType}/definition`).then(definition => {
            if (definition && definition.default) {
              const nodeDefinition = definition.default;
              
              // Validate the node definition
              const validationResult = validateNodeDefinition(nodeDefinition);
              
              if (!validationResult.valid) {
                console.warn(`Node definition for ${nodeType} has validation errors:`, validationResult.errors);
                if (missingComponents[nodeType]) {
                  missingComponents[nodeType].push(...validationResult.errors);
                } else {
                  missingComponents[nodeType] = validationResult.errors;
                }
              }
              
              if (validationResult.warnings.length > 0) {
                console.warn(`Node definition for ${nodeType} has validation warnings:`, validationResult.warnings);
              }
              
              console.log(`Registering executor for node type: ${nodeType}`);
              
              // Register with enhancedWorkflowEngine
              registerEnhancedNodeExecutor(
                nodeType,
                createEnhancedNodeExecutor(
                  {
                    type: nodeType,
                    displayName: nodeDefinition.name || nodeType,
                    description: nodeDefinition.description || '',
                    icon: nodeDefinition.icon || 'bolt',
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
            } else {
              if (missingComponents[nodeType]) {
                missingComponents[nodeType].push('Missing default export in definition');
              } else {
                missingComponents[nodeType] = ['Missing default export in definition'];
              }
              console.warn(`Invalid definition for node type ${nodeType}: Missing default export`);
            }
          }).catch(error => {
            if (missingComponents[nodeType]) {
              missingComponents[nodeType].push('Definition import error');
            } else {
              missingComponents[nodeType] = ['Definition import error'];
            }
            console.error(`Error importing definition for node type ${nodeType}:`, error);
          });
        } else {
          if (missingComponents[nodeType]) {
            missingComponents[nodeType].push('Missing execute function in executor');
          } else {
            missingComponents[nodeType] = ['Missing execute function in executor'];
          }
          console.warn(`Invalid executor for node type ${nodeType}: Missing execute function`);
        }
      }).catch(error => {
        if (missingComponents[nodeType]) {
          missingComponents[nodeType].push('Executor import error');
        } else {
          missingComponents[nodeType] = ['Executor import error'];
        }
        console.error(`Error importing executor for node type ${nodeType}:`, error);
      });
    } catch (error) {
      if (missingComponents[nodeType]) {
        missingComponents[nodeType].push('Registration error');
      } else {
        missingComponents[nodeType] = ['Registration error'];
      }
      console.error(`Failed to register node type ${nodeType}:`, error);
    }
  });
  
  // Report any missing components after a short delay to allow imports to complete
  setTimeout(() => {
    if (Object.keys(missingComponents).length > 0) {
      console.warn('Some folder-based node components could not be imported:', missingComponents);
    }
  }, 1000);
  
  console.log('Node executors registration complete');
}
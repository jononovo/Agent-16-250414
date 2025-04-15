/**
 * Node System
 * 
 * This module connects the folder-based node structure with the workflow execution engine.
 * It automatically discovers and registers node executors using dynamic imports.
 * All nodes (both System and Custom) use the same folder-based registry mechanism.
 */

import { registerEnhancedNodeExecutor, createEnhancedNodeExecutor } from './enhancedWorkflowEngine';
import { 
  FOLDER_BASED_NODE_TYPES, 
  SYSTEM_NODE_TYPES,
  CUSTOM_NODE_TYPES,
  validateNode, 
  getNodeExecutorPath, 
  getNodeDefinitionPath
} from './nodeValidator';

/**
 * Initialize the node system by registering all nodes
 */
export async function initializeNodeSystem(): Promise<void> {
  console.log('Initializing node system...');
  
  // Register all nodes from both System and Custom folders
  await discoverAndRegisterNodeExecutors();
  
  console.log('Folder-based node system initialized');
}

/**
 * Discover and register all node executors from both System and Custom folders
 */
async function discoverAndRegisterNodeExecutors(): Promise<void> {
  console.log('Registering node executors from folder-based registry...');
  
  // Track missing or invalid components
  const missingComponents: Record<string, string[]> = {};
  
  // Register the standard node types first
  FOLDER_BASED_NODE_TYPES.forEach(nodeType => {
    registerNodeType(nodeType, missingComponents);
  });
  
  // Then discover any additional nodes in the System and Custom folders
  try {
    // Dynamically import all definition files from System and Custom folders
    const systemDefinitionModules = import.meta.glob('../nodes/System/*/definition.ts', { eager: true });
    const customDefinitionModules = import.meta.glob('../nodes/Custom/*/definition.ts', { eager: true });
    
    // Process System folder node definitions
    for (const path in systemDefinitionModules) {
      const module = systemDefinitionModules[path] as any;
      const nodeDef = module.default as any;
      
      if (nodeDef && nodeDef.type && !FOLDER_BASED_NODE_TYPES.includes(nodeDef.type)) {
        // Add to CUSTOM_NODE_TYPES if it's not already there
        if (!CUSTOM_NODE_TYPES.includes(nodeDef.type)) {
          CUSTOM_NODE_TYPES.push(nodeDef.type);
        }
        
        // Register this node type
        registerNodeType(nodeDef.type, missingComponents);
      }
    }
    
    // Process Custom folder node definitions
    for (const path in customDefinitionModules) {
      const module = customDefinitionModules[path] as any;
      const nodeDef = module.default as any;
      
      if (nodeDef && nodeDef.type && !FOLDER_BASED_NODE_TYPES.includes(nodeDef.type)) {
        // Add to CUSTOM_NODE_TYPES if it's not already there
        if (!CUSTOM_NODE_TYPES.includes(nodeDef.type)) {
          CUSTOM_NODE_TYPES.push(nodeDef.type);
        }
        
        // Register this node type
        registerNodeType(nodeDef.type, missingComponents);
      }
    }
  } catch (error) {
    console.error('Error discovering node definitions:', error);
  }
  
  // Report any missing components after imports complete
  setTimeout(() => {
    if (Object.keys(missingComponents).length > 0) {
      console.warn('Some folder-based node components could not be imported:', missingComponents);
    }
  }, 1000);
  
  console.log('Node executors registration complete');
}

/**
 * Register all node executors from the folder-based node registry
 */
export function registerNodeExecutorsFromRegistry(): void {
  console.log('Starting node executor registration from folder-based registry...');
  // Call the new discovery and registration function
  discoverAndRegisterNodeExecutors();
}

/**
 * Register a single node type with the workflow engine
 */
async function registerNodeType(nodeType: string, missingComponents: Record<string, string[]>): Promise<void> {
  try {
    // Import executor
    const executorPath = getNodeExecutorPath(nodeType);
    import(/* @vite-ignore */ executorPath).then(executor => {
      if (!executor || !executor.execute) {
        recordMissingComponent(missingComponents, nodeType, 'Missing execute function in executor');
        console.warn(`Invalid executor for node type ${nodeType}: Missing execute function`);
        return;
      }
      
      // Import definition
      const definitionPath = getNodeDefinitionPath(nodeType);
      import(/* @vite-ignore */ definitionPath).then(definition => {
        if (!definition || !definition.default) {
          recordMissingComponent(missingComponents, nodeType, 'Missing default export in definition');
          console.warn(`Invalid definition for node type ${nodeType}: Missing default export`);
          return;
        }
        
        const nodeDefinition = definition.default;
        
        // Validate node definition
        const validationResult = validateNode(nodeDefinition);
        if (!validationResult.valid) {
          validationResult.errors.forEach(error => {
            recordMissingComponent(missingComponents, nodeType, error);
          });
          console.warn(`Node definition for ${nodeType} has validation errors:`, validationResult.errors);
        }
        
        if (validationResult.warnings.length > 0) {
          console.warn(`Node definition for ${nodeType} has validation warnings:`, validationResult.warnings);
        }
        
        console.log(`Registering executor for node type: ${nodeType}`);
        
        // Register with workflow engine
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
              inputs: formatPortDefinitions(nodeDefinition.inputs || {}, true),
              outputs: formatPortDefinitions(nodeDefinition.outputs || {}, false)
            },
            createNodeExecutor(nodeType, executor)
          )
        );
        
        console.log(`Registered enhanced node executor for type: ${nodeType}`);
      }).catch(error => {
        recordMissingComponent(missingComponents, nodeType, 'Definition import error');
        console.error(`Error importing definition for node type ${nodeType}:`, error);
      });
    }).catch(error => {
      recordMissingComponent(missingComponents, nodeType, 'Executor import error');
      console.error(`Error importing executor for node type ${nodeType}:`, error);
    });
  } catch (error) {
    recordMissingComponent(missingComponents, nodeType, 'Registration error');
    console.error(`Failed to register node type ${nodeType}:`, error);
  }
}

/**
 * Format port definitions for the workflow engine
 */
function formatPortDefinitions(ports: Record<string, any>, isInput: boolean): Record<string, any> {
  return Object.fromEntries(
    Object.entries(ports).map(([key, value]: [string, any]) => [
      key,
      {
        type: value.type || 'string',
        displayName: key,
        description: value.description || '',
        ...(isInput ? { required: value.optional ? !value.optional : true } : {})
      }
    ])
  );
}

/**
 * Create a node executor function that handles errors
 */
function createNodeExecutor(nodeType: string, executor: any) {
  return async (nodeData: any, inputs: Record<string, any>) => {
    try {
      // Execute the node
      const result = await executor.execute(nodeData, inputs);
      
      // Format the result
      return {
        items: Array.isArray(result) 
          ? result.map(item => ({ json: item, text: JSON.stringify(item) }))
          : [{ json: result, text: typeof result === 'string' ? result : JSON.stringify(result) }],
        meta: { startTime: new Date(), endTime: new Date() }
      };
    } catch (error) {
      console.error(`Error executing ${nodeType} node:`, error);
      return {
        items: [{
          json: { error: error instanceof Error ? error.message : String(error) },
          text: error instanceof Error ? error.message : String(error)
        }],
        meta: { startTime: new Date(), endTime: new Date(), error: true }
      };
    }
  };
}

/**
 * Record a missing or invalid component
 */
function recordMissingComponent(
  missingComponents: Record<string, string[]>, 
  nodeType: string, 
  issue: string
): void {
  if (missingComponents[nodeType]) {
    missingComponents[nodeType].push(issue);
  } else {
    missingComponents[nodeType] = [issue];
  }
}
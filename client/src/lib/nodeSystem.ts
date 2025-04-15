/**
 * Node System
 * 
 * This module connects the folder-based node structure with the workflow execution engine.
 * It automatically discovers and registers node executors using dynamic imports.
 * It also loads custom node types from the database.
 */

import { registerEnhancedNodeExecutor, createEnhancedNodeExecutor } from './enhancedWorkflowEngine';
import { 
  FOLDER_BASED_NODE_TYPES, 
  CUSTOM_NODE_TYPES,
  validateNode, 
  getNodeExecutorPath, 
  getNodeDefinitionPath,
  registerCustomNodeTypes
} from './nodeValidator';

/**
 * Initialize the node system by registering folder-based nodes and loading custom nodes
 */
export async function initializeNodeSystem(): Promise<void> {
  console.log('Initializing node system...');
  
  // First register folder-based nodes
  registerNodeExecutorsFromRegistry();
  
  // Then load custom nodes from the API
  await loadCustomNodesFromAPI();
  
  console.log('Folder-based node system initialized');
}

/**
 * Register all node executors from the folder-based node registry
 */
export function registerNodeExecutorsFromRegistry(): void {
  console.log('Registering node executors from folder-based registry...');
  
  // Track missing or invalid components
  const missingComponents: Record<string, string[]> = {};
  
  // Register each node type
  FOLDER_BASED_NODE_TYPES.forEach(nodeType => {
    registerNodeType(nodeType, missingComponents);
  });
  
  // Report any missing components after imports complete
  setTimeout(() => {
    if (Object.keys(missingComponents).length > 0) {
      console.warn('Some folder-based node components could not be imported:', missingComponents);
    }
  }, 1000);
  
  console.log('Node executors registration complete');
}

/**
 * Load custom node types from the API
 */
export async function loadCustomNodesFromAPI(): Promise<void> {
  try {
    // Fetch custom node types from the API
    const response = await fetch('/api/nodes/custom-types');
    if (!response.ok) {
      console.warn('Failed to load custom node types:', response.statusText);
      return;
    }
    
    const data = await response.json();
    
    // Register the custom node types
    if (data.customNodeTypes && Array.isArray(data.customNodeTypes) && data.customNodeTypes.length > 0) {
      registerCustomNodeTypes(data.customNodeTypes);
      console.log(`Loaded ${data.customNodeTypes.length} custom node types:`, data.customNodeTypes);
      
      // Load custom node details from API
      await Promise.all(
        data.customNodeTypes.map(async (nodeType: string) => {
          try {
            // Get node details for each custom type
            const nodeResponse = await fetch(`/api/nodes?type=${nodeType}`);
            if (!nodeResponse.ok) {
              console.warn(`Failed to load details for custom node type ${nodeType}`);
              return;
            }
            
            const nodeData = await nodeResponse.json();
            if (Array.isArray(nodeData) && nodeData.length > 0) {
              // Use the first node of this type as the definition
              const nodeDefinition = nodeData[0];
              
              // Register the custom node with the function we export
              registerCustomNodeTypeExecutor(nodeType, nodeDefinition);
            }
          } catch (error) {
            console.error(`Error loading custom node type ${nodeType}:`, error);
          }
        })
      );
    }
  } catch (error) {
    console.error('Error loading custom node types:', error);
  }
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
 * Register a custom node type with the workflow engine
 */
export function registerCustomNodeTypeExecutor(nodeType: string, nodeDefinition: any): void {
  try {
    console.log(`Registering custom node type: ${nodeType}`);
    
    // Create a simple executor for the custom node
    const customExecutor = {
      execute: async (nodeData: any, inputs: Record<string, any>) => {
        try {
          // If the node has an implementation field, try to eval it (with caution!)
          if (nodeDefinition.implementation) {
            // Create a safe execution context
            const safeExecutionContext = {
              nodeData,
              inputs,
              console,
              // Add safe globals here, like fetch
              fetch
            };
            
            // Function to safely execute the implementation
            const executeImplementation = new Function(
              ...Object.keys(safeExecutionContext),
              `try { ${nodeDefinition.implementation} } catch (error) { return { error: error.message }; }`
            );
            
            // Execute the implementation with safe context
            return executeImplementation(...Object.values(safeExecutionContext));
          }
          
          // Default behavior if no implementation is provided
          return { 
            output: "Custom node executed (no implementation provided)",
            inputs 
          };
        } catch (error) {
          console.error(`Error executing custom node ${nodeType}:`, error);
          return { error: error instanceof Error ? error.message : String(error) };
        }
      }
    };
    
    // Parse inputs and outputs from the node definition
    const inputs = typeof nodeDefinition.inputs === 'string' 
      ? JSON.parse(nodeDefinition.inputs) 
      : (nodeDefinition.inputs || {});
      
    const outputs = typeof nodeDefinition.outputs === 'string'
      ? JSON.parse(nodeDefinition.outputs)
      : (nodeDefinition.outputs || {});
    
    // Register with workflow engine
    registerEnhancedNodeExecutor(
      nodeType,
      createEnhancedNodeExecutor(
        {
          type: nodeType,
          displayName: nodeDefinition.name || nodeType,
          description: nodeDefinition.description || 'Custom node',
          icon: nodeDefinition.icon || 'code',
          category: nodeDefinition.category || 'custom',
          version: nodeDefinition.version || '1.0.0',
          inputs: formatPortDefinitions(inputs, true),
          outputs: formatPortDefinitions(outputs, false)
        },
        createNodeExecutor(nodeType, customExecutor)
      )
    );
    
    console.log(`Registered custom node type: ${nodeType}`);
  } catch (error) {
    console.error(`Failed to register custom node type ${nodeType}:`, error);
  }
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
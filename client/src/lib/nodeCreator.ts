/**
 * Node Creator Utility
 * 
 * This module provides utilities for creating new custom nodes and adding them
 * to the system. It handles generating the necessary files in the correct directory
 * structure and registering the new node with the node system.
 */

import { NodeDefinition } from '../nodes/types';

/**
 * Interface for a node template (includes code for both definition and executor)
 */
interface NodeTemplate {
  definition: string;
  executor: string;
}

/**
 * Create a new custom node in the Custom folder
 * 
 * @param nodeType The unique identifier for the node type (e.g., 'json_parser')
 * @param definition The node definition object
 * @param executorCode Optional custom executor code (if not provided, a default one will be generated)
 * @returns Promise that resolves when the node has been created
 */
export async function createCustomNode(
  nodeType: string, 
  definition: NodeDefinition, 
  executorCode?: string
): Promise<boolean> {
  try {
    // Generate the template code
    const template = generateNodeTemplate(nodeType, definition, executorCode);
    
    // Save the files to the Custom folder
    // Note: In a browser context, we need to use the server to save these files
    const saveResult = await saveNodeFiles(nodeType, template);
    
    // Update the node registry - this will happen automatically on the next page load
    // but we could add explicit registration here if needed
    
    return saveResult;
  } catch (error) {
    console.error(`Error creating custom node ${nodeType}:`, error);
    return false;
  }
}

/**
 * Generate template code for a new node
 */
function generateNodeTemplate(
  nodeType: string, 
  definition: NodeDefinition,
  executorCode?: string
): NodeTemplate {
  // Generate the definition file content
  const definitionCode = `/**
 * ${definition.name} Node Definition
 * Defines the node's properties, appearance, and behavior
 */

import { NodeDefinition } from '../../types';

export const definition: NodeDefinition = ${JSON.stringify(definition, null, 2)};

export default definition;`;

  // Generate or use the provided executor code
  const defaultExecutorCode = `/**
 * ${definition.name} Node Executor
 * 
 * This file contains the logic for executing the ${nodeType} node.
 */

export const execute = async (nodeData: any, inputs: any = {}): Promise<any> => {
  try {
    // Your custom node logic here
    console.log('Executing ${nodeType} node with data:', nodeData);
    console.log('Input data:', inputs);
    
    // Return a simple result
    return {
      output: "Custom node executed successfully",
      nodeData,
      inputs
    };
  } catch (error: any) {
    // Handle errors
    return {
      error: error.message || 'Error executing ${nodeType} node'
    };
  }
};`;

  return {
    definition: definitionCode,
    executor: executorCode || defaultExecutorCode
  };
}

/**
 * Save node files to the appropriate directories via the server API
 */
async function saveNodeFiles(nodeType: string, template: NodeTemplate): Promise<boolean> {
  try {
    // Call the API endpoint to create the node files
    const result = await fetch('/api/nodes/custom', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nodeType,
        definition: template.definition,
        executor: template.executor
      })
    });
    
    if (!result.ok) {
      const errorData = await result.json();
      console.error('Server error creating custom node:', errorData);
      return false;
    }
    
    const data = await result.json();
    console.log('Custom node created successfully:', data);
    
    // For UI purposes, we might want to register the node type immediately
    // This avoids having to reload the page to see the new node
    import('./nodeValidator').then(validator => {
      validator.registerCustomNodeType(nodeType);
    });
    
    return true;
  } catch (error) {
    console.error('Error saving node files:', error);
    return false;
  }
}

/**
 * Example usage of the node creator
 */
export function createExampleJSONParserNode(): void {
  const jsonParserDefinition: NodeDefinition = {
    type: 'json_parser',
    name: 'JSON Parser',
    description: 'Parses JSON strings into structured data objects',
    icon: 'braces',
    category: 'data',
    version: '1.0.0',
    inputs: {
      json_string: {
        type: 'string',
        description: 'The JSON string to parse'
      }
    },
    outputs: {
      parsed_data: {
        type: 'object',
        description: 'The parsed JSON object'
      },
      error: {
        type: 'string',
        description: 'Error message if parsing fails',
        optional: true
      }
    },
    configOptions: [
      {
        key: 'returnErrorObject',
        type: 'boolean',
        default: false,
        description: 'Return error as an object with error property instead of failing'
      }
    ],
    defaultData: {
      returnErrorObject: false
    }
  };
  
  createCustomNode('json_parser', jsonParserDefinition);
}
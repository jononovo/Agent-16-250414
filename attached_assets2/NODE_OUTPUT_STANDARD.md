# Standardized Node Output Format Implementation Plan

This document outlines a detailed technical implementation plan to standardize node output formats across our workflow system, ensuring all nodes follow the same output structure pattern for improved reliability and interoperability.

## 1. Update Helper Functions (client/src/lib/utils/nodeOutputs.ts)

First, create a new utility file with standardized helper functions:

```typescript
/**
 * Node Output Utilities
 * 
 * Standardized helpers for creating consistent node outputs
 */

import { WorkflowItem, NodeExecutionData } from '../types/workflow';

/**
 * Creates a standardized workflow item from any data
 * 
 * @param data - The data to wrap in a workflow item
 * @param source - Source identifier (node type, operation, etc)
 * @param options - Additional options for the workflow item
 * @returns A properly formatted WorkflowItem
 */
export function createWorkflowItem(
  data: any,
  source: string = 'unknown',
  options?: {
    binary?: {
      mimeType: string;
      data: string;
      filename?: string;
    };
    outputType?: string;
    context?: Record<string, any>;
  }
): WorkflowItem {
  return {
    json: data,
    text: typeof data === 'string' ? data : JSON.stringify(data),
    meta: {
      source,
      timestamp: new Date(),
      outputType: options?.outputType,
      context: options?.context
    },
    binary: options?.binary
  };
}

/**
 * Creates a standardized node execution result
 * 
 * @param data - Data or array of data items to include
 * @param options - Additional metadata and options
 * @returns A properly formatted NodeExecutionData object
 */
export function createNodeOutput(
  data: any | any[],
  options: {
    source?: string;
    error?: boolean;
    errorMessage?: string;
    startTime?: Date;
    itemsProcessed?: number;
    additionalMeta?: Record<string, any>;
  } = {}
): NodeExecutionData {
  const startTime = options.startTime || new Date();
  const endTime = new Date();
  
  // Convert data to array if it's not already
  const dataArray = Array.isArray(data) ? data : [data];
  
  // Convert each item to a WorkflowItem
  const items = dataArray.map(item => 
    // If item is already a WorkflowItem, use it, otherwise create a new one
    (item && typeof item === 'object' && 'json' in item) 
      ? item as WorkflowItem
      : createWorkflowItem(item, options.source || 'node')
  );
  
  return {
    items,
    meta: {
      startTime,
      endTime,
      itemsProcessed: options.itemsProcessed || items.length,
      error: options.error || false,
      errorMessage: options.error ? options.errorMessage : undefined,
      ...options.additionalMeta
    }
  };
}

/**
 * Creates a standardized error output
 * 
 * @param error - Error object or message
 * @param source - Source of the error
 * @param additionalMeta - Any additional metadata
 * @returns A properly formatted error NodeExecutionData
 */
export function createErrorOutput(
  error: Error | string,
  source: string = 'node',
  additionalMeta: Record<string, any> = {}
): NodeExecutionData {
  const errorMessage = error instanceof Error ? error.message : error;
  
  return createNodeOutput(
    { error: errorMessage },
    {
      source,
      error: true,
      errorMessage,
      additionalMeta
    }
  );
}

/**
 * Validates that a node output matches the expected format
 * 
 * @param output - The output to validate
 * @returns The validated output or a standardized error if invalid
 */
export function validateNodeOutput(output: any): NodeExecutionData {
  try {
    // If it's already in the correct format, return it
    if (output && 
        typeof output === 'object' && 
        'items' in output && 
        Array.isArray(output.items) && 
        'meta' in output &&
        typeof output.meta === 'object') {
      
      // Ensure each item has at least a json property
      const validItems = output.items.every(
        item => item && typeof item === 'object' && 'json' in item
      );
      
      if (validItems) {
        return output as NodeExecutionData;
      }
    }
    
    // If it's a simple object with result property (common pattern in current nodes)
    if (output && typeof output === 'object' && 'result' in output) {
      return createNodeOutput(output.result);
    }
    
    // If it's just raw data, wrap it properly
    return createNodeOutput(output);
  } catch (error) {
    // If anything goes wrong during validation, return a standardized error
    return createErrorOutput(
      `Invalid node output format: ${error instanceof Error ? error.message : String(error)}`,
      'validation'
    );
  }
}
```

## 2. Update Node Types Definition (client/src/nodes/types.ts)

Ensure our node types file has the proper definitions:

```typescript
// Update the existing types in client/src/nodes/types.ts

/**
 * Workflow Item
 * The basic unit of data passed between nodes
 */
export interface WorkflowItem {
  json: any;              // The actual data
  text?: string;          // Text representation
  meta?: {
    source?: string;      // Data source
    timestamp?: Date;     // Creation time
    outputType?: string;  // For multi-output nodes
    context?: Record<string, any>;  // Additional metadata
  };
  binary?: {              // For binary data (images, files, etc.)
    mimeType: string;
    data: string;
    filename?: string;
    size?: number;        // Size in bytes
    chunkIndex?: number;  // For chunked files
    totalChunks?: number; // For chunked files
  };
}

/**
 * Node Execution Data
 * Output data structure from node execution
 */
export interface NodeExecutionData {
  items: WorkflowItem[];  // Output data items
  meta: {
    startTime: Date;      // When execution started
    endTime?: Date;       // When execution completed
    itemsProcessed?: number;  // Processing count
    sourceOperation?: string; // Source operation 
    error?: boolean;      // Whether an error occurred
    errorMessage?: string; // Error details if applicable
    [key: string]: any;   // Additional metadata
  };
}

/**
 * Enhanced Node Executor
 * Interface for node executor implementations
 */
export interface EnhancedNodeExecutor {
  definition?: any;       // Node definition reference
  execute: (              // Execution function
    nodeData: Record<string, any>, 
    inputs: Record<string, NodeExecutionData>
  ) => Promise<NodeExecutionData>;
}
```

## 3. Update Enhanced Workflow Engine (client/src/lib/enhancedWorkflowEngine.ts)

Add the validation and standardization to the workflow engine:

```typescript
// Import the new utilities
import { validateNodeOutput } from './utils/nodeOutputs';

// Update the existing executeNode function to enforce standardization
export async function executeNode(
  nodeType: string,
  nodeData: any,
  inputs: Record<string, NodeExecutionData>
): Promise<NodeExecutionData> {
  try {
    // Get the node executor
    const executor = nodeRegistry[nodeType];
    if (!executor) {
      throw new Error(`No executor registered for node type ${nodeType}`);
    }
    
    // Execute the node
    const rawResult = await executor.execute(nodeData, inputs);
    
    // Validate and standardize the output
    const standardizedResult = validateNodeOutput(rawResult);
    
    // Add node type to the metadata
    standardizedResult.meta.nodeType = nodeType;
    
    console.log(`Executed node ${nodeType} with standardized output`);
    return standardizedResult;
  } catch (error) {
    console.error(`Error executing node ${nodeType}:`, error);
    
    // Use our utility for error output
    return createErrorOutput(
      error instanceof Error ? error.message : String(error),
      nodeType
    );
  }
}
```

## 4. Update Node Implementations

Here's how to update each type of node to use the standardized format:

### 4.1 Update Data Transform Node (client/src/nodes/data_transform/executor.ts)

```typescript
/**
 * Data Transform Node Executor
 */
import { createNodeOutput, createErrorOutput } from '../../lib/utils/nodeOutputs';
import { NodeExecutionData } from '../../types/workflow';

// Define the shape of a transformation
export interface Transformation {
  name: string;
  expression: string;
  enabled: boolean;
}

// Define the shape of the node's data
export interface DataTransformNodeData {
  transformations: Transformation[];
}

/**
 * Execute the data transform node with the provided data and inputs
 */
export async function execute(
  nodeData: DataTransformNodeData, 
  inputs: Record<string, NodeExecutionData> = {}
): Promise<NodeExecutionData> {
  const startTime = new Date();
  const { transformations } = nodeData;
  
  // Extract input data from the standardized input format
  const inputItems = inputs.data?.items || [];
  const inputData = inputItems.length > 0 ? inputItems[0].json : undefined;
  
  try {
    if (inputData === undefined) {
      return createErrorOutput('No input data provided', 'data_transform');
    }
    
    if (!transformations || transformations.length === 0) {
      return createNodeOutput(
        inputData, 
        {
          source: 'data_transform',
          additionalMeta: { warning: 'No transformations defined' },
          startTime
        }
      );
    }
    
    // Apply each enabled transformation in sequence
    let currentData = inputData;
    const enabledTransformations = transformations.filter(t => t.enabled);
    
    for (const transform of enabledTransformations) {
      try {
        // Create a function from the expression string
        const transformFunction = new Function('data', transform.expression);
        
        // Execute the transformation
        currentData = transformFunction(currentData);
        
      } catch (transformError) {
        return createNodeOutput(
          currentData, // Return data up to the point of failure
          {
            source: 'data_transform',
            error: true,
            errorMessage: `Error in transformation "${transform.name}": ${
              transformError instanceof Error ? transformError.message : String(transformError)
            }`,
            startTime
          }
        );
      }
    }
    
    // Return the transformed data in the standardized format
    return createNodeOutput(
      currentData,
      {
        source: 'data_transform',
        startTime,
        itemsProcessed: enabledTransformations.length,
        additionalMeta: {
          transformationsApplied: enabledTransformations.map(t => t.name)
        }
      }
    );
  } catch (error) {
    console.error('Error executing data transform:', error);
    return createErrorOutput(
      error instanceof Error ? error.message : String(error),
      'data_transform',
      { startTime }
    );
  }
}
```

### 4.2 Update Text Input Node (client/src/nodes/text_input/executor.ts)

```typescript
/**
 * Text Input Node Executor
 */
import { createNodeOutput, createErrorOutput } from '../../lib/utils/nodeOutputs';
import { NodeExecutionData } from '../../types/workflow';

export interface TextInputNodeData {
  inputText?: string;
}

export const execute = async (
  nodeData: TextInputNodeData,
  inputs?: any
): Promise<NodeExecutionData> => {
  const startTime = new Date();
  
  try {
    // Get the input text from the node data
    const inputText = nodeData.inputText || '';
    
    // Return standardized output
    return createNodeOutput(
      { text: inputText },
      {
        source: 'text_input',
        startTime,
        additionalMeta: {
          characterCount: inputText.length
        }
      }
    );
  } catch (error: any) {
    // Handle errors with standardized format
    return createErrorOutput(
      error.message || 'Error processing text input',
      'text_input',
      { startTime }
    );
  }
};
```

### 4.3 Update Claude Node (client/src/nodes/claude/executor.ts)

```typescript
/**
 * Claude Node Executor
 */
import { createNodeOutput, createErrorOutput } from '../../lib/utils/nodeOutputs';
import { NodeExecutionData } from '../../types/workflow';

export interface ClaudeNodeData {
  prompt?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  apiKey?: string;
}

export const execute = async (
  nodeData: ClaudeNodeData,
  inputs: Record<string, NodeExecutionData> = {}
): Promise<NodeExecutionData> => {
  const startTime = new Date();
  
  try {
    // Simple and direct input handling optimized for text_input node connections
    let promptInput = '';
    
    // Extract input from the standardized format
    if (inputs?.prompt) {
      const promptItems = inputs.prompt.items || [];
      if (promptItems.length > 0) {
        const promptData = promptItems[0].json;
        
        // Handle different input formats
        if (typeof promptData === 'string') {
          promptInput = promptData;
        } else if (promptData && typeof promptData === 'object') {
          // If it's an object, look for common text properties
          promptInput = promptData.text || promptData.content || promptData.prompt || '';
        }
      }
    }
    
    // If we have a directly configured prompt in the node UI, use that instead
    const prompt = nodeData.prompt || promptInput || '';
    const model = nodeData.model || 'claude-3-haiku-20240307';
    const temperature = nodeData.temperature !== undefined ? nodeData.temperature : 0.7;
    const maxTokens = nodeData.maxTokens || 1000;
    const systemPrompt = nodeData.systemPrompt || '';
    
    // Check if we have a prompt
    if (!prompt) {
      return createErrorOutput('No prompt provided to Claude', 'claude', { startTime });
    }
    
    // Look for API key in this order:
    // 1. Node data (user entered in UI)
    // 2. Server environment (via API config endpoint)
    let claudeApiKey = nodeData.apiKey || '';
    let useServerProxy = false;
    
    // If no API key in node data, try to get from server config
    if (!claudeApiKey) {
      try {
        // Fetch the API key from server config
        const configResponse = await fetch('/api/config');
        if (configResponse.ok) {
          const config = await configResponse.json();
          claudeApiKey = config.claudeApiKey;
          
          // If we still don't have an API key but server has a proxy, use that
          if (!claudeApiKey && config.claudeProxyEnabled) {
            useServerProxy = true;
          }
        }
      } catch (configError) {
        console.error('Error fetching API config:', configError);
      }
    }
    
    // If we don't have an API key and can't use server proxy, return error
    if (!claudeApiKey && !useServerProxy) {
      return createErrorOutput(
        'Claude API key is required. Please add it in the node configuration.',
        'claude',
        { startTime }
      );
    }
    
    try {
      let data;
      
      if (useServerProxy) {
        // Use server proxy endpoint
        const proxyResponse = await fetch('/api/proxy/claude', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt,
            model,
            temperature,
            maxTokens,
            systemPrompt
          })
        });
        
        if (!proxyResponse.ok) {
          throw new Error(`Server proxy error: ${proxyResponse.statusText}`);
        }
        
        data = await proxyResponse.json();
      } else {
        // Direct API call to Claude
        const apiResponse = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': claudeApiKey,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model,
            max_tokens: maxTokens,
            temperature,
            system: systemPrompt,
            messages: [
              {
                role: 'user',
                content: prompt
              }
            ]
          })
        });
        
        if (!apiResponse.ok) {
          throw new Error(`Claude API error: ${apiResponse.statusText}`);
        }
        
        data = await apiResponse.json();
      }
      
      // Return standardized output
      return createNodeOutput(
        {
          response: data.content && data.content[0]?.text || '',
          fullResponse: data
        },
        {
          source: 'claude',
          startTime,
          additionalMeta: {
            model,
            promptLength: prompt.length,
            responseLength: data.content && data.content[0]?.text.length || 0
          }
        }
      );
    } catch (apiError: any) {
      console.error('Claude API error:', apiError);
      return createErrorOutput(
        `Claude API error: ${apiError.message || 'Unknown error'}`,
        'claude',
        { startTime }
      );
    }
  } catch (error: any) {
    // Handle general errors
    return createErrorOutput(
      error.message || 'Error executing Claude node',
      'claude',
      { startTime }
    );
  }
};
```

## 5. Create a Node Output Validator (client/src/lib/nodeValidator.ts)

Add a validation function in the node validation system:

```typescript
// Add this to the existing nodeValidator.ts file

/**
 * Validates a node output against the expected format
 */
export function validateNodeOutput(output: any): string[] {
  const errors: string[] = [];
  
  if (!output) {
    errors.push('Node output is null or undefined');
    return errors;
  }
  
  if (typeof output !== 'object') {
    errors.push(`Node output must be an object, got ${typeof output}`);
    return errors;
  }
  
  // Check for required 'items' array
  if (!('items' in output)) {
    errors.push('Node output must have an "items" property');
  } else if (!Array.isArray(output.items)) {
    errors.push('Node output "items" must be an array');
  }
  
  // Check for required 'meta' object
  if (!('meta' in output)) {
    errors.push('Node output must have a "meta" property');
  } else if (typeof output.meta !== 'object' || output.meta === null) {
    errors.push('Node output "meta" must be an object');
  } else {
    // Check for required 'startTime' in meta
    if (!('startTime' in output.meta)) {
      errors.push('Node output meta must include "startTime"');
    }
  }
  
  // Check each item format
  if (Array.isArray(output.items)) {
    output.items.forEach((item, index) => {
      if (!item || typeof item !== 'object') {
        errors.push(`Item at index ${index} must be an object`);
      } else if (!('json' in item)) {
        errors.push(`Item at index ${index} must have a "json" property`);
      }
    });
  }
  
  return errors;
}
```

## 6. Documentation Update (client/src/nodes/README.md)

Create or update the node system documentation:

```markdown
# Node Output Format Standard

All nodes in our workflow system must follow this standardized output format to ensure consistent data flow and compatibility.

## Standard Output Format

Every node executor must return a `NodeExecutionData` object with this structure:

```typescript
{
  items: [
    {
      json: any,           // The actual output data
      text?: string,       // Optional text representation
      meta?: {             // Optional metadata about this item
        source?: string,
        timestamp?: Date,
        outputType?: string,
        context?: Record<string, any>
      },
      binary?: {           // For binary data like files
        mimeType: string,
        data: string,      // Usually base64 encoded
        filename?: string,
        size?: number      // Size in bytes
      }
    }
    // ... more items if needed
  ],
  meta: {
    startTime: Date,       // When execution started (required)
    endTime?: Date,        // When execution completed (recommended)
    itemsProcessed?: number,  // Count of items processed
    error?: boolean,       // Whether an error occurred
    errorMessage?: string, // Error details if applicable
    // ... additional metadata specific to the node
  }
}
```

## Utility Functions

Use the helper functions from `client/src/lib/utils/nodeOutputs.ts` to create standardized outputs:

1. `createNodeOutput(data, options)` - Creates a standard output from any data
2. `createErrorOutput(error, source, meta)` - Creates a standard error output
3. `createWorkflowItem(data, source, options)` - Creates a workflow item from any data

## Binary Data Guidelines

When working with binary data (files, images, etc.):

1. Use the `binary` field in `WorkflowItem`
2. For files over 1MB, consider chunking (using `chunkIndex` and `totalChunks`)
3. Always include `mimeType` to help receiving nodes process the data correctly

## Error Handling

Always wrap node execution in try/catch and use `createErrorOutput` for any errors:

```typescript
try {
  // Node execution logic
} catch (error) {
  return createErrorOutput(
    error instanceof Error ? error.message : String(error),
    'my_node_type'
  );
}
```

## Testing Your Outputs

Use `validateNodeOutput` from node validator to verify your node's output format:

```typescript
const output = myNodeExecutor(nodeData, inputs);
const validationErrors = validateNodeOutput(output);
if (validationErrors.length > 0) {
  console.error('Invalid node output:', validationErrors);
}
```
```
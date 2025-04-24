/**
 * Function Node Definition
 * 
 * This file defines the metadata and schema for the Function node.
 */

import { NodeDefinition } from '../../types';

// Define node definition
const definition: NodeDefinition = {
  type: 'function',
  name: 'Function',
  description: 'Execute custom JavaScript functions',
  category: 'code',
  version: '1.1.0',
  icon: 'code',
  
  inputs: {
    data: {
      type: 'object',
      description: 'Input data to process with the function'
    }
  },
  
  outputs: {
    result: {
      type: 'any',
      description: 'The result returned by the function'
    },
    error: {
      type: 'string',
      description: 'Error message if function execution failed'
    }
  },
  
  configOptions: [
    {
      key: 'functionBody',
      type: 'string',
      description: 'JavaScript function body (will be wrapped in an async function)',
      default: 'return data;'
    },
    {
      key: 'timeout',
      type: 'number',
      description: 'Maximum execution time in milliseconds',
      default: 5000
    },
    {
      key: 'useAsyncFunction',
      type: 'boolean',
      description: 'Whether to execute the function asynchronously',
      default: true
    },
    {
      key: 'errorHandling',
      type: 'select',
      description: 'How to handle errors in the function',
      options: [
        { label: 'Throw error', value: 'throw' },
        { label: 'Return error object', value: 'return' },
        { label: 'Return null on error', value: 'null' }
      ],
      default: 'throw'
    },
    {
      key: 'selectedTemplate',
      type: 'select',
      description: 'Function template to use (will replace current code)',
      options: [
        { label: 'Basic (return input)', value: 'basic' },
        { label: 'Data Transform', value: 'transform' },
        { label: 'API Request', value: 'api' },
        { label: 'JSON Processing', value: 'json' },
        { label: 'Conditional Logic', value: 'conditional' }
      ],
      default: 'basic'
    },
    {
      key: 'enableAdvancedOptions',
      type: 'boolean',
      description: 'Show advanced configuration options',
      default: false
    },
    {
      key: 'executionEnvironment',
      type: 'select',
      description: 'Where to execute the function (client vs server)',
      options: [
        { label: 'Client-side', value: 'client' },
        { label: 'Server-side', value: 'server' }
      ],
      default: 'client'
    },
    {
      key: 'cacheResults',
      type: 'boolean',
      description: 'Cache results for identical inputs',
      default: false
    }
  ],
  
  defaultData: {
    functionBody: 'return data;',
    timeout: 5000,
    useAsyncFunction: true,
    errorHandling: 'throw',
    selectedTemplate: 'basic',
    enableAdvancedOptions: false,
    executionEnvironment: 'client',
    cacheResults: false
  }
};

// Additional metadata for UI/rendering
export const nodeMetadata = {
  tags: ['code', 'function', 'javascript', 'custom', 'scripting'],
  color: '#2196F3',
  templateLibrary: {
    basic: `// Basic function that returns input data
return data;`,
    transform: `// Transform data from one format to another
const transformed = {
  id: data.id || Math.random().toString(36).substring(2, 9),
  title: data.name || data.title,
  description: data.summary || data.description || '',
  timestamp: new Date().toISOString(),
  processed: true
};

return transformed;`,
    api: `// Make API requests (browser-only, use server-side for private keys)
const response = await fetch('https://api.example.com/data', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
});

if (!response.ok) {
  throw new Error(\`API request failed: \${response.status}\`);
}

return await response.json();`,
    json: `// Process and validate JSON data
try {
  // Parse if string is provided
  const jsonData = typeof data === 'string' ? JSON.parse(data) : data;
  
  // Extract specific fields
  const { id, items = [], metadata = {} } = jsonData;
  
  // Process each item
  const processedItems = items.map(item => ({
    ...item,
    processed: true
  }));
  
  return {
    id,
    items: processedItems,
    metadata,
    itemCount: processedItems.length
  };
} catch (error) {
  throw new Error(\`JSON processing error: \${error.message}\`);
}`,
    conditional: `// Implement conditional logic to route data
if (!data) {
  return { status: 'error', message: 'No data provided' };
}

// Route based on data type
if (Array.isArray(data)) {
  return { 
    type: 'array',
    count: data.length,
    items: data
  };
} else if (typeof data === 'object') {
  return { 
    type: 'object',
    keys: Object.keys(data),
    values: Object.values(data),
    data
  };
} else {
  return { 
    type: typeof data,
    value: data
  };
}`
  }
};

export default definition;
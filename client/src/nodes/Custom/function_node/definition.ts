/**
 * Custom Function Node Definition
 * 
 * This defines a custom function node that allows users to write and execute
 * JavaScript code directly within workflows.
 */

import { NodeDefinition } from '@/nodes/types';

// Template library for common function patterns
export const nodeMetadata = {
  templateLibrary: {
    default: `function process(input) {
  // This is a simple function that processes input data
  // Add your custom logic here
  return {
    result: input,
    processed: true
  };
}`,
    json: `function process(input) {
  // Process and validate JSON data
  try {
    // Parse if string is provided
    const jsonData = typeof input === 'string' ? JSON.parse(input) : input;
    
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
  }
}`,
    text: `function process(text) {
  // Text processing function
  
  // Convert to string if not already
  const textValue = String(text);
  
  return {
    original: textValue,
    characters: textValue.length,
    words: textValue.split(/\\s+/).filter(Boolean).length,
    lines: textValue.split('\\n').length,
    uppercase: textValue.toUpperCase(),
    lowercase: textValue.toLowerCase()
  };
}`,
    transform: `function process(data) {
  // Data transformation function
  if (Array.isArray(data)) {
    // Handle array input
    return data.map(item => ({
      ...item,
      transformed: true,
      timestamp: new Date().toISOString()
    }));
  } else if (typeof data === 'object' && data !== null) {
    // Handle object input
    return {
      ...data,
      transformed: true,
      timestamp: new Date().toISOString()
    };
  }
  
  // Handle primitive input
  return {
    value: data,
    transformed: true,
    timestamp: new Date().toISOString()
  };
}`
  }
};

export const definition: NodeDefinition = {
  type: 'function_node',
  name: 'Custom Function',
  description: 'Execute custom JavaScript code in your workflows',
  icon: 'code',
  category: 'advanced',
  version: '1.0.0',
  inputs: {
    input: {
      type: 'any',
      description: 'The input data to process'
    }
  },
  outputs: {
    output: {
      type: 'any',
      description: 'The processed output data'
    }
  },
  configOptions: [
    {
      key: 'selectedTemplate',
      type: 'select',
      displayName: 'Template',
      description: 'Select a template for common function patterns',
      default: 'default',
      options: [
        { value: 'default', label: 'Default Function' },
        { value: 'json', label: 'JSON Processor' },
        { value: 'text', label: 'Text Processor' },
        { value: 'transform', label: 'Data Transformer' }
      ]
    },
    {
      key: 'code',
      type: 'code',
      language: 'javascript',
      displayName: 'Function Code',
      description: 'JavaScript function to execute',
      default: nodeMetadata.templateLibrary.default
    }
  ],
  defaultData: {
    selectedTemplate: 'default',
    code: nodeMetadata.templateLibrary.default
  }
};

export default definition;
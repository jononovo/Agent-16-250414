# Node System Development Guide

This guide provides step-by-step instructions for developers working with the folder-based node system. It covers node creation, testing, common patterns, and best practices.

## Quick Start: Creating a New Node

### 1. Set Up Node Structure

Create a folder for your node and the required files:

```bash
mkdir -p client/src/nodes/my_custom_node
touch client/src/nodes/my_custom_node/{definition.ts,executor.ts,ui.tsx}
```

### 2. Define Node Interface (definition.ts)

```typescript
// client/src/nodes/my_custom_node/definition.ts
import { NodeDefinition } from '../types';

const definition: NodeDefinition = {
  // Core identity - all required
  type: 'my_custom_node',        // Unique identifier (snake_case)
  name: 'My Custom Node',        // Display name
  description: 'Performs custom processing on text input',
  category: 'utility',           // Standard category
  version: '1.0.0',              // Semantic version
  
  // Port definitions - what flows in and out of the node
  inputs: {
    text: {
      type: 'string',            // Data type
      description: 'Text to process',
      optional: false            // Required input
    },
    options: {
      type: 'object',
      description: 'Processing options',
      optional: true             // Optional input
    }
  },
  
  outputs: {
    result: {
      type: 'string',
      description: 'Processed output'
    },
    metadata: {
      type: 'object',
      description: 'Additional output information'
    }
  },
  
  // Default configuration values for the node
  defaultData: {
    prefix: 'Result: ',
    uppercase: false,
    maxLength: 100
  }
};

export default definition;
```

### 3. Implement Execution Logic (executor.ts)

```typescript
// client/src/nodes/my_custom_node/executor.ts
import { NodeExecutorFunction } from '../../lib/types';

// Type interface for the node's configuration data
interface MyCustomNodeData {
  prefix: string;
  uppercase: boolean;
  maxLength: number;
}

export const execute: NodeExecutorFunction = async (
  nodeData: MyCustomNodeData, 
  inputs: Record<string, any>
) => {
  try {
    // Get the input text with fallback
    const inputText = inputs.text || '';
    
    // Apply transformations based on configuration
    let result = inputText;
    
    // Apply prefix
    result = nodeData.prefix + result;
    
    // Apply uppercase if configured
    if (nodeData.uppercase) {
      result = result.toUpperCase();
    }
    
    // Apply length limit
    if (nodeData.maxLength > 0 && result.length > nodeData.maxLength) {
      result = result.substring(0, nodeData.maxLength) + '...';
    }
    
    // Return multiple outputs as an object
    return {
      result: result,
      metadata: {
        originalLength: inputText.length,
        resultLength: result.length,
        transformed: result !== inputText
      }
    };
  } catch (error) {
    // Error handling
    console.error('Error executing MyCustomNode:', error);
    throw new Error(`Processing failed: ${error.message}`);
  }
};
```

### 4. Create the UI Component (ui.tsx)

```tsx
// client/src/nodes/my_custom_node/ui.tsx
import React from 'react';
import { NodeProps } from 'reactflow';
import { NodeContainer } from '../../components/nodes/common/NodeContainer';
import { NodeHeader } from '../../components/nodes/common/NodeHeader';
import { NodeContent } from '../../components/nodes/common/NodeContent';
import { HandleWithLabel } from '../../components/nodes/handles/HandleWithLabel';
import { Position } from 'reactflow';
import { Input } from '../../components/ui/input';
import { Switch } from '../../components/ui/switch';
import { Label } from '../../components/ui/label';

// Component for the node's UI in the workflow editor
export function MyCustomNodeComponent({ data, isConnectable, selected }: NodeProps) {
  // Handler for data changes
  const handleDataChange = (key: string, value: any) => {
    if (data.onChange) {
      data.onChange({
        ...data,
        [key]: value
      });
    }
  };

  return (
    <NodeContainer selected={selected}>
      <NodeHeader 
        title="My Custom Node" 
        icon="settings" 
      />
      <NodeContent>
        {/* Input Handles */}
        <HandleWithLabel
          type="target"
          position={Position.Left}
          id="text"
          label="Text"
          isConnectable={isConnectable}
        />
        
        <HandleWithLabel
          type="target"
          position={Position.Left}
          id="options"
          label="Options"
          isConnectable={isConnectable}
        />
        
        {/* Node Configuration UI */}
        <div className="p-3 space-y-4">
          <div>
            <Label htmlFor="prefix">Prefix</Label>
            <Input
              id="prefix"
              value={data.prefix || ''}
              onChange={(e) => handleDataChange('prefix', e.target.value)}
              placeholder="Enter prefix"
              className="mt-1"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="uppercase"
              checked={!!data.uppercase}
              onCheckedChange={(checked) => handleDataChange('uppercase', checked)}
            />
            <Label htmlFor="uppercase">Convert to uppercase</Label>
          </div>
          
          <div>
            <Label htmlFor="maxLength">Max Length</Label>
            <Input
              id="maxLength"
              type="number"
              value={data.maxLength || 0}
              onChange={(e) => handleDataChange('maxLength', parseInt(e.target.value))}
              className="mt-1"
            />
          </div>
        </div>
        
        {/* Output Handles */}
        <HandleWithLabel
          type="source"
          position={Position.Right}
          id="result"
          label="Result"
          isConnectable={isConnectable}
        />
        
        <HandleWithLabel
          type="source"
          position={Position.Right}
          id="metadata"
          label="Metadata"
          isConnectable={isConnectable}
        />
      </NodeContent>
    </NodeContainer>
  );
}
```

### 5. Register the Node

Add your node to the list in `client/src/lib/nodeSystem.ts`:

```typescript
const FOLDER_BASED_NODE_TYPES = [
  'text_input',
  'claude',
  'http_request',
  // ...
  'my_custom_node'  // Add your node here
];
```

## Node Component Structure

A complete node implementation includes these key files:

| File | Purpose | Required |
|------|---------|----------|
| **definition.ts** | Node interface and metadata | Yes |
| **executor.ts** | Execution and processing logic | Yes |
| **ui.tsx** | Visual representation in editor | Yes |
| **schema.ts** | Input/output schema details | No |
| **index.ts** | Entry point and exports | No |
| **README.md** | Documentation | No |

## Standard Node Categories

Use these standard categories for consistent organization:

| Category | Purpose | Examples |
|----------|---------|----------|
| `input` | User/system input collection | text_input |
| `output` | Result display/storage | response_message |
| `processing` | Data processing/transformation | data_transform, text_template |
| `ai` | AI model integration | claude, openai |
| `integration` | External API/service integration | http_request |
| `logic` | Control flow/decisions | decision, switch |
| `utility` | General purpose helpers | function, json_path |

## Technical Requirements & Validation

Every node must meet these technical requirements to pass validation:

1. **Definition Properties**:
   - Core identity: `type`, `name`, `description`, `category`, `version`
   - Interface: `inputs`, `outputs`
   - Configuration: `defaultData`

2. **Executor Function**:
   - Must be async function
   - Parameters: `nodeData`, `inputs`
   - Return type must match defined outputs

3. **Type Safety**:
   - Use TypeScript interfaces for nodeData
   - Match output structure to output definitions

## Testing & Debugging

### Testing a New Node

1. **Basic Testing**:
   ```bash
   # Start the development server
   npm run dev
   ```

2. **Validation Testing**: Open browser console and run:
   ```javascript
   import('./src/lib/validateAllNodes').then(mod => mod.default(true));
   ```

3. **Workflow Testing**:
   - Add your node to a workflow in the editor
   - Connect it to other nodes
   - Use the debug mode to trace execution

### Debugging Tools

1. **Node-Specific Logging**:
   ```typescript
   export const execute = async (nodeData, inputs) => {
     console.group(`Executing ${nodeData.type}`);
     console.log('Config:', nodeData);
     console.log('Inputs:', inputs);
     const result = /* processing logic */;
     console.log('Result:', result);
     console.groupEnd();
     return result;
   };
   ```

2. **Validation Debugging**:
   ```typescript
   import { validateNodeDefinition } from '../../lib/nodeValidation';
   
   const validationResult = validateNodeDefinition(definition);
   console.log('Validation result:', validationResult);
   ```

3. **Development Mode Auto-Validation**:
   - The system automatically validates nodes during development
   - Check browser console for validation messages
   - Fix any reported issues to ensure compatibility

## Advanced Node Patterns

### 1. Dynamic Port Configuration

For nodes with variable numbers of inputs/outputs:

```typescript
const definition: NodeDefinition = {
  // ... other properties
  
  dynamicInputs: true,  // Enable dynamic inputs
  dynamicInputConfig: {
    prefix: 'input_',  // Prefix for dynamically added inputs
    template: {        // Template for dynamic input ports
      type: 'string',
      description: 'Dynamic input port'
    }
  }
};
```

### 2. Conditional Processing

For nodes that handle different processing paths:

```typescript
export const execute = async (nodeData, inputs) => {
  const mode = nodeData.mode || 'default';
  
  switch (mode) {
    case 'transform':
      return handleTransform(inputs);
    case 'filter':
      return handleFilter(inputs);
    default:
      return handleDefault(inputs);
  }
};
```

### 3. AI Model Integration

Pattern for integrating with AI models:

```typescript
export const execute = async (nodeData, inputs) => {
  // Prepare the API request
  const requestBody = {
    model: nodeData.model || 'claude-3-opus-20240229',
    messages: [
      { role: 'user', content: inputs.prompt || '' }
    ],
    temperature: nodeData.temperature || 0.7,
    max_tokens: nodeData.maxTokens || 1000
  };
  
  try {
    // Call the API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': nodeData.apiKey || '',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(requestBody)
    });
    
    const data = await response.json();
    
    // Return the AI response
    return {
      completion: data.content[0].text,
      metadata: {
        model: data.model,
        usage: data.usage
      }
    };
  } catch (error) {
    console.error('AI model error:', error);
    throw new Error(`AI processing failed: ${error.message}`);
  }
};
```

## Best Practices

### Node Design

1. **Single Responsibility**: Each node should do one thing well
2. **Comprehensive Error Handling**: Always catch and process errors
3. **Typed Interfaces**: Use TypeScript for nodeData and inputs/outputs
4. **Validation**: Check all inputs before processing
5. **Default Values**: Provide sensible defaults for all settings
6. **Clear Naming**: Use descriptive names for inputs and outputs
7. **Documentation**: Add comments for complex logic

### UI Design

1. **Consistent Layout**: Follow platform UI patterns
2. **Responsive Design**: Adapt to different node sizes
3. **Input Validation**: Validate user inputs in real-time
4. **Visual Feedback**: Indicate required fields and validation status
5. **Accessibility**: Use proper labels and keyboard navigation
6. **Error Messages**: Display clear error messages
7. **Help Text**: Provide context and descriptions for settings

## Common Troubleshooting

| Issue | Possible Solutions |
|-------|-------------------|
| Node not appearing in editor | Check registration in FOLDER_BASED_NODE_TYPES |
| Inputs not receiving data | Verify input handle IDs match input names |
| Outputs not connecting | Check output handle IDs match output names |
| Execution errors | Add try/catch and verbose logging |
| UI not rendering properly | Check component imports and props |
| Type errors | Ensure type definitions match actual data |
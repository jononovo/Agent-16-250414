# Node System Development Guide

This guide provides practical instructions for working with the folder-based node system. It covers how to create, test, and extend nodes in the AI Agent Workflow Platform.

## Creating a New Node

### Step 1: Create the Node Folder

Create a new folder in `client/src/nodes/` with your node's type name. Use snake_case for the folder name.

```bash
mkdir -p client/src/nodes/my_custom_node
```

### Step 2: Create Node Definition

Create a `definition.ts` file with your node's metadata:

```typescript
// client/src/nodes/my_custom_node/definition.ts
import { NodeDefinition } from '../types';

const definition: NodeDefinition = {
  type: 'my_custom_node',
  name: 'My Custom Node',
  description: 'Description of what your node does',
  icon: 'star',  // Icon identifier
  category: 'utility',  // Choose an appropriate category
  version: '1.0.0',
  
  inputs: {
    input1: {
      type: 'string',
      description: 'First input'
    },
    input2: {
      type: 'number',
      description: 'Second input',
      optional: true
    }
  },
  
  outputs: {
    output: {
      type: 'string',
      description: 'The output data'
    }
  },
  
  defaultData: {
    // Default configuration values
    setting1: 'default value',
    setting2: 42
  }
};

export default definition;
```

### Step 3: Implement Node Executor

Create an `executor.ts` file to implement the node's logic:

```typescript
// client/src/nodes/my_custom_node/executor.ts
import { NodeExecutorFunction } from '../../lib/types';

export const execute: NodeExecutorFunction = async (nodeData, inputs) => {
  // Get input values (with fallbacks)
  const input1 = inputs.input1 || '';
  const input2 = parseFloat(inputs.input2 || '0');
  
  // Process the inputs
  const result = `Processed: ${input1} (${input2})`;
  
  // Return output
  return result;
};
```

### Step 4: Create Node UI Component

Create a `ui.tsx` file for the node's visual representation:

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

export function MyCustomNodeComponent({ data, isConnectable, selected }: NodeProps) {
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
      <NodeHeader title="My Custom Node" icon="star" />
      <NodeContent>
        <HandleWithLabel
          type="target"
          position={Position.Left}
          id="input1"
          label="Input 1"
          isConnectable={isConnectable}
        />
        
        <HandleWithLabel
          type="target"
          position={Position.Left}
          id="input2"
          label="Input 2"
          isConnectable={isConnectable}
        />
        
        <div className="p-2">
          <label className="text-sm font-medium">Setting 1</label>
          <Input
            value={data.setting1 || ''}
            onChange={(e) => handleDataChange('setting1', e.target.value)}
            placeholder="Enter setting 1"
            className="mt-1 mb-2"
          />
          
          <label className="text-sm font-medium">Setting 2</label>
          <Input
            type="number"
            value={data.setting2 || 0}
            onChange={(e) => handleDataChange('setting2', parseInt(e.target.value))}
            placeholder="Enter setting 2"
            className="mt-1"
          />
        </div>
        
        <HandleWithLabel
          type="source"
          position={Position.Right}
          id="output"
          label="Output"
          isConnectable={isConnectable}
        />
      </NodeContent>
    </NodeContainer>
  );
}
```

### Step 5: Register the Node

Add your node type to the list in `client/src/lib/nodeSystem.ts`:

```typescript
// client/src/lib/nodeSystem.ts
const FOLDER_BASED_NODE_TYPES = [
  'text_input',
  'claude',
  'http_request',
  // Add your node type here
  'my_custom_node'
];
```

## Testing and Validation

### Manual Testing

1. After adding a new node, restart the development server to ensure it's registered
2. Open the workflow editor and verify your node appears in the node picker
3. Add the node to a workflow and test its functionality
4. Check the browser console for any validation errors

### Automated Validation

The node system includes built-in validation that runs at startup in development mode.

You can also run validation manually in the browser console:

```javascript
import('./lib/validateAllNodes').then(module => {
  module.default(true); // true enables verbose logging
});
```

### Common Validation Requirements

All nodes must include:

1. **Unique Type**: A unique string identifier
2. **Name and Description**: Human-readable labels
3. **Category**: One of the standard categories
4. **Version**: Semantic version string (e.g., "1.0.0")
5. **Inputs and Outputs**: Properly defined port definitions
6. **Default Data**: Initial configuration values

## UI Component Guidelines

When building node UI components, follow these guidelines for consistency:

### 1. Use Standard Components

- `NodeContainer`: Base container for all nodes
- `NodeHeader`: Standard header with title and controls
- `NodeContent`: Content area with consistent padding
- `HandleWithLabel`: Connection handle with readable label

### 2. Layout Patterns

- Place input handles on the left side
- Place output handles on the right side
- Group similar controls together
- Use consistent spacing and padding

### 3. Responsive Design

- Ensure the node looks good at various sizes
- Use responsive layout techniques
- Don't hardcode dimensions unless necessary

### 4. State Management

- Use React hooks for local state
- Pass configuration changes via `onChange` callback
- Handle null/undefined values gracefully

## Best Practices

### For Node Design

1. **Single Responsibility**: Each node should do one thing well
2. **Meaningful Names**: Choose clear, descriptive names for node types, inputs, and outputs
3. **Appropriate Categories**: Place nodes in categories that reflect their function
4. **Consistent Interfaces**: Follow the established input/output naming patterns
5. **Reasonable Defaults**: Provide sensible default values for all settings

### For Node Execution

1. **Async Operations**: Always make executor functions async for consistency
2. **Error Handling**: Properly catch and handle errors in executor functions
3. **Input Validation**: Check inputs before processing to avoid runtime errors
4. **Immutable Returns**: Don't modify input objects, return new objects instead
5. **Performance**: Optimize for processing speed when handling large datasets

## Debugging Tips

1. Add console logs to your executor function:
   ```typescript
   export const execute = async (nodeData, inputs) => {
     console.log('Node data:', nodeData);
     console.log('Inputs:', inputs);
     // ...
   };
   ```

2. Use the browser DevTools to inspect the node component.

3. Check validation results to identify issues with your node definition:
   ```typescript
   import { validateNodeDefinition } from '../../lib/nodeValidation';
   
   const result = validateNodeDefinition(myNodeDefinition);
   console.log(result);
   ```

## Advanced Node Features

### Dynamic Inputs/Outputs

For nodes with variable inputs or outputs, you can specify dynamic port configurations:

```typescript
const definition: NodeDefinition = {
  // ...
  dynamicInputs: true,
  dynamicInputConfig: {
    prefix: 'input_',
    template: {
      type: 'string',
      description: 'Dynamic input'
    }
  }
};
```

### State Persistence

For nodes that need to maintain state between executions:

```typescript
export const execute: NodeExecutorFunction = async (nodeData, inputs, context) => {
  // Get persisted state
  const state = context.getState() || { counter: 0 };
  
  // Update state
  state.counter++;
  
  // Save state for next execution
  context.setState(state);
  
  return { output: `Count: ${state.counter}` };
};
```

## Troubleshooting Common Issues

### Node Not Appearing in UI

- Check if your node type is added to `FOLDER_BASED_NODE_TYPES` in `nodeSystem.ts`
- Verify there are no console errors during node registration
- Make sure your definition file has a proper default export

### Execution Errors

- Check input types and validate before processing
- Use try/catch blocks to handle potential errors
- Verify that your executor is returning the expected output structure

### UI Rendering Issues

- Ensure your UI component matches the expected props interface
- Check for missing key React properties
- Verify CSS class names and styling

Remember: The folder-based node system is designed to be modular and maintainable. Following these guidelines will ensure your nodes integrate seamlessly with the platform.
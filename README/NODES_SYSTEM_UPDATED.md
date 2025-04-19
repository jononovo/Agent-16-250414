# Node System Technical Documentation

This comprehensive guide covers all aspects of the node system, including architecture, implementation, UI components, execution, and best practices for node development.

## Table of Contents
1. [Overview](#overview)
2. [Node Architecture](#node-architecture)
3. [Folder Structure](#folder-structure)
4. [Node Components](#node-components)
5. [Enhanced Node Pattern](#enhanced-node-pattern)
6. [Node UI System](#node-ui-system)
7. [Node Data Management](#node-data-management)
8. [Node Execution](#node-execution)
9. [Adding New Nodes](#adding-new-nodes)
10. [Common Patterns and Best Practices](#common-patterns-and-best-practices)
11. [Example Implementation](#example-implementation)

## Overview

The node system is the core of the workflow platform, enabling developers to create and integrate various node types for building AI agent workflows. It follows a folder-based architecture that emphasizes:

- Separation of concerns (UI, execution, validation)
- Consistent user experience across all nodes
- Type safety through TypeScript
- Automatic registration of new nodes
- Enhanced UI patterns with settings configuration

## Node Architecture

The node system follows a folder-based architecture where:
- Each node is a self-contained folder with all its resources
- Nodes are automatically discovered and registered
- Nodes are organized into System and Custom categories
- UI and execution logic are clearly separated

### Core Concepts

- **Node**: A processing block in a workflow that performs a specific function
- **Executor**: The logic that runs when a node is executed
- **Settings**: Configuration parameters that control node behavior
- **Handles**: Connection points for linking nodes together
- **Definition**: Metadata describing a node and its capabilities

## Folder Structure

Nodes are organized in the following folder structure:

```
client/src/nodes/
├── System/                # Core system nodes
│   ├── text_input/        # Example node folder
│   │   ├── definition.ts  # Node metadata and interfaces
│   │   ├── executor.ts    # Node execution logic
│   │   ├── schema.ts      # Data validation schema
│   │   ├── ui.tsx         # UI implementation
│   │   └── index.ts       # Exports for registration
│   └── ...
├── Custom/                # User-defined nodes
│   └── ...
└── Default/               # Default node implementation
    └── ui.tsx             # Default node component
```

### Categories

1. **System Nodes** (`System/`)
   - Core nodes essential to the platform
   - Standard I/O, processing, and control flow nodes
   - Examples: text_input, text_formatter, decision

2. **Custom Nodes** (`Custom/`)
   - Domain-specific or specialized functionality
   - Integration with external services
   - User-created nodes for specific use cases

3. **Default** (`Default/`)
   - Default node implementation
   - Used as fallback for nodes without specific UI
   - Provides enhanced node features (settings drawer, etc.)

## Node Components

Each node consists of multiple components:

### 1. Definition (`definition.ts`)

Defines the node's metadata and interfaces:

```typescript
export default {
  type: 'my_node_type',
  name: 'My Node',
  description: 'Description of what the node does',
  icon: 'icon-name',
  category: 'category-name',
  version: '1.0.0',
  inputs: {
    // Input port definitions
  },
  outputs: {
    // Output port definitions
  },
  // Optional settings schema for the enhanced node
  settings: {
    title: "Node Settings",
    fields: [
      {
        key: "apiKey",
        label: "API Key",
        type: "text",
        description: "Enter your API key"
      }
    ]
  }
};
```

### 2. Executor (`executor.ts`)

Implements the node's execution logic:

```typescript
import { NodeExecutorFunction } from '../../lib/types';

export interface MyNodeData {
  // Node data structure
}

export const defaultData: MyNodeData = {
  // Default node data
};

export const execute: NodeExecutorFunction<MyNodeData> = async (data, inputs) => {
  // Node execution logic
  return {
    items: [{ json: /* processed result */ }],
    meta: {
      startTime: new Date(),
      endTime: new Date()
    }
  };
};
```

### 3. UI Component (`ui.tsx`)

Implements the node's UI using the Default Node pattern:

```typescript
import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import DefaultNode from '@/nodes/Default/ui';

interface MyNodeData {
  // Node data structure
}

export const component: React.FC<NodeProps<MyNodeData>> = ({ data, id, selected }) => {
  // Define settings schema
  const nodeSettings = {
    title: "My Node Settings",
    fields: [
      // Field definitions
    ]
  };

  // Enhance node data with settings
  const enhancedData = {
    ...data,
    settings: nodeSettings,
    onChange: (updatedData) => {
      // Handle data changes
    }
  };

  // Node content
  const nodeContent = (
    <>
      {/* Node-specific UI components */}
      
      {/* Input/output handles */}
      <Handle type="target" position={Position.Left} id="input" />
      <Handle type="source" position={Position.Right} id="output" />
    </>
  );

  // Return enhanced node
  return (
    <DefaultNode
      id={id}
      data={enhancedData}
      selected={selected}
    >
      {nodeContent}
    </DefaultNode>
  );
};
```

### 4. Schema (`schema.ts`)

Defines validation schema for the node's data:

```typescript
import { NodeSchema } from '../../lib/types';

const schema: NodeSchema = {
  inputs: {
    myInput: {
      type: 'string',
      description: 'Description of the input',
      required: true
    }
  },
  outputs: {
    myOutput: {
      type: 'string',
      description: 'Description of the output'
    }
  }
};

export default schema;
```

### 5. Index (`index.ts`)

Exports the node implementation for registration:

```typescript
import definition from './definition';
import schema from './schema';
import * as executor from './executor';
import * as ui from './ui';

export default {
  type: definition.type,
  metadata: {
    name: definition.name,
    description: definition.description,
    category: definition.category,
    version: definition.version
  },
  schema,
  executor: {
    execute: executor.execute,
    defaultData: executor.defaultData
  },
  ui: ui.component
};
```

## Enhanced Node Pattern

The Enhanced Node Pattern provides a consistent approach to node UI with built-in features:

- Settings drawer/sheet for configuration
- Context menu for actions (run, duplicate, delete)
- Status indicators (running, complete, error)
- Consistent styling and layout

### Using the Default Node

```typescript
import DefaultNode from '@/nodes/Default/ui';

// Your node component
export const YourNodeComponent = ({ data, id, selected, isConnectable }) => {
  // Define settings schema
  const nodeSettings = {
    title: "Your Node Settings",
    fields: [
      {
        key: "apiKey",
        label: "API Key",
        type: "text",
        description: "Enter your API key"
      },
      {
        key: "model",
        label: "Model",
        type: "select",
        options: [
          { label: "Model A", value: "model-a" },
          { label: "Model B", value: "model-b" }
        ]
      }
    ]
  };

  // Prepare enhanced data
  const enhancedData = {
    ...data,
    settings: nodeSettings,
    onChange: (updatedData) => {
      // Handle changes
    }
  };

  // Your custom node content
  const nodeContent = (
    <>
      {/* Your UI components */}
      
      {/* Your handles */}
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        isConnectable={isConnectable}
      />
      
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        isConnectable={isConnectable}
      />
    </>
  );

  // Return the enhanced node
  return (
    <DefaultNode
      id={id}
      data={enhancedData}
      selected={selected}
    >
      {nodeContent}
    </DefaultNode>
  );
};
```

### Settings Schema Reference

Settings are defined using this schema structure:

```typescript
{
  title: "Node Settings Title",
  fields: [
    {
      key: "uniqueKey",          // Property name in data
      label: "Display Label",    // Shown to users
      type: "text",              // text, number, select, checkbox, textarea, slider
      description: "Help text",  // Optional description
      
      // For select fields:
      options: [
        { label: "Option 1", value: "value1" },
        { label: "Option 2", value: "value2" }
      ],
      
      // For number/slider fields:
      min: 0,
      max: 100,
      step: 1
    }
  ]
}
```

## Node UI System

The node UI system is built with reusable components:

### Common Components

Base components for node structure:

- `NodeContainer` - Base wrapper for all nodes
- `NodeHeader` - Header with title, icon, actions
- `NodeContent` - Content area with consistent padding
- `NodeSettingsForm` - Dynamic form for node settings

### Handle Components

Components for node connection points:

- `Handle` - Basic ReactFlow handle
- `LabeledHandle` - Handle with visible label
- `EditableHandle` - Handle with editable label

### Control Components

UI controls for node configuration:

- `NodeTextInput` - Text input for node settings
- `NodeSelect` - Dropdown selection for node settings
- `NodeToggleSwitch` - Toggle switch for boolean settings

### Design Guidelines (simple-ai.dev Inspired)

1. **Consistent Visual Identity**
   - All nodes should have the same base styling
   - Use the provided container components for consistent borders and shadows
   - Respect the color scheme across all nodes

2. **Handle Positioning**
   - Input handles should be positioned on the left side
   - Output handles should be positioned on the right side
   - All handles should include descriptive labels

3. **Node Structure**
   - All nodes should have a header with title and icon
   - The content section should have consistent padding
   - Configuration UI should use standard form components from shadcn/ui

4. **Responsiveness**
   - Nodes should maintain readability at different zoom levels
   - Text should be properly truncated with tooltips for overflow
   - Minimum and maximum width constraints should be respected

## Node Data Management

### Settings Data Flow

1. Node settings are defined in the node's definition
2. UI component receives settings via `data.settings`
3. Changes are handled via `data.onChange` callback
4. NodeSettingsForm renders the UI for settings
5. Updated settings are saved to the node's data

### Data Handling

- Each node UI component receives a `data` prop containing the node's configuration
- Changes to node data must use the provided `onChange` handler
- Example of handling data changes:

```tsx
function MyNodeComponent({ data, isConnectable, selected }: NodeProps) {
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
      {/* ... */}
      <Input
        value={data.myProperty || ''}
        onChange={(e) => handleDataChange('myProperty', e.target.value)}
      />
      {/* ... */}
    </NodeContainer>
  );
}
```

### Data Persistence

1. Changes are first applied to in-memory node data
2. Data is serialized when saving the workflow
3. When loading a workflow, settings are restored from serialized data

### Default Values

Always provide sensible defaults for all node settings to ensure nodes work without configuration:

```typescript
export const defaultData = {
  apiKey: "",
  model: "default-model",
  maxTokens: 100
};
```

## Node Execution

### Execution Flow

1. Node is triggered (manual or workflow execution)
2. Executor receives node data and inputs
3. Logic processes inputs according to node settings
4. Results are returned in standardized format
5. UI is updated to reflect execution state

### Standardized Output Format

All nodes must return data in this format:

```typescript
interface NodeExecutionData {
  items: {
    json: Record<string, any>;
    meta?: Record<string, any>;
  }[];
  meta: {
    startTime: Date;
    endTime: Date;
    error?: string;
    status?: string;
    [key: string]: any;
  };
}
```

### Input Processing

Nodes must implement extraction logic to handle nested standardized output format:

```typescript
function extractFromStandardizedFormat(input: any): any {
  // Case 1: Direct string/primitive
  if (typeof input !== 'object' || input === null) {
    return input;
  }

  // Case 2: Standardized format with items array
  if (input.items && Array.isArray(input.items) && input.items.length > 0) {
    const firstItem = input.items[0];
    
    // Case 2a: Handle nested items (node output of node output)
    if (firstItem.json && firstItem.json.items && 
        Array.isArray(firstItem.json.items) && firstItem.json.items.length > 0) {
      const nestedItem = firstItem.json.items[0];
      
      // Extract from nested json
      if (nestedItem.json) {
        if (nestedItem.json.text) {
          return nestedItem.json.text;
        }
        return nestedItem.json;
      }
    }
    
    // Case 2b: Direct json content
    if (firstItem.json) {
      return firstItem.json;
    }
    
    // Case 2c: Direct text
    if (firstItem.text) {
      return firstItem.text;
    }
  }
  
  // Fall back to original input
  return input;
}
```

## Adding New Nodes

To add a new node:

1. Choose the appropriate category (System or Custom)
2. Create a folder with the node's type name
3. Create the required files (definition, executor, ui, etc.)
4. Use the Enhanced Node Pattern for UI implementation
5. The node will be automatically discovered and registered

## Common Patterns and Best Practices

### Visual Consistency

- Follow the Simple-AI.dev design pattern for consistent UI
- Use the Default Node pattern for all nodes
- Maintain consistent handle positioning and labeling
- Use appropriate icons from Lucide React for node types

### Error Handling

- Display meaningful error messages to users
- Set `hasError` and `errorMessage` properties when errors occur
- Provide recovery suggestions when possible
- Log detailed error information for debugging

### Performance

- Lazy-load heavyweight dependencies
- Use async execution for long-running operations
- Implement proper cancellation for interruptible operations
- Add loading indicators for operations > 100ms

### Documentation

- Keep JSDoc comments up-to-date
- Document all settings fields with clear descriptions
- Provide examples of inputs and outputs
- Include version information in the node definition

### Testing

- Test with both direct inputs and standardized format inputs
- Verify correct extraction of data from nested sources
- Check handling of edge cases (empty inputs, large data)
- Ensure output complies with standardized format

## Example Implementation

Here's a complete example of a node implementation using the Enhanced Node Pattern:

```typescript
/**
 * Example Enhanced Node
 * 
 * This is an example of how to use the Default Node pattern
 * to create a node with settings drawer functionality.
 */

import React, { useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { FileText, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import DefaultNode from '@/nodes/Default/ui';

interface ExampleNodeData {
  label: string;
  description?: string;
  inputText?: string;
  apiKey?: string;
  model?: string;
  maxTokens?: number;
  [key: string]: any;
}

export const ExampleEnhancedNode: React.FC<NodeProps<ExampleNodeData>> = ({ 
  data, 
  id, 
  selected,
  isConnectable 
}) => {
  // Local state for the text input
  const [localText, setLocalText] = useState(data.inputText || '');
  
  // Handle text change
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalText(e.target.value);
    
    // If there's an onChange handler in the data, call it
    if (data.onChange) {
      data.onChange({
        ...data,
        inputText: e.target.value
      });
    }
  };
  
  // Define settings for this node
  const nodeSettings = {
    title: "Example Node Settings",
    fields: [
      {
        key: "apiKey",
        label: "API Key",
        type: "text" as const,
        description: "Enter your API key for the service"
      },
      {
        key: "model",
        label: "Model",
        type: "select" as const,
        description: "Select the model to use",
        options: [
          { label: "Model A", value: "model-a" },
          { label: "Model B", value: "model-b" },
          { label: "Model C", value: "model-c" }
        ]
      },
      {
        key: "maxTokens",
        label: "Max Tokens",
        type: "slider" as const,
        description: "Maximum number of tokens to generate",
        min: 10,
        max: 1000,
        step: 10
      }
    ]
  };
  
  // Prepare enhanced data with settings
  const enhancedData = {
    ...data,
    icon: <FileText className="h-4 w-4 text-blue-500" />,
    settings: nodeSettings,
    // Include callback handlers
    onChange: (updatedData: any) => {
      console.log('Node data updated:', updatedData);
      // In a real implementation, this would update the node's data in the flow
    }
  };
  
  // The content of our node
  const nodeContent = (
    <>
      <div className="space-y-2">
        <Textarea
          value={localText}
          onChange={handleTextChange}
          placeholder="Enter text here..."
          className="min-h-[80px] text-sm"
        />
        
        <Button 
          size="sm" 
          className="w-full flex items-center gap-1"
          variant="outline"
        >
          <Send className="h-3 w-3" />
          <span>Process</span>
        </Button>
      </div>
      
      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        style={{ top: 60 }}
        isConnectable={isConnectable}
      />
      
      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        style={{ top: 60 }}
        isConnectable={isConnectable}
      />
    </>
  );
  
  // Return the enhanced node
  return (
    <DefaultNode
      id={id}
      data={enhancedData}
      selected={selected}
    >
      {nodeContent}
    </DefaultNode>
  );
};
```
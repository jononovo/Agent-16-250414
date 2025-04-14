# Node UI Components

This folder contains shared UI components for building nodes in the workflow system.

## Overview

The node UI component system is organized by feature/functionality:

- `common/` - Basic building blocks and structural components
- `handles/` - Connection points and handle components
- `controls/` - Input controls and interactive elements
- `advanced/` - Complex components with specialized behavior
- `api/` - Components that interact with external services

## Core Components

### Common Components

- `NodeContainer.tsx` - Base container for all nodes
- `NodeHeader.tsx` - Standard header with title, controls and menu
- `NodeContent.tsx` - Content area with consistent padding and styling

### Handle Components

- `HandleWithLabel.tsx` - Connection handle with attached label for clarity

## Usage Examples

### Basic Node Structure

```tsx
import { NodeContainer } from '../components/nodes/common/NodeContainer';
import { NodeHeader } from '../components/nodes/common/NodeHeader';
import { NodeContent } from '../components/nodes/common/NodeContent';
import { HandleWithLabel } from '../components/nodes/handles/HandleWithLabel';
import { Position } from 'reactflow';

function MyCustomNode({ data, isConnectable, selected }) {
  return (
    <NodeContainer selected={selected}>
      <NodeHeader 
        title="My Node" 
        icon={<MyIcon />}
        onDelete={() => console.log('Delete node')}
      />
      <NodeContent>
        <HandleWithLabel
          type="target"
          position={Position.Left}
          id="input"
          label="Input"
          isConnectable={isConnectable}
        />
        
        {/* Node content goes here */}
        
        <HandleWithLabel
          type="source"
          position={Position.Right}
          id="output"
          label="Result"
          isConnectable={isConnectable}
        />
      </NodeContent>
    </NodeContainer>
  );
}
```

## Design Principles

1. **Consistency** - All nodes should have a consistent look and feel
2. **Reusability** - Components should be easily reusable across different node types
3. **Flexibility** - Components should be configurable for different use cases
4. **Accessibility** - All components should be accessible and keyboard-navigable
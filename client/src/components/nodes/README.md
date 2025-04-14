# Node UI Components

This directory contains reusable UI components for building node-based workflows. These components provide a consistent UI experience across all nodes in the system.

## Directory Structure

- **`common/`**: Core components used across all nodes
  - NodeContainer: Standard node container/wrapper
  - NodeHeader: Consistent header for nodes

- **`handles/`**: Handle-related components
  - StandardHandle: Basic handle implementation
  - DynamicHandles: Dynamic/multiplexed handles
  - HandleWithLabel: Handle with attached label

- **`controls/`**: UI controls for node parameters
  - TextControl: Text input control
  - SelectControl: Dropdown select control
  - NumberControl: Number input with validation

- **`advanced/`**: Advanced components for complex nodes
  - Accordion: Collapsible sections
  - CodeEditor: Code editing component
  - JsonEditor: JSON structure editor

- **`api/`**: API-specific components
  - HttpMethodSelector: HTTP method dropdown
  - HeadersEditor: HTTP headers editor

## Usage Guidelines

### 1. Node Design Principles

All nodes should follow these design principles:
- Each node should have a clear, single purpose
- Nodes should provide visual feedback about their state
- Handles (connection points) should be clearly labeled
- Configuration UI should be intuitive and provide validation

### 2. Component Usage

When building a node UI, use these components in this order:

1. **Container**: Start with `NodeContainer` as the base
2. **Header**: Add `NodeHeader` with node title and icon
3. **Handles**: Add input and output handles as needed
4. **Controls**: Add parameter controls for node configuration
5. **Advanced**: Add any advanced components needed

### 3. Handle Placement

- Input handles should be on the left side of the node
- Output handles should be on the right side of the node
- Handles should be aligned with their corresponding controls

### 4. Control Layout

- Controls should be arranged vertically
- Most important controls should be at the top
- Group related controls using the `Accordion` component
- Provide clear labels and validation for all controls

## Example

Here's a basic example of how to implement a node UI:

```tsx
import { Handle, Position } from 'reactflow';
import { NodeContainer } from '../components/nodes/common/NodeContainer';
import { NodeHeader } from '../components/nodes/common/NodeHeader';
import { HandleWithLabel } from '../components/nodes/handles/HandleWithLabel';
import { TextControl } from '../components/nodes/controls/TextControl';

export function MyNodeUI({ data, isConnectable }) {
  return (
    <NodeContainer>
      <NodeHeader 
        title="My Node" 
        icon="settings" 
      />
      
      <HandleWithLabel
        type="target"
        position={Position.Left}
        id="input"
        label="Input"
        isConnectable={isConnectable}
      />
      
      <TextControl
        label="Message"
        value={data.message || ''}
        onChange={(value) => data.onChange({ ...data, message: value })}
      />
      
      <HandleWithLabel
        type="source"
        position={Position.Right}
        id="output"
        label="Output"
        isConnectable={isConnectable}
      />
    </NodeContainer>
  );
}
```

## Best Practices

1. **Use TypeScript**: All components should have proper TypeScript types
2. **Provide Validation**: Validate inputs and show error messages
3. **Use Theme Variables**: Use CSS variables for colors and spacing
4. **Responsive Design**: Ensure components work well at different sizes
5. **Accessibility**: Ensure all components are accessible
6. **Documentation**: Document each component with JSDoc comments
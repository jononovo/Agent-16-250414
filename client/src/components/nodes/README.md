# Node UI Components

This directory contains reusable UI components for building consistent node-based workflows. These components are organized by functionality to improve maintainability and standardization.

## Folder Structure

```
components/nodes/
├── common/    - Core components (NodeContainer, NodeHeader, NodeContent)
├── handles/   - Connection points (HandleWithLabel, StandardHandle)
├── controls/  - Input controls (TextControl, SelectControl)
├── advanced/  - Complex components (Accordion, CodeEditor, JsonEditor)
├── api/       - API-specific components (HttpMethodSelector, HeadersEditor)
```

## Core Components

- **NodeContainer**: Base wrapper for all nodes with consistent styling
- **NodeHeader**: Title bar with icon and optional actions
- **NodeContent**: Content area with consistent padding and spacing
- **HandleWithLabel**: Connection point with visible label
- **TextControl, SelectControl**: Standard form inputs for node configuration

## Usage Example

```tsx
import { Position } from 'reactflow';
import { NodeContainer } from '../nodes/common/NodeContainer';
import { NodeHeader } from '../nodes/common/NodeHeader';
import { NodeContent } from '../nodes/common/NodeContent';
import { HandleWithLabel } from '../nodes/handles/HandleWithLabel';

export function MyNodeUI({ data, isConnectable }) {
  return (
    <NodeContainer>
      <NodeHeader title="My Node" icon="settings" />
      
      <HandleWithLabel type="target" position={Position.Left} id="input" label="Input" />
      
      <NodeContent>
        {/* Node configuration controls */}
      </NodeContent>
      
      <HandleWithLabel type="source" position={Position.Right} id="output" label="Output" />
    </NodeContainer>
  );
}
```

## Guidelines

- Input handles on left, output handles on right
- Keep nodes focused on a single purpose
- Provide validation for all inputs
- Use concise labels and tooltips for clarity
- Follow shadcn UI patterns for consistency
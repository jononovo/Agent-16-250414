# Common Node Components

This directory contains core components used across all node types. These components provide the basic building blocks for creating consistent node UIs.

## Components

### NodeContainer

`NodeContainer` is the base container for all nodes. It provides consistent styling, padding, and border radius.

#### Props

```typescript
interface NodeContainerProps {
  children: React.ReactNode;
  selected?: boolean;
  className?: string;
  style?: React.CSSProperties;
}
```

#### Usage

```tsx
import { NodeContainer } from '../components/nodes/common/NodeContainer';

export function MyNodeUI({ data, selected }) {
  return (
    <NodeContainer selected={selected}>
      {/* Node content */}
    </NodeContainer>
  );
}
```

### NodeHeader

`NodeHeader` provides a consistent header for all nodes, including an icon, title, and optional actions.

#### Props

```typescript
interface NodeHeaderProps {
  title: string;
  icon?: React.ReactNode | string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}
```

#### Usage

```tsx
import { NodeContainer } from '../components/nodes/common/NodeContainer';
import { NodeHeader } from '../components/nodes/common/NodeHeader';

export function MyNodeUI({ data }) {
  return (
    <NodeContainer>
      <NodeHeader 
        title="My Node" 
        icon="settings"
        description="This node does something cool"
      />
      {/* Node content */}
    </NodeContainer>
  );
}
```

### NodeContent

`NodeContent` provides a consistent container for the content of a node, with padding and spacing.

#### Props

```typescript
interface NodeContentProps {
  children: React.ReactNode;
  className?: string;
}
```

#### Usage

```tsx
import { NodeContainer } from '../components/nodes/common/NodeContainer';
import { NodeHeader } from '../components/nodes/common/NodeHeader';
import { NodeContent } from '../components/nodes/common/NodeContent';

export function MyNodeUI({ data }) {
  return (
    <NodeContainer>
      <NodeHeader title="My Node" icon="settings" />
      <NodeContent>
        {/* Node content */}
      </NodeContent>
    </NodeContainer>
  );
}
```

## Best Practices

1. **Always use NodeContainer**: All node UIs should use NodeContainer as their base
2. **Consistent header position**: NodeHeader should always be at the top of the node
3. **Descriptive titles**: Use clear, concise titles in NodeHeader
4. **Appropriate icons**: Choose icons that clearly represent the node's purpose
5. **Limited actions**: Keep header actions minimal and focused on essential operations
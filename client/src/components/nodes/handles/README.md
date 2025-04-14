# Node Handle Components

This directory contains components for creating and managing node handles (connection points). These components provide a consistent interface for connecting nodes in the workflow.

## Components

### StandardHandle

`StandardHandle` is a basic handle implementation that extends ReactFlow's Handle component with consistent styling and behavior.

#### Props

```typescript
interface StandardHandleProps {
  type: 'source' | 'target';
  position: Position;
  id: string;
  style?: React.CSSProperties;
  className?: string;
  isConnectable?: boolean;
  onConnect?: (connection: Connection) => void;
}
```

#### Usage

```tsx
import { Position } from 'reactflow';
import { StandardHandle } from '../components/nodes/handles/StandardHandle';

export function MyNodeUI({ isConnectable }) {
  return (
    <div>
      <StandardHandle
        type="target"
        position={Position.Left}
        id="input"
        isConnectable={isConnectable}
      />
      {/* Node content */}
      <StandardHandle
        type="source"
        position={Position.Right}
        id="output"
        isConnectable={isConnectable}
      />
    </div>
  );
}
```

### HandleWithLabel

`HandleWithLabel` combines a handle with a label for better clarity.

#### Props

```typescript
interface HandleWithLabelProps {
  type: 'source' | 'target';
  position: Position;
  id: string;
  label: string;
  isConnectable?: boolean;
  className?: string;
  showLabel?: boolean;
  labelClassName?: string;
}
```

#### Usage

```tsx
import { Position } from 'reactflow';
import { HandleWithLabel } from '../components/nodes/handles/HandleWithLabel';

export function MyNodeUI({ isConnectable }) {
  return (
    <div>
      <HandleWithLabel
        type="target"
        position={Position.Left}
        id="input"
        label="Input"
        isConnectable={isConnectable}
      />
      {/* Node content */}
      <HandleWithLabel
        type="source"
        position={Position.Right}
        id="output"
        label="Output"
        isConnectable={isConnectable}
      />
    </div>
  );
}
```

### DynamicHandles

`DynamicHandles` provides the ability to add/remove handles dynamically, which is useful for nodes that can have a variable number of inputs or outputs.

#### Props

```typescript
interface DynamicHandlesProps {
  type: 'source' | 'target';
  position: Position;
  handles: Array<{
    id: string;
    label: string;
  }>;
  isConnectable?: boolean;
  onAdd?: () => void;
  onRemove?: (id: string) => void;
  maxHandles?: number;
  className?: string;
}
```

#### Usage

```tsx
import { Position } from 'reactflow';
import { DynamicHandles } from '../components/nodes/handles/DynamicHandles';

export function MyNodeUI({ data, isConnectable }) {
  const inputs = data.inputs || [{ id: 'default', label: 'Input' }];
  
  const addInput = () => {
    const newInputId = `input-${inputs.length}`;
    data.onChange({
      ...data,
      inputs: [...inputs, { id: newInputId, label: `Input ${inputs.length}` }]
    });
  };
  
  const removeInput = (id) => {
    data.onChange({
      ...data,
      inputs: inputs.filter(input => input.id !== id)
    });
  };
  
  return (
    <div>
      <DynamicHandles
        type="target"
        position={Position.Left}
        handles={inputs}
        isConnectable={isConnectable}
        onAdd={addInput}
        onRemove={removeInput}
        maxHandles={5}
      />
      {/* Node content */}
      <StandardHandle
        type="source"
        position={Position.Right}
        id="output"
        isConnectable={isConnectable}
      />
    </div>
  );
}
```

## Best Practices

1. **Consistent positioning**: Use Position.Left for input handles and Position.Right for output handles
2. **Clear labeling**: Always provide clear labels for handles
3. **Unique IDs**: Ensure each handle has a unique ID within the node
4. **Limit dynamic handles**: Limit the number of dynamic handles to prevent UI clutter
5. **Visual feedback**: Provide visual feedback when handles are connectable or connected
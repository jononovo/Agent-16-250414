# Node Discovery System

## Architecture

The node discovery system implements a convention-over-configuration pattern that automatically detects and registers workflow nodes based on filesystem structure.

### Core Components

- **NodeRegistry (`client/src/lib/nodeRegistry.ts`)**: Central registry that discovers and indexes all node types.
- **Automatic Discovery**: Uses Vite's `import.meta.glob` for compile-time discovery of node implementations.
- **Dynamic Loading**: Lazy-loads node UI components via dynamic imports to optimize performance.

### Implementation Details

```
nodes/
├── System/          # Core functionality nodes
│   └── {node_type}/
│       ├── definition.ts   # Node metadata and interface
│       ├── ui.tsx          # React component for rendering
│       └── executor.ts     # Runtime logic implementation
└── Custom/          # User-created nodes
    └── {node_type}/
        ├── definition.ts
        ├── ui.tsx
        └── executor.ts
```

## Technical Improvements

1. **Single Source of Truth**: Consolidated node type information into a central registry.
2. **Event Management**: Added proper event propagation handling in NodeHoverMenu with null-safe operations.
3. **React Performance**: Implemented memoization for nodeTypes to prevent unnecessary re-renders.
4. **Type Safety**: Added proper TypeScript interfaces with explicit typing for event handlers.

## Implementation Notes

- The node registry initializes eagerly on import but node components load lazily when used.
- Fallback mechanisms maintain backwards compatibility with legacy node implementations.
- Events in NodeHoverMenu now include proper null checks (`if (e) e.stopPropagation()`) to prevent runtime errors.
- Event handler parameters in action creators include optional MouseEvent parameters.
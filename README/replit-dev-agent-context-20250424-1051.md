# Replit Dev Agent Context - AI Agent Workflow Platform

## System Architecture

### Core Components

- **React-Flow**: Powers interactive node-based workflow visualization
- **TypeScript**: Ensures type-safe development throughout the codebase
- **Express Backend**: API server for workflow persistence and execution
- **Shadcn UI**: Modern component library for UI elements

### Node System
 
The platform now uses an automatic node discovery system:

- **Node Registry**: Central index of all available node types
- **Automatic Discovery**: Vite's glob imports scan the filesystem at build time
- **Folder-Based Structure**:
  - `nodes/System/` - Core system nodes
  - `nodes/Custom/` - User-defined nodes
- **Standardized Node Implementation**: Each node consists of:
  - `definition.ts` - Metadata and type definitions
  - `ui.tsx` - React component for visual rendering
  - `executor.ts` - Runtime logic implementation

### Key Files

- `client/src/lib/nodeRegistry.ts`: Central node type registry
- `client/src/components/flow/FlowEditor.tsx`: Main workflow editor component
- `client/src/components/flow/NodesPanel.tsx`: Node selection sidebar using registry
- `client/src/components/nodes/common/NodeHoverMenu.tsx`: Node action menu component
- `client/src/lib/nodeValidator.ts`: Node validation utility using registry
- `server/services/workflowGenerationService.ts`: AI-assisted workflow generation
- `server/routes.ts`: API endpoints for workflow management and execution

## Recent Improvements

1. **Automatic Node Discovery**: Nodes are dynamically discovered based on folder structure, eliminating manual registration
2. **Performance Optimization**: Node components load lazily with React memoization
3. **Event Handling**: Enhanced event propagation in node action menus with null safety
4. **Node System Consistency**: Folder structure follows convention-over-configuration pattern

## Update History

### 2025-04-24 10:51
- Replaced manual node type registration with automatic discovery system
- Fixed event handling in NodeHoverMenu components
- Implemented performance optimizations for React Flow rendering
- Added comprehensive node category management
- Standardized node folder structure for easier extensibility

### Previous versions
- Initial implementation of node-based workflow editor
- Basic API integration for AI model access
- Fundamental node types for workflow construction
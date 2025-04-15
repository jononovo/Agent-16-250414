# Node Creation Technical Specification

## Overview
This document outlines the technical requirements for creating nodes in the workflow system. It specifies the exact input/output formats, node structure, and validation requirements to ensure compatibility across all node types.

## Node Structure

### Required Files
Each node type must have the following files:
```
client/src/nodes/[node_type]/
├── executor.ts       # Contains core node execution logic
├── index.ts          # Exports node metadata
├── ui.tsx            # React component for node UI
└── schema.ts         # Zod validation schema for node data (optional)
```

### Node Registration
Nodes are automatically discovered and registered via the folder-based system in `client/src/lib/nodeSystem.ts`.

### Node Directory Organization

Nodes are organized in two primary directories:

1. **System Nodes** (`client/src/nodes/System/`)
   - Core functionality nodes that are essential to the platform
   - Standard input/output, flow control, and data manipulation nodes
   - Examples: text_input, text_formatter, decision, delay

2. **Custom Nodes** (`client/src/nodes/Custom/`)
   - Domain-specific or specialized nodes
   - Integration nodes for external services
   - User-defined or project-specific nodes
   - Examples: perplexity_api, openai_api, webhook

This organization helps with:
- Clear separation between core and domain-specific functionality
- Easier maintenance and updates to system nodes
- Better discovery of available nodes by category
- Simplified development workflow for new node types

## Node UI Architecture and Components

### UI Component Structure
All node UI components should follow this consistent structure using the shared component system:

```tsx
import React from 'react';
import { NodeProps } from 'reactflow';
import { Position } from 'reactflow';
import { NodeContainer } from '@/components/nodes/common/NodeContainer';
import { NodeHeader } from '@/components/nodes/common/NodeHeader';
import { NodeContent } from '@/components/nodes/common/NodeContent';
import { HandleWithLabel } from '@/components/nodes/handles/HandleWithLabel';

export function MyNodeComponent({ data, isConnectable, selected }: NodeProps) {
  return (
    <NodeContainer selected={selected}>
      <NodeHeader 
        title="My Node Title" 
        icon={<MyIcon size={16} />}
        description="Optional tooltip description" 
      />
      <NodeContent>
        {/* Input handles on the left side */}
        <HandleWithLabel
          type="target"
          position={Position.Left}
          id="input1"
          label="Input 1"
          isConnectable={isConnectable}
        />
        
        {/* Node-specific controls and settings */}
        <div className="p-3 space-y-3">
          {/* Configuration UI elements */}
        </div>
        
        {/* Output handles on the right side */}
        <HandleWithLabel
          type="source"
          position={Position.Right}
          id="output1"
          label="Output"
          isConnectable={isConnectable}
        />
      </NodeContent>
    </NodeContainer>
  );
}
```

### Core UI Components

The node UI system is organized by feature/functionality:

1. **Common Components** (in `client/src/components/nodes/common/`)
   - `NodeContainer.tsx` - Base container for all nodes with consistent styling
   - `NodeHeader.tsx` - Standard header with title, icon, and optional actions
   - `NodeContent.tsx` - Content area with consistent padding and layout

2. **Handle Components** (in `client/src/components/nodes/handles/`)
   - `HandleWithLabel.tsx` - Connection handle with attached label for clarity

3. **Control Components** (in `client/src/components/nodes/controls/`)
   - Specialized input controls for node configuration

4. **Advanced Components** (in `client/src/components/nodes/advanced/`)
   - Complex components with specialized behavior

5. **API Components** (in `client/src/components/nodes/api/`)
   - Components that interact with external services

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

### Simple-AI.dev UI Examples

#### 1. Node Container and Header

```tsx
<div className={cn(
  'rounded-md border bg-card text-card-foreground shadow-sm transition-all',
  'min-w-[280px] max-w-[320px]',
  selected ? 'border-primary/70 shadow-md' : 'border-border'
)}>
  {/* Node Header */}
  <div className="flex items-center justify-between p-3 border-b border-border bg-muted/40 rounded-t-md">
    <div className="flex items-center gap-2">
      <div className="flex-shrink-0 text-primary">
        <MyIcon size={16} />
      </div>
      <h3 className="text-sm font-medium truncate">Node Title</h3>
    </div>
    <div className="flex items-center gap-1">
      {/* Optional status icons or actions */}
    </div>
  </div>
  
  {/* Node Content */}
  <div className="p-3 space-y-3">
    {/* Node content here */}
  </div>
</div>
```

#### 2. Handle Styling

```tsx
<Handle
  type="target"
  position={Position.Left}
  id="inputId"
  style={{ 
    top: 60, 
    width: '10px', 
    height: '10px', 
    background: 'white',
    border: '2px solid #3b82f6'
  }}
  isConnectable={isConnectable}
/>
<div className="relative py-1 ml-6 my-1 text-xs text-muted-foreground">
  Input Label
</div>
```

#### 3. Editable Handles for Dynamic Interfaces

```tsx
<EditableHandle
  type="target"
  position={Position.Left}
  id={input.id}
  label={input.label}
  isConnectable={isConnectable}
  onLabelChange={handleInputLabelChange}
  onDelete={inputs.length > 1 ? handleDeleteInput : undefined}
/>
<Button 
  variant="ghost" 
  size="sm" 
  className="flex items-center text-xs ml-6 mt-1 h-7 px-2"
  onClick={handleAddInput}
>
  <Plus size={12} className="mr-1" />
  Add Input
</Button>
```

#### 4. Tabbed Interface for Complex Nodes

```tsx
<Tabs value={activeTab} className="w-full">
  <TabsList className="h-7 p-0">
    <TabsTrigger
      value="settings"
      className="h-7 px-2 text-xs"
      onClick={() => setActiveTab('settings')}
    >
      <Settings size={12} className="mr-1" />
      Settings
    </TabsTrigger>
    <TabsTrigger
      value="advanced"
      className="h-7 px-2 text-xs"
      onClick={() => setActiveTab('advanced')}
    >
      <Sliders size={12} className="mr-1" />
      Advanced
    </TabsTrigger>
  </TabsList>
  
  <TabsContent value="settings" className="p-3 space-y-3 mt-0">
    {/* Settings content */}
  </TabsContent>
  
  <TabsContent value="advanced" className="p-3 space-y-3 mt-0">
    {/* Advanced settings content */}
  </TabsContent>
</Tabs>
```

### Node UI Data Management

1. **Data Handling**
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

2. **Validation**
   - UI components should provide visual feedback for validation errors
   - Use the `validator` export to define validation rules:

   ```tsx
   // ui.tsx
   export const validator = (data: MyNodeData): NodeValidationResult => {
     const errors: string[] = [];
     
     if (!data.requiredField) {
       errors.push('Required field is missing');
     }
     
     return {
       valid: errors.length === 0,
       errors
     };
   };
   ```

3. **Default Data**
   - Always provide sensible default values for all node properties
   - Export default data from the UI component:

   ```tsx
   // ui.tsx
   export const defaultData: MyNodeData = {
     property1: '',
     property2: 0,
     property3: false
   };
   ```

4. **Dynamic UI Elements**
   - For nodes with variable inputs/outputs, use React state to manage UI elements
   - When modifying inputs/outputs, call `useUpdateNodeInternals()` to update ReactFlow

## Standardized Output Format

### NodeExecutionData Interface
All node executors MUST return data in the following format:

```typescript
interface NodeExecutionData {
  items: WorkflowItem[];  // Output data items
  meta: {
    startTime: Date;           // When execution started
    endTime: Date;             // When execution completed
    source?: string;           // Source node identifier
    error?: boolean;           // Whether execution resulted in an error
    errorMessage?: string;     // Error message if error is true
    warning?: string;          // Non-critical warning message
    [key: string]: any;        // Additional metadata properties
  };
}

interface WorkflowItem {
  json: any;              // The actual data
  text?: string;          // Text representation
  binary?: {              // For binary data (images, files, etc.)
    mimeType: string;
    data: string;
    filename?: string;
  };
}
```

### Output Creation
Always use the utility functions to create node outputs:

```typescript
// For successful execution
return createNodeOutput(data);

// For error states
return createErrorOutput(errorMessage);
```

## Input Processing

### Input Extraction
Nodes MUST implement extraction logic to handle nested standardized output format:

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

## Node Type-Specific Formats

### Text Processing Nodes
- Input: Accept both string and { text: string } formats
- Output: { text: string } in standardized format

### AI Model Nodes
- Input: Always extract prompt text from standardized format
- Output: Wrap model response in standardized format with response field

### Data Transformation Nodes
- Input: Accept any JSON data structure
- Output: Transformed data in standardized format

## Testing Requirements
1. Create unit tests for both direct inputs and nested standardized inputs
2. Test with empty, string, and object inputs
3. Verify correct extraction of data from standardized format
4. Ensure output complies with standardized format specification

## Common Pitfalls
1. **Failing to extract from nested structure**: Always implement proper extraction logic
2. **Direct output without standardization**: Never return raw data; use `createNodeOutput`
3. **Ignoring input format**: Always handle both direct and standardized formats
4. **Hardcoded special cases**: Avoid workflow-specific logic; use generic extraction
5. **Format incompatibility**: Ensure all node outputs follow the standardized format
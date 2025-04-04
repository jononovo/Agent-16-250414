# Node Implementation Details

This document provides detailed implementation specifications for each specialized node in the workflow system. This serves as a reference for developers who need to rebuild or modify these components.

## Specialized AI Nodes

### 1. Text Input Node

**Component:** `client/src/components/flow/text-input-node.tsx`

**Interface:**
```typescript
export interface TextInputNodeProps {
  data: {
    label?: string;
    config?: {
      value: string;
    };
  };
  isConnectable?: boolean;
  selected?: boolean;
}
```

**Key Features:**
- Text input area for manual text entry
- Label displayed in header
- Output handle for connecting to other nodes
- Expandable/collapsible UI with detailed view
- Dark mode compatible styling

**Sample Implementation:**
```typescript
export function TextInputNode({ data, isConnectable = true, selected }: TextInputNodeProps) {
  return (
    <div className={cn('text-input-node group/node relative border rounded-md bg-background shadow transition-all',
      selected ? 'border-primary ring-2 ring-primary ring-opacity-20' : 'border-border')}>
      <div className="node-header p-3 border-b flex items-center justify-between">
        <div className="font-medium text-sm flex items-center">
          <PenLine className="h-4 w-4 mr-2 text-primary" />
          {data.label || 'Text Input'}
        </div>
      </div>
      <div className="node-body p-3">
        <div className="prose-sm">
          <Textarea
            placeholder="Enter text..."
            value={data.config?.value || ''}
            readOnly
            className="min-h-20 text-sm"
          />
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        isConnectable={isConnectable}
        className="w-3 h-3 right-0 bg-primary border-2 border-background"
      />
    </div>
  );
}
```

### 2. Generate Text Node

**Component:** `client/src/components/flow/generate-text-node.tsx`

**Interface:**
```typescript
export interface GenerateTextNodeProps {
  data: {
    label?: string;
    config?: {
      model: string;
      systemPrompt: string;
      outputs?: string[];
    };
    status?: 'idle' | 'running' | 'complete' | 'error';
  };
  isConnectable?: boolean;
  selected?: boolean;
}
```

**Key Features:**
- Model selector dropdown (supports various AI models)
- System prompt text area
- Status badge (idle/running/complete/error)
- Output display with result formatting
- Input handle for receiving prompts
- Output handle for sending generated text
- Expandable/collapsible UI with detailed view

**Status Indicator Colors:**
- Idle: Default (gray)
- Running: Blue
- Complete: Green
- Error: Red

### 3. Visualize Text Node

**Component:** `client/src/components/flow/visualize-text-node.tsx`

**Interface:**
```typescript
export interface VisualizeTextNodeProps {
  data: {
    label?: string;
    text?: string;
  };
  isConnectable?: boolean;
  selected?: boolean;
}
```

**Key Features:**
- Text display area with formatting
- Input handle for receiving text
- Scrollable content area
- Copy button for text content
- Expandable/collapsible UI with detailed view

### 4. Prompt Crafter Node

**Component:** `client/src/components/flow/prompt-crafter-node.tsx`

**Interface:**
```typescript
export interface PromptCrafterNodeProps {
  data: {
    label?: string;
    template?: string;
    variables?: string[];
  };
  isConnectable?: boolean;
  selected?: boolean;
}
```

**Key Features:**
- Template editor with variable highlighting
- Variable extraction and display
- Input handles for variable substitution
- Output handle for sending crafted prompt
- Live preview of prompt with substitutions
- Expandable/collapsible UI with detailed view

## Node Sidebar Configuration

**Component:** `client/src/components/flow-orchestrator/NodeSidebar.tsx`

**Node Item Structure:**
```typescript
type NodeItem = {
  id: string;        // Node type identifier
  label: string;     // Display name
  icon: React.ReactNode;  // Icon component
  description: string;    // Short description
  category: "triggers" | "actions" | "data" | "ai";  // Tab category
};
```

**Tab Configuration:**
- Default tab: "ai"
- Tab ordering: Triggers, Actions, Data, AI
- Each tab displays filtered nodes based on category
- Search functionality across all node properties

## Edge Connection Implementation

**Handle Types:**
- Source handles (output): Positioned on the right side of nodes
- Target handles (input): Positioned on the left side of nodes

**Custom Handle Styling:**
```css
.react-flow__handle {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: theme('colors.primary.DEFAULT');
  border: 2px solid theme('colors.background.DEFAULT');
}

.react-flow__handle-right {
  right: -6px;
}

.react-flow__handle-left {
  left: -6px;
}
```

This detailed documentation provides all the necessary specifications for rebuilding or extending the node system, covering visual appearance, data structures, and behavior.

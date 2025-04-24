# Node Annotation Feature: Technical Implementation Guide

## Overview

The Node Annotation feature allows users to add, edit, display/hide, and delete notes for any node in the workflow canvas. This feature is implemented at the `DefaultNode` level, ensuring all node types inherit this functionality automatically.

## Data Structure

Notes are stored directly within the node's data object with two key properties:
- `note`: String containing the note text
- `showNote`: Boolean determining visibility of the note on the node

## File Changes

### 1. Default Node UI Implementation (`client/src/nodes/Default/ui.tsx`)

#### 1.1 Import Statements

Ensure these imports are present at the top of the file:

```typescript
import React, { memo, useCallback, useRef, useState, useEffect } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Settings, 
  MoreHorizontal, 
  StickyNote, 
  Eye, 
  EyeOff, 
  AlertTriangle,
  PenLine
} from 'lucide-react';

// Import other components as needed
import NodeContainer from '@/components/nodes/common/NodeContainer';
import NodeHeader from '@/components/nodes/common/NodeHeader';
import NodeContent from '@/components/nodes/common/NodeContent';
import DynamicIcon from '@/components/shared/DynamicIcon';
import NodeHoverMenu, { NodeHoverMenuAction } from '@/components/nodes/common/NodeHoverMenu';
import { 
  createRunAction,
  createAddNoteAction,
  createToggleNoteAction,
  createDuplicateAction,
  createSettingsAction,
  createDeleteAction
} from '@/lib/nodeActions';
```

#### 1.2 Component Props and State Variables

Extract note-related props from the node data and establish state management:

```typescript
const DefaultNode = ({
  id,
  data,
  selected,
  type,
  zIndex,
  xPos,
  yPos,
  dragging,
  onChange,
}: NodeProps) => {
  const {
    label,
    description,
    icon,
    category,
    settings,
    note,           // Extract note from node data
    showNote,       // Extract showNote flag from node data
    isProcessing,
    isComplete,
    hasError,
    errorMessage,
    defaultData,
  } = data;

  // State for note dialog and editing
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [noteText, setNoteText] = useState(note || '');
  const [noteVisibility, setNoteVisibility] = useState(showNote || false);
  
  // Other state variables for node functionality
  const [showSettings, setShowSettings] = useState(false);
  const [showHoverMenu, setShowHoverMenu] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [menuHovering, setMenuHovering] = useState(false);
  const [showContextActions, setShowContextActions] = useState(false);
  
  // Refs for hover detection
  const nodeRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const hoverAreaRef = useRef<HTMLDivElement>(null);
  const hoverTimeout = useRef<NodeJS.Timeout | null>(null);
```

#### 1.3 Event Handlers for Note Functionality

Add the following handlers to manage the note lifecycle:

```typescript
// Handler for opening note edit dialog
const handleEditNote = () => {
  setNoteText(note || ''); // Initialize with existing note
  setNoteVisibility(showNote || false); // Initialize with current visibility
  setNoteDialogOpen(true);
};

// Handler for editing note from UI button
const handleEditNoteFromButton = (e: React.MouseEvent) => {
  e.stopPropagation();
  handleEditNote();
};

// Dispatch a custom event to let the FlowEditor know about note updates
const dispatchNoteUpdateEvent = (noteData: { note?: string, showNote?: boolean }) => {
  const event = new CustomEvent('node-note-update', { 
    detail: { 
      nodeId: id,
      ...noteData
    }
  });
  window.dispatchEvent(event);
  console.log('Dispatched node-note-update event:', id, noteData);
};

// Handler for saving note
const handleSaveNote = () => {
  // Update local component data through onChange if available
  if (onChange) {
    onChange({
      ...data,
      note: noteText,
      showNote: noteVisibility
    });
  }

  // Also dispatch a global event for the FlowEditor to catch and save
  dispatchNoteUpdateEvent({ 
    note: noteText,
    showNote: noteVisibility 
  });
  setNoteDialogOpen(false);
};

// Handler for deleting a note
const handleDeleteNote = () => {
  // Update local component data through onChange if available
  if (onChange) {
    onChange({
      ...data,
      note: '',
      showNote: false
    });
  }
  
  // Also dispatch a global event for the FlowEditor to catch and save
  dispatchNoteUpdateEvent({ 
    note: '',
    showNote: false 
  });
  setNoteDialogOpen(false);
};

// Handler for toggling note visibility
const handleToggleNoteVisibility = () => {
  const newShowNote = !showNote;
  
  // Update local component data through onChange if available
  if (onChange) {
    onChange({
      ...data,
      showNote: newShowNote
    });
  }
  
  // Also dispatch a global event for the FlowEditor to catch and save
  dispatchNoteUpdateEvent({ showNote: newShowNote });
};

// Handler for toggling note visibility from UI button
const handleToggleNoteVisibilityFromButton = (e: React.MouseEvent) => {
  e.stopPropagation();
  handleToggleNoteVisibility();
};
```

#### 1.4 Configure Hover Menu Actions

Configure the hover menu to include the note action:

```typescript
// Create hover menu actions
const hoverMenuActions = [
  createRunAction(handleRunNode),
  createAddNoteAction(handleEditNote),
  createDuplicateAction(handleDuplicateNode),
  createSettingsAction(handleSettingsClickForMenu),
  createDeleteAction(handleDeleteNode)
].filter((action): action is NodeHoverMenuAction => action !== null);
```

#### 1.5 Configure Node Header Actions

Add the note button to the node header:

```typescript
// Create the header actions slot
const headerActions = (
  <div className="flex items-center gap-1.5">
    {getStatusBadge()}
    
    {/* Note button - changes appearance based on whether a note exists */}
    <Button 
      variant="ghost" 
      size="icon" 
      className={cn(
        "h-7 w-7",
        note ? "text-amber-500 hover:text-amber-600" : "text-muted-foreground"
      )}
      onClick={handleEditNoteFromButton}
      title={note ? "Edit note" : "Add note"}
    >
      <StickyNote className="h-3.5 w-3.5" />
    </Button>

    {/* Note visibility toggle removed - now in the note dialog */}
    
    <Popover open={showContextActions} onOpenChange={setShowContextActions}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-7 w-7"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal size={14} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-40 p-1" align="end">
        <div className="flex flex-col gap-1">
          {contextActions.map((action, index) => (
            <Button
              key={index}
              variant="ghost"
              size="sm"
              className="justify-start text-xs h-7"
              onClick={(e) => {
                e.stopPropagation();
                action.action();
                setShowContextActions(false);
              }}
            >
              {action.label}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
    
    <Button 
      variant="ghost" 
      size="icon" 
      className="h-7 w-7"
      onClick={handleSettingsClick}
    >
      <Settings className="h-3.5 w-3.5 text-muted-foreground" />
    </Button>
  </div>
);
```

#### 1.6 Add Note Display Component in Node Content

Add the note display section to the node content:

```typescript
<NodeContent padding="normal">
  {/* Node Type Badge */}
  <div className="flex justify-between items-center">
    <Badge variant="outline" className="text-xs px-2 py-0.5 bg-slate-100/50 dark:bg-slate-800/50">
      {category}
    </Badge>
    
    {/* Settings Summary */}
    {settingsSummary && (
      <div className="flex items-center text-xs text-muted-foreground">
        <Settings className="h-3 w-3 mr-1 inline" />
        <span className="truncate">{settingsSummary}</span>
      </div>
    )}
  </div>
  
  {/* Node Note - only show if showNote is true and there's a note */}
  {showNote && note && (
    <div className="mt-2 p-2 text-xs bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 rounded border border-amber-200 dark:border-amber-800/50">
      <div className="flex items-center justify-between gap-1 mb-1">
        <div className="flex items-center">
          <StickyNote className="h-3 w-3 mr-1" />
          <span className="font-medium">Note</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5 -mr-1 -mt-1"
          onClick={handleEditNoteFromButton}
        >
          <PenLine className="h-3 w-3 text-amber-700 dark:text-amber-400" />
        </Button>
      </div>
      <div className="whitespace-pre-line">{note}</div>
    </div>
  )}
  
  {/* Status messages and errors */}
  {hasError && errorMessage && (
    <div className="p-2 text-xs bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded border border-red-200 dark:border-red-800">
      <div className="flex items-center gap-1 mb-1">
        <AlertTriangle className="h-3 w-3" />
        <span className="font-medium">Error</span>
      </div>
      {errorMessage}
    </div>
  )}
</NodeContent>
```

#### 1.7 Add the Note Dialog Component

Add the dialog component for note editing:

```typescript
{/* Note editing dialog */}
<Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
  <DialogContent className="sm:max-w-md">
    <DialogHeader>
      <DialogTitle>Node Note</DialogTitle>
      <DialogDescription>
        Add notes or comments about this node's purpose or configuration.
      </DialogDescription>
    </DialogHeader>
    
    <div className="py-4 space-y-4">
      <Textarea
        placeholder="Enter note text here..."
        value={noteText}
        onChange={(e) => setNoteText(e.target.value)}
        className="min-h-[120px]"
      />
      
      {/* Note visibility toggle */}
      <div className="flex items-center space-x-2">
        <div className="flex-1 text-sm">Show note on node</div>
        <div 
          className="cursor-pointer flex items-center" 
          onClick={() => setNoteVisibility(!noteVisibility)}
        >
          <div className={cn(
            "w-10 h-5 rounded-full transition-colors flex items-center",
            noteVisibility ? "bg-amber-500" : "bg-gray-300"
          )}>
            <div className={cn(
              "w-4 h-4 rounded-full bg-white transform transition-transform mx-0.5",
              noteVisibility ? "translate-x-5" : ""
            )} />
          </div>
          <div className="ml-2 text-sm">
            {noteVisibility ? 
              <span className="text-amber-500">Visible</span> : 
              <span className="text-gray-500">Hidden</span>}
          </div>
        </div>
      </div>
    </div>
    
    <DialogFooter className="flex justify-between sm:justify-between">
      <div className="flex gap-2">
        <Button
          type="button"
          variant="destructive"
          onClick={handleDeleteNote}
          className="bg-red-600 hover:bg-red-700"
          disabled={!note && noteText.trim() === ''}
        >
          Delete
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => setNoteDialogOpen(false)}
        >
          Cancel
        </Button>
      </div>
      <Button
        type="button"
        onClick={handleSaveNote}
        className={note ? '' : 'bg-amber-600 hover:bg-amber-700'}
      >
        Save Note
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### 2. Flow Editor Integration (`client/src/components/flow/FlowEditor.tsx`)

Add an event listener to the FlowEditor component to handle node note updates and save them:

```typescript
// In the imports section
import React, { useState, useCallback, useRef, useEffect } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  Panel,
  Node,
  Edge,
  Connection,
  useReactFlow,
  NodeChange,
  EdgeChange,
  useOnSelectionChange,
} from 'reactflow';

// In the FlowEditor component
const FlowEditor = ({ workflowId, readOnly = false }) => {
  const [workflow, setWorkflow] = useState(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  
  // Other state variables and refs
  
  // Add this effect for handling node notes
  useEffect(() => {
    // Add event listener for node note updates
    const handleNodeNoteUpdate = (event: CustomEvent) => {
      const { nodeId, note, showNote } = event.detail;
      
      console.log('Handling note update for node:', nodeId, 'Setting showNote:', showNote);
      
      // Update the nodes state
      setNodes((nds) => 
        nds.map((node) => {
          if (node.id === nodeId) {
            return {
              ...node,
              data: {
                ...node.data,
                ...(note !== undefined ? { note } : {}),
                ...(showNote !== undefined ? { showNote } : {})
              }
            };
          }
          return node;
        })
      );
      
      // Find the current node to get its latest data
      const updatedNodes = nodes.map(node => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              ...(note !== undefined ? { note } : {}),
              ...(showNote !== undefined ? { showNote } : {})
            }
          };
        }
        return node;
      });
      
      // Save the updated workflow
      if (workflow) {
        saveWorkflow({
          ...workflow,
          flowData: {
            nodes: updatedNodes,
            edges
          }
        });
      }
    };

    // Add event listener
    window.addEventListener('node-note-update', handleNodeNoteUpdate as EventListener);
    
    // Clean up
    return () => {
      window.removeEventListener('node-note-update', handleNodeNoteUpdate as EventListener);
    };
  }, [nodes, edges, workflow, saveWorkflow]);
  
  // saveWorkflow function - update to match your API structure
  const saveWorkflow = async (workflowData) => {
    if (!workflowData || !workflowId) return;
    
    try {
      const response = await fetch(`/api/workflows/${workflowId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(workflowData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save workflow');
      }
      
      const updatedWorkflow = await response.json();
      setWorkflow(updatedWorkflow);
      console.log('Workflow saved successfully');
    } catch (error) {
      console.error('Error saving workflow:', error);
    }
  };
  
  // Rest of the FlowEditor component
}
```

### 3. Node Action Creators (`client/src/lib/nodeActions.ts`)

Create or update the node action creators to include note-related actions:

```typescript
import { 
  Play, 
  Copy, 
  StickyNote, 
  Settings, 
  Trash2, 
  Eye, 
  EyeOff 
} from 'lucide-react';

// Define the NodeHoverMenuAction type if not already defined elsewhere
export interface NodeHoverMenuAction {
  id: string;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}

/**
 * Create an action for running a node
 */
export const createRunAction = (onClick: () => void): NodeHoverMenuAction => {
  return {
    id: 'run',
    icon: <Play className="w-3 h-3" />,
    label: 'Run Node',
    onClick
  };
};

/**
 * Create an action for adding/editing a note
 */
export const createAddNoteAction = (onClick: () => void): NodeHoverMenuAction => {
  return {
    id: 'add-note',
    icon: <StickyNote className="w-3 h-3" />,
    label: 'Add/Edit Note',
    onClick
  };
};

/**
 * Create an action for toggling note visibility
 */
export const createToggleNoteAction = (
  visible: boolean, 
  onClick: () => void
): NodeHoverMenuAction => {
  return {
    id: 'toggle-note',
    icon: visible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />,
    label: visible ? 'Hide Note' : 'Show Note',
    onClick
  };
};

/**
 * Create an action for duplicating a node
 */
export const createDuplicateAction = (onClick: () => void): NodeHoverMenuAction => {
  return {
    id: 'duplicate',
    icon: <Copy className="w-3 h-3" />,
    label: 'Duplicate',
    onClick
  };
};

/**
 * Create an action for node settings
 */
export const createSettingsAction = (onClick: () => void): NodeHoverMenuAction => {
  return {
    id: 'settings',
    icon: <Settings className="w-3 h-3" />,
    label: 'Settings',
    onClick
  };
};

/**
 * Create an action for deleting a node
 */
export const createDeleteAction = (onClick: () => void): NodeHoverMenuAction => {
  return {
    id: 'delete',
    icon: <Trash2 className="w-3 h-3" />,
    label: 'Delete',
    onClick
  };
};
```

### 4. Node Hover Menu Component (`client/src/components/nodes/common/NodeHoverMenu.tsx`)

Ensure the NodeHoverMenu component handles the note actions correctly:

```typescript
import React from 'react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export interface NodeHoverMenuAction {
  id: string;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}

interface NodeHoverMenuProps {
  nodeId: string;
  actions: NodeHoverMenuAction[];
  position?: 'left' | 'right' | 'top' | 'bottom';
}

const NodeHoverMenu = ({ 
  nodeId, 
  actions,
  position = 'right' 
}: NodeHoverMenuProps) => {
  return (
    <Card className={cn(
      "absolute p-1 shadow-lg z-50",
      position === 'left' && "right-full mr-1",
      position === 'right' && "left-full ml-1",
      position === 'top' && "bottom-full mb-1",
      position === 'bottom' && "top-full mt-1",
    )}>
      <div className="flex flex-col gap-1">
        {actions.map(action => (
          <Button
            key={action.id}
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={action.onClick}
            title={action.label}
          >
            {action.icon}
          </Button>
        ))}
      </div>
    </Card>
  );
};

export default NodeHoverMenu;
```

### 5. Type Definitions for Node Data

Update your node type definitions to include note properties:

```typescript
// In client/src/types/nodes.ts or similar

export interface DefaultNodeData {
  // Basic node properties
  label: string;
  description: string;
  icon: any;
  category: string;
  
  // Node settings
  settings?: Record<string, any>;
  defaultData?: Record<string, any>;
  
  // Note properties
  note?: string;
  showNote?: boolean;
  
  // Node status
  isProcessing?: boolean;
  isComplete?: boolean;
  hasError?: boolean;
  errorMessage?: string;
  
  // Node interaction handlers
  onRun?: (nodeId: string) => void;
  onDuplicate?: (nodeId: string) => void;
  onDelete?: (nodeId: string) => void;
  onSettingsChange?: (settings: Record<string, any>) => void;
}
```

## Data Flow and Persistence

### 1. Data Flow

The note feature follows this data flow pattern:

1. User interacts with note UI (add/edit/delete/toggle visibility)
2. Local state is updated in the DefaultNode component
3. Data is propagated in two ways:
   - Local component update via `onChange` handler
   - Global event dispatch via custom 'node-note-update' event
4. FlowEditor catches the event and:
   - Updates its internal node state
   - Saves the updated workflow to the backend

### 2. Data Persistence

The notes are persisted in the workflow data structure as part of each node's data object. The workflow is saved to the backend whenever a note is added, edited, or its visibility is toggled.

Example workflow data structure with notes:

```json
{
  "id": 10,
  "name": "Example Workflow",
  "description": "Workflow with node notes",
  "flowData": {
    "nodes": [
      {
        "id": "text_input-123456",
        "type": "text_input",
        "position": {"x": 75, "y": 150},
        "data": {
          "label": "Text Input",
          "description": "Add text input to your workflow",
          "icon": {},
          "category": "ai",
          "note": "This input accepts multi-line text from the user",
          "showNote": true
        }
      },
      {
        "id": "data_transform-789012",
        "type": "data_transform",
        "position": {"x": -60, "y": -30},
        "data": {
          "label": "Data Transform",
          "description": "Transforms data structure",
          "icon": {},
          "category": "data",
          "settings": {},
          "note": "This transforms user input into JSON format",
          "showNote": false
        }
      }
    ],
    "edges": []
  }
}
```

## Key Design Decisions

1. **Event-Based Architecture**: Using custom events keeps components decoupled and allows for a clean separation of concerns.

2. **Dual UI Entry Points**: Notes can be added/edited via both the node header and hover menu, providing multiple intuitive ways for users to access the feature.

3. **Visibility Control**: The visibility toggle is placed in the note dialog rather than on the node itself, reducing UI clutter while still providing control.

4. **Delete Functionality**: Complete note removal is supported, giving users full control over their annotations.

5. **Consistent Styling**: Note display uses a distinctive amber color scheme to stand out from other node elements while maintaining visual harmony.

6. **Whitespace Handling**: Note text is displayed with `whitespace-pre-line` to preserve line breaks and formatting entered by users.

## Implementation Tips

1. **Testing**: After implementation, test the following scenarios:
   - Adding a new note to a node
   - Editing an existing note
   - Toggling visibility on/off
   - Deleting a note
   - Refreshing the page to verify persistence

2. **Event Debugging**: If notes aren't being saved, check that the event dispatch and listeners are working correctly. Use console logs at each step.

3. **Component Updates**: If changes to notes aren't reflecting in the UI, check that state updates and re-renders are happening properly.

4. **Workflow Saving**: Ensure the workflow saving mechanism is triggered after note updates and that it includes the note data.

## Compatibility

This implementation is designed to work with any node that inherits from the DefaultNode component. No changes are needed for individual node types as the feature is entirely implemented at the base level.
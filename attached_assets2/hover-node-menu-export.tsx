/**
 * Hover Node Menu - Complete Export
 * =================================
 * 
 * This file contains a complete export of the Hover Node Menu component that can be
 * applied systemwide to all nodes in a ReactFlow-based workflow canvas.
 * 
 * Features:
 * - Appears on hover after a configurable delay
 * - Provides 4 standard actions: Duplicate, Delete, Settings, Edit/Modify
 * - Fully customizable with additional actions
 * - Proper positioning relative to nodes
 * - Clean animation and styling
 * - TypeScript support with proper interfaces
 * 
 * INTEGRATION GUIDE:
 * -----------------
 * 1. Dependencies:
 *    - React for component functionality
 *    - ReactFlow for node integration
 *    - Lucide-React (or similar) for icons
 *    - Tailwind CSS for styling (or adapt styles to your CSS solution)
 * 
 * 2. Integration steps:
 *    a. Import the HoverNodeMenu and NodeHoverController components
 *    b. Wrap your ReactFlow nodes with the NodeHoverController
 *    c. Pass appropriate callback functions for actions
 *    d. Customize styling as needed
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Node, useReactFlow } from 'reactflow';
import { Copy, Trash2, Settings, Edit } from 'lucide-react';

/**
 * Types and Interfaces
 */

// Props for the HoverNodeMenu component
export interface HoverNodeMenuProps {
  nodeId: string;
  nodeType: string;
  nodeData: any;
  position: {
    x: number;
    y: number;
  };
  // Callback functions for menu actions
  onDuplicate?: () => void;
  onDelete?: () => void;
  onSettings?: () => void;
  onEdit?: () => void;
  // Optional custom actions
  customActions?: Array<{
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    className?: string;
  }>;
  // Optional styling
  menuClassName?: string;
  buttonClassName?: string;
  zIndex?: number;
}

// Props for the NodeHoverController - wraps nodes to add hover functionality
export interface NodeHoverControllerProps {
  children: React.ReactNode;
  nodeId: string;
  nodeType: string;
  nodeData: any;
  position: {
    x: number;
    y: number;
  };
  // Hover settings
  hoverDelay?: number;
  hoverPadding?: string;
  // Callback functions
  onDuplicate?: () => void;
  onDelete?: () => void;
  onSettings?: () => void;
  onEdit?: () => void;
  // Optional custom actions
  customActions?: Array<{
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    className?: string;
  }>;
  // Optional styling
  menuClassName?: string;
  buttonClassName?: string;
  zIndex?: number;
}

/**
 * HoverNodeMenu Component
 * 
 * This component renders the menu that appears next to a node when hovered.
 * It provides buttons for common node operations.
 */
export const HoverNodeMenu: React.FC<HoverNodeMenuProps> = ({
  nodeId,
  nodeType,
  nodeData,
  position,
  onDuplicate,
  onDelete,
  onSettings,
  onEdit,
  customActions = [],
  menuClassName = '',
  buttonClassName = '',
  zIndex = 50
}) => {
  // Base classes for the menu and buttons
  const defaultMenuClass = "absolute right-0 top-0 translate-x-[calc(100%)] bg-white rounded-md shadow-lg border border-slate-200 p-1 flex flex-col gap-1";
  const defaultButtonClass = "h-8 w-8 hover:bg-slate-100 rounded-md p-1.5 flex items-center justify-center transition-colors";
  
  return (
    <div 
      className={`${defaultMenuClass} ${menuClassName}`}
      style={{ zIndex }}
      data-testid={`hover-menu-${nodeId}`}
    >
      {/* Duplicate button */}
      {onDuplicate && (
        <button 
          type="button"
          className={`${defaultButtonClass} ${buttonClassName}`}
          onClick={(e) => {
            e.stopPropagation();
            onDuplicate();
          }}
          title="Duplicate node"
        >
          <Copy className="h-4 w-4" />
        </button>
      )}
      
      {/* Delete button */}
      {onDelete && (
        <button 
          type="button"
          className={`${defaultButtonClass} ${buttonClassName} text-red-500 hover:text-red-600`}
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          title="Delete node"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
      
      {/* Settings button */}
      {onSettings && (
        <button 
          type="button"
          className={`${defaultButtonClass} ${buttonClassName} text-indigo-500`}
          onClick={(e) => {
            e.stopPropagation();
            onSettings();
          }}
          title="Node settings"
        >
          <Settings className="h-4 w-4" />
        </button>
      )}
      
      {/* Edit button */}
      {onEdit && (
        <button 
          type="button"
          className={`${defaultButtonClass} ${buttonClassName} text-indigo-500`}
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          title="Edit node"
        >
          <Edit className="h-4 w-4" />
        </button>
      )}
      
      {/* Render custom actions if provided */}
      {customActions.map((action, index) => (
        <button
          key={`custom-action-${index}`}
          type="button"
          className={`${defaultButtonClass} ${buttonClassName} ${action.className || ''}`}
          onClick={(e) => {
            e.stopPropagation();
            action.onClick();
          }}
          title={action.label}
        >
          {action.icon}
        </button>
      ))}
    </div>
  );
};

/**
 * NodeHoverController Component
 * 
 * This component wraps a node and adds hover functionality to show/hide the menu.
 * It handles timing, positioning, and event handling.
 */
export const NodeHoverController: React.FC<NodeHoverControllerProps> = ({
  children,
  nodeId,
  nodeType,
  nodeData,
  position,
  hoverDelay = 500,
  hoverPadding = '0 20px 0 0',
  onDuplicate,
  onDelete,
  onSettings,
  onEdit,
  customActions,
  menuClassName,
  buttonClassName,
  zIndex
}) => {
  const [showHoverMenu, setShowHoverMenu] = useState(false);
  const [hoverTimer, setHoverTimer] = useState<NodeJS.Timeout | null>(null);
  const nodeRef = useRef<HTMLDivElement>(null);
  
  // Function to handle hover start
  const handleHoverStart = useCallback(() => {
    // Set a timeout to show the menu after the specified delay
    const timer = setTimeout(() => {
      setShowHoverMenu(true);
    }, hoverDelay);
    
    setHoverTimer(timer);
  }, [hoverDelay]);
  
  // Function to handle hover end
  const handleHoverEnd = useCallback(() => {
    // Clear the timeout if the user stops hovering before the menu appears
    if (hoverTimer) {
      clearTimeout(hoverTimer);
      setHoverTimer(null);
    }
    setShowHoverMenu(false);
  }, [hoverTimer]);
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimer) {
        clearTimeout(hoverTimer);
      }
    };
  }, [hoverTimer]);
  
  return (
    <div 
      ref={nodeRef}
      onMouseEnter={handleHoverStart}
      onMouseLeave={handleHoverEnd}
      className="relative"
      // Extended hoverable area with padding to create a seamless interaction between node and menu
      style={{ padding: showHoverMenu ? hoverPadding : '0' }}
      data-nodeid={nodeId}
      data-nodetype={nodeType}
    >
      {showHoverMenu && (
        <HoverNodeMenu 
          nodeId={nodeId}
          nodeType={nodeType}
          nodeData={nodeData}
          position={position}
          onDuplicate={onDuplicate}
          onDelete={onDelete}
          onSettings={onSettings}
          onEdit={onEdit}
          customActions={customActions}
          menuClassName={menuClassName}
          buttonClassName={buttonClassName}
          zIndex={zIndex}
        />
      )}
      {children}
    </div>
  );
};

/**
 * Helper Functions
 */

/**
 * Creates a duplicate of a node with a new ID
 * 
 * @param flowInstance ReactFlow instance
 * @param nodeId ID of the node to duplicate
 * @param offset Position offset for the new node
 * @param newIdPrefix Optional prefix for the new node ID
 */
export const duplicateNode = (
  flowInstance: any,
  nodeId: string,
  offset: { x: number, y: number } = { x: 20, y: 20 },
  newIdPrefix: string = ''
): void => {
  if (!flowInstance) return;
  
  // Find the node to duplicate
  const nodes = flowInstance.getNodes();
  const nodeToDuplicate = nodes.find((n: Node) => n.id === nodeId);
  
  if (!nodeToDuplicate) return;
  
  // Create a new position with offset
  const newPosition = {
    x: (nodeToDuplicate.position?.x || 0) + offset.x,
    y: (nodeToDuplicate.position?.y || 0) + offset.y
  };
  
  // Generate a new ID
  const timestamp = Date.now();
  const newId = newIdPrefix ? 
    `${newIdPrefix}-${timestamp}` : 
    `${nodeToDuplicate.type}-${timestamp}`;
  
  // Clone the node with the new ID and position
  const newNode = {
    id: newId,
    type: nodeToDuplicate.type,
    position: newPosition,
    data: { ...nodeToDuplicate.data }
  };
  
  // Add the new node to the flow
  flowInstance.addNodes(newNode);
};

/**
 * Deletes a node from the ReactFlow instance
 * 
 * @param flowInstance ReactFlow instance
 * @param nodeId ID of the node to delete
 */
export const deleteNode = (
  flowInstance: any,
  nodeId: string
): void => {
  if (!flowInstance) return;
  
  flowInstance.deleteElements({ nodes: [{ id: nodeId }] });
};

/**
 * Opens settings for a node by dispatching a custom event
 * 
 * @param nodeId ID of the node to open settings for
 * @param customEventName Optional custom event name
 */
export const openNodeSettings = (
  nodeId: string,
  customEventName: string = 'node-settings-open'
): void => {
  // Dispatch a custom event that the parent application listens for
  const event = new CustomEvent(customEventName, { 
    detail: { nodeId }
  });
  window.dispatchEvent(event);
};

/**
 * Opens the node editor by dispatching a custom event
 * 
 * @param nodeId ID of the node to edit
 * @param nodeType Type of the node
 * @param position Position of the node
 * @param nodeData Data of the node
 * @param customEventName Optional custom event name
 */
export const editNode = (
  nodeId: string,
  nodeType: string,
  position: { x: number, y: number },
  nodeData: any,
  customEventName: string = 'node-edit'
): void => {
  // Create an event with all the node details
  const nodeDetails = {
    id: nodeId,
    type: nodeType,
    position,
    data: { ...nodeData }
  };
  
  // Dispatch a custom event
  const event = new CustomEvent(customEventName, {
    detail: { nodeDetails }
  });
  window.dispatchEvent(event);
};

/**
 * Usage Examples
 */

/**
 * Example 1: Basic Usage with a Custom Node Component
 * 
 * This example shows how to use the NodeHoverController to wrap a node component.
 */
export const ExampleNodeWithHoverMenu = ({ data, id, type, xPos, yPos, selected }: any) => {
  const reactFlowInstance = useReactFlow();
  
  // Node action callbacks
  const handleDuplicate = useCallback(() => {
    duplicateNode(reactFlowInstance, id);
  }, [reactFlowInstance, id]);
  
  const handleDelete = useCallback(() => {
    deleteNode(reactFlowInstance, id);
  }, [reactFlowInstance, id]);
  
  const handleSettings = useCallback(() => {
    openNodeSettings(id);
  }, [id]);
  
  const handleEdit = useCallback(() => {
    editNode(id, type, { x: xPos, y: yPos }, data);
  }, [id, type, xPos, yPos, data]);
  
  return (
    <NodeHoverController
      nodeId={id}
      nodeType={type}
      nodeData={data}
      position={{ x: xPos, y: yPos }}
      onDuplicate={handleDuplicate}
      onDelete={handleDelete}
      onSettings={handleSettings}
      onEdit={handleEdit}
    >
      {/* Your actual node content here */}
      <div className={`p-4 border rounded-md bg-white ${selected ? 'ring-2 ring-blue-500' : ''}`}>
        <h3 className="font-medium">{data.label || 'Node'}</h3>
        <p className="text-sm text-gray-500">{data.description || 'Node description'}</p>
      </div>
    </NodeHoverController>
  );
};

/**
 * Example 2: System-wide Integration
 * 
 * This example shows how to use the HoverNodeMenu system-wide by wrapping
 * nodes in a higher-order component.
 */
export const withHoverMenu = (NodeComponent: React.ComponentType<any>) => {
  return (props: any) => {
    const reactFlowInstance = useReactFlow();
    const { id, type, data, xPos, yPos } = props;
    
    // Node action callbacks
    const handleDuplicate = useCallback(() => {
      duplicateNode(reactFlowInstance, id);
    }, [reactFlowInstance, id]);
    
    const handleDelete = useCallback(() => {
      deleteNode(reactFlowInstance, id);
    }, [reactFlowInstance, id]);
    
    const handleSettings = useCallback(() => {
      openNodeSettings(id);
    }, [id]);
    
    const handleEdit = useCallback(() => {
      editNode(id, type, { x: xPos, y: yPos }, data);
    }, [id, type, xPos, yPos, data]);
    
    return (
      <NodeHoverController
        nodeId={id}
        nodeType={type}
        nodeData={data}
        position={{ x: xPos, y: yPos }}
        onDuplicate={handleDuplicate}
        onDelete={handleDelete}
        onSettings={handleSettings}
        onEdit={handleEdit}
      >
        <NodeComponent {...props} />
      </NodeHoverController>
    );
  };
};

/**
 * Example 3: System-wide Registration with NodeTypes
 * 
 * This example shows how to register hover menu-enabled nodes in ReactFlow's nodeTypes.
 */
export const setupNodesWithHoverMenu = (nodeTypes: Record<string, React.ComponentType<any>>) => {
  const enhancedNodeTypes: Record<string, React.ComponentType<any>> = {};
  
  // Apply hover menu to each node type
  Object.entries(nodeTypes).forEach(([type, Component]) => {
    enhancedNodeTypes[type] = withHoverMenu(Component);
  });
  
  return enhancedNodeTypes;
};

/**
 * SYSTEMS INTEGRATION INSTRUCTIONS
 * 
 * There are three main approaches to integrate this Hover Node Menu system into your workflow:
 * 
 * 1. Individual Component Integration:
 *    - Wrap each node component individually with NodeHoverController
 *    - Good for selective application of hover menus
 *    
 *    Example:
 *    ```tsx
 *    const MyNode = (props) => {
 *      const { id, type, data, xPos, yPos } = props;
 *      
 *      return (
 *        <NodeHoverController nodeId={id} nodeType={type} nodeData={data} position={{ x: xPos, y: yPos }} ...callbacks>
 *          <YourNodeContent {...props} />
 *        </NodeHoverController>
 *      );
 *    };
 *    ```
 * 
 * 2. Higher-Order Component Approach:
 *    - Use the withHoverMenu HOC to wrap node components
 *    - Good for applying consistent hover menus to many node types
 *    
 *    Example:
 *    ```tsx
 *    // Enhanced node types
 *    const nodeTypes = {
 *      default: withHoverMenu(DefaultNode),
 *      input: withHoverMenu(InputNode),
 *      output: withHoverMenu(OutputNode),
 *      // ...more node types
 *    };
 *    
 *    // Use in ReactFlow
 *    <ReactFlow nodeTypes={nodeTypes} ... />
 *    ```
 * 
 * 3. Complete System Integration:
 *    - Use setupNodesWithHoverMenu to enhance all node types at once
 *    - Best for applying hover menus system-wide with minimal code changes
 *    
 *    Example:
 *    ```tsx
 *    const baseNodeTypes = {
 *      default: DefaultNode,
 *      input: InputNode,
 *      output: OutputNode,
 *      // ...more node types
 *    };
 *    
 *    // Enhanced node types with hover menus
 *    const nodeTypes = setupNodesWithHoverMenu(baseNodeTypes);
 *    
 *    // Use in ReactFlow
 *    <ReactFlow nodeTypes={nodeTypes} ... />
 *    ```
 * 
 * EVENT HANDLING:
 * 
 * This system uses custom events for settings and editing actions:
 * 
 * ```tsx
 * // Listen for settings events
 * useEffect(() => {
 *   const handleSettingsOpen = (e: CustomEvent) => {
 *     const { nodeId } = e.detail;
 *     // Open your settings panel for this node
 *     setSelectedNodeId(nodeId);
 *     setSettingsPanelOpen(true);
 *   };
 *   
 *   window.addEventListener('node-settings-open', handleSettingsOpen as EventListener);
 *   return () => {
 *     window.removeEventListener('node-settings-open', handleSettingsOpen as EventListener);
 *   };
 * }, []);
 * 
 * // Listen for edit events
 * useEffect(() => {
 *   const handleNodeEdit = (e: CustomEvent) => {
 *     const { nodeDetails } = e.detail;
 *     // Open your node editor with these details
 *     setEditingNode(nodeDetails);
 *     setEditorOpen(true);
 *   };
 *   
 *   window.addEventListener('node-edit', handleNodeEdit as EventListener);
 *   return () => {
 *     window.removeEventListener('node-edit', handleNodeEdit as EventListener);
 *   };
 * }, []);
 * ```
 * 
 * STYLING CUSTOMIZATION:
 * 
 * The hover menu styling can be customized using the className props:
 * - menuClassName: Applied to the menu container
 * - buttonClassName: Applied to the action buttons
 * 
 * Example:
 * ```tsx
 * <NodeHoverController
 *   menuClassName="my-custom-menu-class"
 *   buttonClassName="my-custom-button-class"
 *   ...other props
 * >
 *   {children}
 * </NodeHoverController>
 * ```
 */

// Export default
export default {
  HoverNodeMenu,
  NodeHoverController,
  duplicateNode,
  deleteNode,
  openNodeSettings,
  editNode,
  withHoverMenu,
  setupNodesWithHoverMenu
};
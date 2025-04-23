/**
 * Text Input Node UI Component
 * 
 * This file contains the React component used to render the text input node
 * in the workflow editor.
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Type, Settings, MoreHorizontal, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle 
} from '@/components/ui/sheet';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

import { NodeContainer } from '@/components/nodes/common/NodeContainer';
import { NodeHeader } from '@/components/nodes/common/NodeHeader';
import { NodeContent } from '@/components/nodes/common/NodeContent';
import { NodeSettingsForm } from '@/components/nodes/common/NodeSettingsForm';
import NodeHoverMenu, { 
  createDuplicateAction, 
  createDeleteAction, 
  createSettingsAction,
  createRunAction
} from '@/components/nodes/common/NodeHoverMenu';

// Node interface
interface TextInputNodeData {
  inputText: string;
  label: string;
  placeholder: string;
  required?: boolean;
  onChange?: (data: any) => void;
  onRun?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onDelete?: (id: string) => void;
  description?: string;
  category?: string;
  isProcessing?: boolean;
  isComplete?: boolean;
  hasError?: boolean;
  errorMessage?: string;
  [key: string]: any;
}

// Settings structure
interface NodeSettings {
  title?: string;
  fields?: Array<{
    key: string;
    label: string;
    type: 'text' | 'number' | 'select' | 'checkbox' | 'textarea' | 'slider';
    options?: Array<{ label: string; value: string | number }>;
    description?: string;
    min?: number;
    max?: number;
    step?: number;
  }>;
}

// Default data for the node
export const defaultData: TextInputNodeData = {
  inputText: '',
  label: 'Input Text',
  placeholder: 'Enter text here...',
  required: false,
  description: 'Text input node for workflows',
  category: 'input'
};

// Validator for the node data
export const validator = (data: TextInputNodeData) => {
  const errors = [];
  
  if (!data.inputText && data.required) {
    errors.push('Input text is required');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

// React component for the node
export const component = ({ data, id, isConnectable, selected }: NodeProps<TextInputNodeData>) => {
  // States for component functionality
  const [showSettings, setShowSettings] = useState(false);
  const [showContextActions, setShowContextActions] = useState(false);
  const [showHoverMenu, setShowHoverMenu] = useState(false);
  const [hoverTimer, setHoverTimer] = useState<NodeJS.Timeout | null>(null);
  
  // Refs for hover management
  const nodeRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const hoverDelay = 300; // ms before showing menu
  const hoverAreaRef = useRef<HTMLDivElement>(null);
  
  // Combine default data with passed data
  const nodeData = { ...defaultData, ...data };
  
  // Local state for the input text
  const [inputText, setInputText] = useState<string>(
    nodeData.inputText || defaultData.inputText
  );
  
  // Function to handle hover start
  const handleHoverStart = useCallback(() => {
    // Set a timeout to show the menu after hovering for specified delay
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
  
  // Handle menu hovering to keep it visible when cursor moves from node to menu
  const handleMenuHoverStart = useCallback(() => {
    setShowHoverMenu(true);
  }, []);
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimer) {
        clearTimeout(hoverTimer);
      }
    };
  }, [hoverTimer]);
  
  // This adds additional hooks to connect with the FlowEditor
  useEffect(() => {
    // Add a global event listener for node settings
    const handleNodeSettings = () => {
      const event = new CustomEvent('node-settings-open', { 
        detail: { nodeId: id }
      });
      window.dispatchEvent(event);
    };
    
    // Add the settings click handler to the node data
    if (nodeData.onSettingsClick === undefined) {
      // Only add if it doesn't already exist
      if (nodeData.onChange) {
        nodeData.onChange({
          ...nodeData,
          onSettingsClick: handleNodeSettings
        });
      }
    }
  }, [id, nodeData]);
  
  // Handle change in the input field
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newText = e.target.value;
    setInputText(newText);
    
    // Call the onChange handler if provided
    if (nodeData.onChange) {
      nodeData.onChange({
        ...nodeData,
        inputText: newText
      });
    }
  };
  
  // Settings icon click handler
  const handleSettingsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // If we have an onSettingsClick function provided by FlowEditor, use it
    if (nodeData.onSettingsClick) {
      nodeData.onSettingsClick();
    } else {
      // Otherwise, fall back to local settings drawer
      setShowSettings(true);
      
      // Also emit the node-settings-open event for FlowEditor to catch
      const event = new CustomEvent('node-settings-open', { 
        detail: { nodeId: id }
      });
      window.dispatchEvent(event);
    }
  };
  
  // Settings submission handler
  const handleSubmitSettings = (updatedData: any) => {
    // Update node data when settings are changed
    if (nodeData.onChange) {
      // If the updated data contains settingsData, handle it properly
      if (updatedData.settingsData) {
        nodeData.onChange({
          ...nodeData,
          settingsData: {
            ...(nodeData.settingsData || {}),
            ...updatedData.settingsData
          }
        });
      } else {
        // Otherwise apply the updates directly
        nodeData.onChange({
          ...nodeData,
          ...updatedData
        });
      }
    }
    
    setShowSettings(false);
  };
  
  // Node action handlers
  const handleRunNode = () => {
    console.log('Run node:', id);
    if (nodeData.onRun) {
      nodeData.onRun(id);
    }
  };
  
  const handleDuplicateNode = () => {
    console.log('Duplicate node:', id);
    if (nodeData.onDuplicate) {
      nodeData.onDuplicate(id);
    }
  };
  
  const handleDeleteNode = () => {
    console.log('Delete node:', id);
    if (nodeData.onDelete) {
      nodeData.onDelete(id);
    }
  };
  
  // Settings click handler for the menu 
  const handleSettingsClickForMenu = () => {
    // Use the same logic as handleSettingsClick but without needing the event parameter
    if (nodeData.onSettingsClick) {
      nodeData.onSettingsClick();
    } else {
      setShowSettings(true);
      
      // Also emit the node-settings-open event for FlowEditor to catch
      const event = new CustomEvent('node-settings-open', { 
        detail: { nodeId: id }
      });
      window.dispatchEvent(event);
    }
  };
  
  // Create hover menu actions
  const hoverMenuActions = [
    createRunAction(handleRunNode),
    createDuplicateAction(handleDuplicateNode),
    createSettingsAction(handleSettingsClickForMenu),
    createDeleteAction(handleDeleteNode)
  ];
  
  // Create context actions for the node (dropdown menu)
  const contextActions = [
    { label: 'Run Node', action: handleRunNode },
    { label: 'Duplicate', action: handleDuplicateNode },
    { label: 'Delete', action: handleDeleteNode }
  ];
  
  // Create node settings
  const settings: NodeSettings = {
    title: `${nodeData.label} Settings`,
    fields: [
      {
        key: 'label',
        label: 'Node Label',
        type: 'text',
        description: 'Display name for this node'
      },
      {
        key: 'placeholder',
        label: 'Placeholder Text',
        type: 'text',
        description: 'Text shown when input is empty'
      },
      {
        key: 'required',
        label: 'Required',
        type: 'checkbox',
        description: 'Whether input is required'
      }
    ]
  };
  
  // Get the status badge based on execution state
  const getStatusBadge = () => {
    if (nodeData.isProcessing) return <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">Running</Badge>;
    if (nodeData.isComplete) return <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">Completed</Badge>;
    if (nodeData.hasError) return <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">Error</Badge>;
    return null;
  };
  
  // Create the header actions slot
  const headerActions = (
    <div className="flex items-center gap-1.5">
      {getStatusBadge()}
      
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
  
  // Create icon element for the header
  const iconElement = (
    <div className="bg-primary/10 p-1.5 rounded-md">
      {nodeData.icon && typeof nodeData.icon === 'object' && Object.keys(nodeData.icon).length === 0 ? (
        // Handle empty object case that was causing the React error
        <Type className="h-4 w-4 text-primary" />
      ) : nodeData.icon && React.isValidElement(nodeData.icon) ? (
        nodeData.icon
      ) : (
        <Type className="h-4 w-4 text-primary" />
      )}
    </div>
  );
  
  // Additional class for animation and state indication
  const containerClass = cn(
    nodeData.isProcessing && 'animate-pulse',
    nodeData.isComplete && 'border-green-500/30',
    nodeData.hasError && 'border-red-500/30'
  );
  
  return (
    <>
      <div 
        ref={hoverAreaRef}
        className="relative"
        style={{ 
          // Add padding when menu is shown to create a seamless interaction area
          padding: showHoverMenu ? '8px 20px 8px 8px' : '0',
          margin: showHoverMenu ? '-8px -20px -8px -8px' : '0',
        }}
      >
        <div
          ref={nodeRef}
          onMouseEnter={handleHoverStart}
          onMouseLeave={handleHoverEnd}
          className="relative"
        >
          {/* Hover Menu */}
          {showHoverMenu && (
            <div 
              ref={menuRef}
              onMouseEnter={handleMenuHoverStart}
              onMouseLeave={handleHoverEnd}
              className="absolute z-50"
              style={{ right: '-20px', top: '0px' }}
            >
              <NodeHoverMenu 
                nodeId={id}
                actions={hoverMenuActions}
                position="right"
              />
            </div>
          )}
          
          <NodeContainer selected={selected} className={containerClass}>
            <NodeHeader 
              title={nodeData.label} 
              description={nodeData.description || "Text input for workflows"}
              icon={iconElement}
              actions={headerActions}
            />
            
            <NodeContent padding="normal">
              {/* Node Type Badge */}
              <div className="flex justify-between items-start">
                <Badge variant="outline" className="text-xs px-2 py-0.5 bg-slate-100/50 dark:bg-slate-800/50">
                  {nodeData.category || "input"}
                </Badge>
              </div>
              
              {/* Input Field */}
              <div className="mt-3">
                <Label htmlFor={`inputText-${id}`} className="mb-2 block text-xs">
                  {nodeData.label}
                  {nodeData.required && <span className="text-red-500 ml-1">*</span>}
                </Label>
                
                <Input 
                  id={`inputText-${id}`}
                  type="text"
                  value={inputText}
                  onChange={handleInputChange}
                  placeholder={nodeData.placeholder}
                  className="w-full"
                />
              </div>
              
              {/* Status messages and errors */}
              {nodeData.hasError && nodeData.errorMessage && (
                <div className="mt-2 p-2 text-xs bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded border border-red-200 dark:border-red-800">
                  <div className="flex items-center gap-1 mb-1">
                    <AlertTriangle className="h-3 w-3" />
                    <span className="font-medium">Error</span>
                  </div>
                  {nodeData.errorMessage}
                </div>
              )}
            </NodeContent>
            
            {/* Output handle */}
            <Handle
              type="source"
              position={Position.Right}
              id="output"
              style={{ 
                top: 50, 
                width: '12px', 
                height: '12px', 
                background: 'white',
                border: '2px solid #10b981'
              }}
              isConnectable={isConnectable}
            />
            <div className="absolute right-2 top-[46px] text-xs text-muted-foreground text-right">
              Out
            </div>
          </NodeContainer>
        </div>
      </div>
      
      {/* Settings Sheet/Drawer */}
      <Sheet open={showSettings} onOpenChange={setShowSettings}>
        <SheetContent className="w-[350px] sm:w-[450px]">
          <SheetHeader>
            <SheetTitle>{settings?.title || `${nodeData.label} Settings`}</SheetTitle>
          </SheetHeader>
          
          <div className="py-4">
            {settings?.fields && settings.fields.length > 0 ? (
              <NodeSettingsForm 
                nodeData={nodeData}
                settingsFields={settings.fields}
                onChange={handleSubmitSettings}
              />
            ) : (
              <div className="text-sm text-slate-600">
                No configurable settings for this node.
              </div>
            )}
            
            <div className="flex justify-end gap-2 mt-6">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowSettings(false)}
              >
                Cancel
              </Button>
              <Button 
                size="sm"
                onClick={() => handleSubmitSettings(nodeData)}
              >
                Apply
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};
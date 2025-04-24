/**
 * Function Node UI Component
 * 
 * This node allows users to define custom JavaScript functions
 * that transform input data and produce output.
 */

import React, { useState, memo, useCallback, useRef, useEffect } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Settings, MoreHorizontal, AlertTriangle, Code, Database, Zap, Clock, StickyNote } from 'lucide-react';
import { cn } from '@/lib/utils';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';

import { NodeContainer } from '@/components/nodes/common/NodeContainer';
import { NodeHeader } from '@/components/nodes/common/NodeHeader';
import { NodeContent } from '@/components/nodes/common/NodeContent';
import { NodeSettingsForm } from '@/components/nodes/common/NodeSettingsForm';
import NodeHoverMenu, { 
  createDuplicateAction, 
  createDeleteAction, 
  createSettingsAction,
  createRunAction,
  createAddNoteAction,
  NodeHoverMenuAction
} from '@/components/nodes/common/NodeHoverMenu';

import { nodeMetadata } from './definition';

interface FunctionNodeData {
  label: string;
  description?: string;
  type?: string;
  category?: string;
  code?: string;
  settings?: {
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
  };
  settingsData?: Record<string, any>;
  isProcessing?: boolean;
  isComplete?: boolean;
  hasError?: boolean;
  errorMessage?: string;
  icon?: string | React.ReactNode;
  onChange?: (data: any) => void;
  onRun?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onDelete?: (id: string) => void;
  [key: string]: any;
}

/**
 * Function Node Component - A node that allows defining custom JavaScript functions
 */
function FunctionNode({ data, id, selected }: NodeProps<FunctionNodeData>) {
  const [showContextActions, setShowContextActions] = useState(false);
  const [showHoverMenu, setShowHoverMenu] = useState(false);
  const [hoverTimer, setHoverTimer] = useState<NodeJS.Timeout | null>(null);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [noteVisibility, setNoteVisibility] = useState(false);
  const nodeRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const hoverDelay = 300; // ms before showing menu
  const hideDelay = 400; // ms before hiding menu
  const hoverAreaRef = useRef<HTMLDivElement>(null);
  
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
    
    // Add a delay before hiding the menu to give users time to move to it
    const timer = setTimeout(() => {
      setShowHoverMenu(false);
    }, hideDelay);
    
    setHoverTimer(timer);
  }, [hoverTimer, hideDelay]);
  
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
  
  // Destructure node data with defaults
  const {
    label = 'Function',
    description = 'Custom JavaScript function',
    type = 'function_node',
    category = 'functions',
    code = 'function process(input) {\n  // Your code here\n  return input;\n}',
    settings = { 
      title: 'Function Settings',
      fields: [
        {
          key: 'label',
          label: 'Node Label',
          type: 'text',
          description: 'Display name for this node'
        },
        {
          key: 'code',
          label: 'Function Code',
          type: 'textarea',
          description: 'JavaScript function code that processes input data'
        },
        {
          key: 'async',
          label: 'Async Function',
          type: 'checkbox',
          description: 'Whether the function should be executed asynchronously'
        }
      ] 
    },
    settingsData = {},
    isProcessing = false,
    isComplete = false,
    hasError = false,
    errorMessage = '',
    onChange
  } = data;
  
  // Settings icon click handler
  const handleSettingsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Always use the centralized settings drawer by dispatching the event
    const event = new CustomEvent('node-settings-open', { 
      detail: { nodeId: id }
    });
    window.dispatchEvent(event);
  };
  
  // Settings changes are now handled by the central settings drawer in FlowEditor
  
  // Get the status badge based on execution state
  const getStatusBadge = () => {
    if (isProcessing) return <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">Running</Badge>;
    if (isComplete) return <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">Completed</Badge>;
    if (hasError) return <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">Error</Badge>;
    return null;
  };
  
  // Get settings summary for display in the node
  const getSettingsSummary = () => {
    if (!settingsData || Object.keys(settingsData).length === 0) {
      return null;
    }
    
    // Format based on common settings patterns
    const summaryItems = [];
    
    if (settingsData.useAsyncFunction) {
      summaryItems.push('Async');
    }
    
    if (settingsData.timeout) {
      summaryItems.push(`${settingsData.timeout}ms`);
    }
    
    if (settingsData.cacheResults) {
      summaryItems.push('Cached');
    }
    
    if (settingsData.executionEnvironment === 'server') {
      summaryItems.push('Server-side');
    }
    
    if (settingsData.errorHandling && settingsData.errorHandling !== 'throw') {
      summaryItems.push(`Errors: ${settingsData.errorHandling}`);
    }
    
    if (settingsData.selectedTemplate && settingsData.selectedTemplate !== 'basic') {
      summaryItems.push(`Template: ${settingsData.selectedTemplate}`);
    }
    
    // Return formatted summary
    if (summaryItems.length > 0) {
      return summaryItems.join(' • ');
    } else {
      // Fallback to a simple summary if needed
      return 'Basic function';
    }
  };
  
  // Node action handlers
  const handleRunNode = () => {
    console.log('Run node:', id);
    if (data.onRun) {
      data.onRun(id);
    }
  };
  
  const handleDuplicateNode = () => {
    console.log('Duplicate node:', id);
    if (data.onDuplicate) {
      data.onDuplicate(id);
    }
  };
  
  const handleDeleteNode = () => {
    console.log('Delete node:', id);
    if (data.onDelete) {
      data.onDelete(id);
    }
  };
  
  // Settings click handler for the menu 
  const handleSettingsClickForMenu = () => {
    // Always use the centralized settings drawer by dispatching the event
    const event = new CustomEvent('node-settings-open', { 
      detail: { nodeId: id }
    });
    window.dispatchEvent(event);
  };
  
  // Dispatch a custom event to let the FlowEditor know about clicks
  const dispatchCustomEvent = (eventName: string, detail: any) => {
    const event = new CustomEvent(eventName, { detail });
    window.dispatchEvent(event);
  };
  
  // This adds additional hooks to connect with the FlowEditor
  useEffect(() => {
    // Add a global event listener for node settings
    const handleNodeSettings = () => {
      dispatchCustomEvent('node-settings-open', { nodeId: id });
    };
    
    // Add the settings click handler to the node data
    if (data.onSettingsClick === undefined) {
      // Only add if it doesn't already exist
      if (onChange) {
        onChange({
          ...data,
          onSettingsClick: handleNodeSettings,
          // Remove any expandedCode data that might have been added before
          expandedCode: undefined
        });
      }
    }

    // Initialize note state from node data
    setNoteText(data.note || '');
    setNoteVisibility(data.showNote || false);
    
    // Listen for note edit events that match this node
    const handleNoteEditEvent = (event: CustomEvent) => {
      if (event.detail.nodeId === id) {
        setNoteText(data.note || '');
        setNoteVisibility(data.showNote || false);
        setNoteDialogOpen(true);
      }
    };
    
    window.addEventListener('node-note-edit', handleNoteEditEvent as EventListener);
    
    return () => {
      window.removeEventListener('node-note-edit', handleNoteEditEvent as EventListener);
    };
  }, [id, data, onChange]);
  
  // Handle note editing
  const handleEditNote = () => {
    setNoteDialogOpen(true);
  };
  
  // Save note changes
  const saveNoteChanges = () => {
    if (onChange) {
      onChange({
        ...data,
        note: noteText,
        showNote: noteVisibility
      });
    }
    setNoteDialogOpen(false);
  };
  
  // Create hover menu actions
  const hoverMenuActions = [
    createRunAction(handleRunNode),
    createAddNoteAction(handleEditNote),
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
  
  const settingsSummary = getSettingsSummary();
  
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
      <Code className="h-4 w-4 text-primary" />
    </div>
  );
  
  // Additional class for animation and state indication
  const containerClass = cn(
    isProcessing && 'animate-pulse',
    isComplete && 'border-green-500/30',
    hasError && 'border-red-500/30'
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
              style={{ right: '-8px', top: '0px' }}
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
              title={label} 
              description={description}
              icon={iconElement}
              actions={headerActions}
            />
            
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
              
              {/* Advanced Features Indicators */}
              {(settingsData.cacheResults || settingsData.executionEnvironment === 'server') && (
                <div className="mt-2 flex gap-2">
                  {settingsData.cacheResults && (
                    <div className="flex items-center text-xs gap-1 text-blue-500 dark:text-blue-400">
                      <Clock className="h-3 w-3" />
                      <span>Caching</span>
                    </div>
                  )}
                  {settingsData.executionEnvironment === 'server' && (
                    <div className="flex items-center text-xs gap-1 text-purple-500 dark:text-purple-400">
                      <Database className="h-3 w-3" />
                      <span>Server-side</span>
                    </div>
                  )}
                </div>
              )}

              {/* Code Preview */}
              <div className="mt-2 relative">
                <div className="text-xs font-mono bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 p-2 rounded border border-slate-300 dark:border-slate-700 overflow-y-auto max-h-[150px] shadow-inner">
                  {settingsData.selectedTemplate && settingsData.selectedTemplate !== 'basic' && (
                    <div className="mb-1 text-xs text-blue-500 dark:text-blue-400 font-semibold">
                      Template: {settingsData.selectedTemplate}
                    </div>
                  )}
                  <div className="whitespace-pre-wrap overflow-x-auto" style={{ fontFamily: "'Fira Code', 'JetBrains Mono', monospace" }}>
                    {(settingsData.code || code)
                      .split('\n')
                      .map((line: string, i: number) => {
                        // Apply basic syntax highlighting
                        const highlightedLine = line
                          .replace(/(function|return|const|let|var|if|else|for|while|try|catch|async|await)/g, 
                                  '<span class="text-purple-600 dark:text-purple-400">$1</span>')
                          .replace(/(\(|\)|\{|\}|\[|\])/g, 
                                  '<span class="text-orange-500 dark:text-orange-300">$1</span>')
                          .replace(/(\/\/.*)/g, 
                                  '<span class="text-slate-500 dark:text-slate-400">$1</span>');
                        
                        return (
                          <div 
                            key={i} 
                            className="leading-tight" 
                            dangerouslySetInnerHTML={{ __html: highlightedLine }}
                          />
                        );
                      })}
                  </div>
                </div>
              </div>
              
              {/* Status messages and errors */}
              {hasError && errorMessage && (
                <div className="mt-2 p-2 text-xs bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded border border-red-200 dark:border-red-800">
                  <div className="flex items-center gap-1 mb-1">
                    <AlertTriangle className="h-3 w-3" />
                    <span className="font-medium">Error</span>
                  </div>
                  {errorMessage}
                </div>
              )}
            </NodeContent>
            
            {/* Input handle for triggering the node */}
            <Handle
              type="target"
              position={Position.Left}
              id="input"
              style={{ 
                top: 50, 
                width: '12px', 
                height: '12px', 
                background: 'white',
                border: '2px solid #3b82f6'
              }}
              isConnectable={true}
            />
            <div className="absolute left-2 top-[46px] text-xs text-muted-foreground">
              In
            </div>

            {/* Output handle for continuing to the next node */}
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
              isConnectable={true}
            />
            <div className="absolute right-2 top-[46px] text-xs text-muted-foreground text-right">
              Out
            </div>
          </NodeContainer>
        </div>
      </div>

      {/* Note Dialog */}
      <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Node Note</DialogTitle>
            <DialogDescription>
              Add a note to document or explain this function node.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <Textarea
              value={noteText}
              placeholder="Add your note here..."
              onChange={(e) => setNoteText(e.target.value)}
              className="min-h-[120px]"
            />
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="showNote" 
                checked={noteVisibility}
                onCheckedChange={(checked) => setNoteVisibility(!!checked)}
              />
              <Label htmlFor="showNote">Show note on canvas</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setNoteDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveNoteChanges}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default memo(FunctionNode);
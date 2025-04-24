/**
 * Workflow Trigger Node - Complete Export
 * ======================================
 * 
 * This file contains a complete export of the Workflow Trigger Node components and functionality
 * from the workflow system. This node allows calling and executing other workflows from within 
 * a workflow, enabling modular and reusable workflow design patterns.
 * 
 * TABLE OF CONTENTS:
 * -----------------
 * 1. Overview & Architecture
 * 2. Interface Definitions
 * 3. UI Component Implementation
 * 4. Node Executor Implementation
 * 5. API Integration
 * 6. Utility Functions
 * 7. Integration Guide
 * 
 * 
 * ===================================================================================
 * 1. OVERVIEW & ARCHITECTURE
 * ===================================================================================
 * 
 * The Workflow Trigger Node is designed to:
 * 
 * - Allow a workflow to trigger the execution of another workflow
 * - Pass data from the parent workflow to the child workflow
 * - Return results from the child workflow back to the parent workflow
 * - Prevent circular dependencies (workflows calling themselves)
 * - Handle timeouts and errors gracefully
 * 
 * Architecture:
 * 
 * 1. UI Component (ReactFlow Node)
 *    - Renders the node in the workflow editor
 *    - Shows configuration status and execution state
 *    - Provides settings interface
 * 
 * 2. Node Executor
 *    - Handles the execution logic when the workflow runs
 *    - Makes API calls to trigger the selected workflow
 *    - Manages timeouts and error handling
 * 
 * 3. API Integration
 *    - Communicates with the backend to trigger workflows
 *    - Handles authentication and data formatting
 * 
 * This design separates presentation from logic, allowing for clean implementation
 * and easy maintenance.
 * 
 * ===================================================================================
 * 2. INTERFACE DEFINITIONS
 * ===================================================================================
 */

// Node data interface for the Workflow Trigger Node component
interface WorkflowTriggerNodeData {
  label?: string;
  description?: string;
  onSettingsClick?: () => void;
  settings?: {
    workflowId?: number;     // ID of the workflow to trigger
    inputField?: string;     // Field from input to use (e.g., 'text', 'json')
    timeout?: number;        // Timeout in milliseconds
  };
  _isProcessing?: boolean;   // Is the node currently processing
  _isComplete?: boolean;     // Has the node completed execution
  _hasError?: boolean;       // Did an error occur during execution
  _errorMessage?: string;    // Error message if applicable
  _result?: any;             // Result from the execution
}

// Props for the Workflow Trigger Node component
interface WorkflowTriggerNodeProps {
  id: string;                // Node ID
  data: WorkflowTriggerNodeData;
  selected: boolean;         // Is the node selected in the editor
  type?: string;             // Node type identifier
  xPos?: number;             // X position in the canvas
  yPos?: number;             // Y position in the canvas
}

// Node Execution Data interface - for data flow between nodes
interface NodeExecutionData {
  items: {
    json: Record<string, any>;
    meta?: Record<string, any>;
  }[];
  meta: {
    startTime: Date;
    endTime: Date;
    status?: string;
    error?: string;
    [key: string]: any;
  };
}

// Enhanced Node Executor interface - for node execution logic
interface EnhancedNodeExecutor {
  definition: {
    type: string;
    displayName: string;
    description: string;
    icon: string;
    category: string;
    version: string;
    inputs: Record<string, any>;
    outputs: Record<string, any>;
  };
  execute: (
    nodeData: Record<string, any>,
    inputs: Record<string, NodeExecutionData>
  ) => Promise<NodeExecutionData>;
}

/**
 * ===================================================================================
 * 3. UI COMPONENT IMPLEMENTATION
 * ===================================================================================
 * 
 * The WorkflowTriggerNode component renders the node in the workflow editor.
 * It displays configuration status, execution state, and provides user interaction.
 * 
 * Key features:
 * - Visual indicator for configuration status
 * - Display of selected workflow info
 * - Status badges for execution state
 * - Settings button for configuration
 * - Input/output handles for connecting to other nodes
 */

// Import React and necessary components
// Actual imports would look like:
// import React, { useState, useEffect } from 'react';
// import { Handle, Position, NodeProps } from 'reactflow';
// import { Card, CardHeader, CardContent, Badge } from '@/components/ui/...';
// import { GitBranch, Settings, AlertCircle } from 'lucide-react';

/**
 * WorkflowTriggerNode Component
 * 
 * This component renders the Workflow Trigger Node in the ReactFlow canvas.
 * It shows the node's configuration, status, and provides user interaction.
 */
const WorkflowTriggerNode = ({ id, data, selected }: WorkflowTriggerNodeProps) => {
  // State to track if the node is properly configured
  const [isConfigured, setIsConfigured] = useState(false);

  // Update configuration status when settings change
  useEffect(() => {
    // Check if workflowId is set, which is the minimum required configuration
    setIsConfigured(!!data.settings?.workflowId);
  }, [data.settings]);

  // Open settings dialog via a custom event or callback
  const handleSettingsClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    
    // Use provided callback if available
    if (data.onSettingsClick) {
      data.onSettingsClick();
    } else {
      // Dispatch a custom event as a fallback
      const settingsEvent = new CustomEvent('node-settings-open', {
        detail: { nodeId: id }
      });
      window.dispatchEvent(settingsEvent);
    }
  };

  // Render a status badge based on node state
  const renderStatusBadge = () => {
    if (data._isProcessing) {
      return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">Processing</Badge>;
    }
    if (data._hasError) {
      return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">Error</Badge>;
    }
    if (data._isComplete) {
      return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">Completed</Badge>;
    }
    if (!isConfigured) {
      return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">Needs Config</Badge>;
    }
    return null;
  };

  return (
    <>
      {/* Input handle - where data comes into the node */}
      <Handle 
        type="target" 
        position="top" 
        id="input"
        className="w-2 h-2 rounded-full border-2 border-blue-500 bg-white"
      />

      {/* Node card with content */}
      <div className={`workflow-trigger-node rounded-lg border ${
        selected ? 'ring-2 ring-blue-500' : ''
      } ${data._hasError ? 'border-red-300 bg-red-50' : 'border-slate-300 bg-white'}`}>
        {/* Header with title and status */}
        <div className="p-3 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 mr-2">
              <GitBranch size={12} />
            </div>
            <span className="font-medium text-sm">
              {data.label || 'Workflow Trigger'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {renderStatusBadge()}
            <button
              onClick={handleSettingsClick}
              className="w-5 h-5 flex items-center justify-center rounded hover:bg-slate-100"
              title="Settings"
            >
              <Settings size={12} className="text-slate-500" />
            </button>
          </div>
        </div>

        {/* Body content */}
        <div className="p-3 text-sm">
          {/* Show configuration status or selected workflow info */}
          {isConfigured ? (
            <div className="text-slate-700">
              <p className="flex items-center">
                <span className="font-medium">Workflow ID:</span>
                <span className="ml-1">{data.settings?.workflowId}</span>
              </p>
              {data.settings?.inputField && (
                <p className="text-xs text-slate-500 mt-1">
                  Input Field: {data.settings.inputField}
                </p>
              )}
            </div>
          ) : (
            <div className="flex items-center text-amber-600">
              <AlertCircle size={14} className="mr-1" />
              <span>Click Settings to configure workflow</span>
            </div>
          )}

          {/* Show error message if there is one */}
          {data._hasError && data._errorMessage && (
            <div className="mt-2 text-xs text-red-600 p-2 bg-red-50 rounded border border-red-200">
              Error: {data._errorMessage}
            </div>
          )}
        </div>
      </div>

      {/* Output handle - where data leaves the node */}
      <Handle 
        type="source" 
        position="bottom" 
        id="output"
        className="w-2 h-2 rounded-full border-2 border-blue-500 bg-white"
      />
    </>
  );
};

/**
 * ===================================================================================
 * 4. NODE EXECUTOR IMPLEMENTATION
 * ===================================================================================
 * 
 * The workflowTriggerExecutor handles the execution logic for the Workflow Trigger Node.
 * It is responsible for:
 * - Extracting input data
 * - Validating configuration
 * - Calling the target workflow
 * - Handling timeouts and errors
 * - Returning results to the workflow engine
 */

/**
 * Workflow Trigger Node Executor
 * 
 * Handles the execution of the Workflow Trigger node when a workflow runs.
 * This executor makes API calls to trigger another workflow and handle the response.
 */
export const workflowTriggerExecutor: EnhancedNodeExecutor = {
  // Node definition - metadata for the node type
  definition: {
    type: 'workflow_trigger',
    displayName: 'Workflow Trigger Node',
    description: 'Triggers another workflow from within a workflow',
    icon: 'git-branch',
    category: 'Workflow',
    version: '1.0',
    inputs: {
      input: {
        type: 'any',
        displayName: 'Input',
        description: 'The input data to pass to the workflow',
        required: true
      }
    },
    outputs: {
      output: {
        type: 'any',
        displayName: 'Output',
        description: 'The response from the workflow'
      }
    }
  },
  
  // Execution logic for the node
  execute: async (nodeData: Record<string, any>, inputs: Record<string, NodeExecutionData>): Promise<NodeExecutionData> => {
    console.log('Workflow Trigger Node - Starting execution', nodeData);
    
    try {
      // Check for data directly on nodeData first (as used in the workflow definition)
      // Then fall back to the settings object for backward compatibility
      const workflowId = nodeData.workflowId || (nodeData.settings?.workflowId);
      const inputField = nodeData.inputField || nodeData.settings?.inputField || 'text';
      const timeout = nodeData.timeout || nodeData.settings?.timeout || 30000;
      
      // Validate workflow ID
      if (!workflowId) {
        console.error('Workflow Trigger Node - Missing workflow ID');
        return {
          items: [
            {
              json: { 
                error: 'Missing workflow ID in settings'
              }
            }
          ],
          meta: {
            startTime: new Date(),
            endTime: new Date(),
            status: 'error',
            message: 'Missing workflow ID in settings'
          }
        };
      }
      
      console.log(`Workflow Trigger Node - Configured to trigger workflow ${workflowId}`);
      
      // Extract input data from the connected nodes
      let inputData: any = null;
      
      // Look for inputs from the previous node
      if (inputs && Object.keys(inputs).length > 0) {
        const firstInput = Object.values(inputs)[0];
        if (firstInput?.items?.length > 0) {
          const item = firstInput.items[0];
          
          // Get data based on the specified input field
          if (inputField === 'json' && item.json) {
            inputData = item.json;
          } else if (inputField === 'text' && item.json?.text) {
            inputData = item.json.text;
          } else if (inputField === 'content' && item.json?.content) {
            inputData = item.json.content;
          } else if (item.json) {
            // Try to find any suitable data
            if (typeof item.json === 'string') {
              inputData = item.json;
            } else if (item.json.text) {
              inputData = item.json.text;
            } else if (item.json.content) {
              inputData = item.json.content;
            } else if (item.json.data) {
              inputData = item.json.data;
            } else {
              // Use the entire json object if no specific field matches
              inputData = item.json;
            }
          }
        }
      }
      
      // Fall back to node's own input text if no input from previous nodes
      if (inputData === null && nodeData.inputText) {
        inputData = nodeData.inputText;
      }
      
      // If no input data at all, use an empty string to avoid null errors
      if (inputData === null) {
        inputData = '';
      }
      
      console.log(`Workflow Trigger Node - Input data prepared:`, typeof inputData);
      
      // Create a timeout promise to handle timeouts
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Workflow execution timed out after ${timeout}ms`));
        }, timeout);
      });
      
      // Check for circular dependencies by examining the call stack
      const callStack = nodeData._callStack || [];
      if (callStack.includes(workflowId)) {
        console.error(`Circular workflow dependency detected! Workflow ${workflowId} is already in the call stack: ${callStack.join(' -> ')}`);
        return {
          items: [
            {
              json: { 
                error: `Circular workflow dependency detected: ${callStack.join(' -> ')} -> ${workflowId}`,
                circularDependency: true,
                workflowId
              }
            }
          ],
          meta: {
            startTime: new Date(),
            endTime: new Date(),
            status: 'error',
            message: `Circular workflow dependency detected: ${callStack.join(' -> ')} -> ${workflowId}`
          }
        };
      }
      
      // Add the current workflow to the call stack
      const updatedCallStack = [...callStack, workflowId];
      
      // Prepare request payload with call stack and metadata
      const requestPayload = {
        prompt: inputData,
        _callStack: updatedCallStack, // Pass the call stack to prevent circular dependencies
        metadata: {
          source: 'workflowTriggerNode',
          sourceNodeId: nodeData.id,
          parentWorkflowId: nodeData.workflowId || 'unknown'
        }
      };
      
      console.log(`Workflow Trigger Node - Calling workflow ${workflowId}`);
      
      // Start timer for execution
      const startTime = new Date();
      
      // Call the workflow API
      const workflowPromise = apiRequest(
        `/api/workflows/${workflowId}/trigger`,
        'POST',
        requestPayload
      );
      
      // Race between the workflow execution and timeout
      const response = await Promise.race([workflowPromise, timeoutPromise]) as any;
      
      // Calculate execution time
      const endTime = new Date();
      const executionTimeMs = endTime.getTime() - startTime.getTime();
      
      console.log(`Workflow Trigger Node - Workflow ${workflowId} completed in ${executionTimeMs}ms`, response);
      
      // Return a success response with the workflow results
      return {
        items: [
          {
            json: {
              result: response,
              workflowId,
              executionTimeMs
            }
          }
        ],
        meta: {
          startTime,
          endTime,
          status: 'success',
          executionTimeMs,
          workflowId
        }
      };
      
    } catch (error: any) {
      // Handle errors from the execution
      console.error('Workflow Trigger Node - Execution error:', error);
      
      return {
        items: [
          {
            json: { 
              error: error.message || 'Error executing workflow',
              _hasError: true,
              _errorMessage: error.message || 'Error executing workflow'
            }
          }
        ],
        meta: {
          startTime: new Date(),
          endTime: new Date(),
          status: 'error',
          error: error.message || 'Error executing workflow'
        }
      };
    }
  }
};

/**
 * ===================================================================================
 * 5. API INTEGRATION
 * ===================================================================================
 * 
 * The API integration handles communication with the backend server.
 * This handles actual workflow trigger requests.
 */

/**
 * Generic API request function to handle API communication
 * 
 * @param endpoint API endpoint to call
 * @param method HTTP method (GET, POST, etc.)
 * @param data Optional data to send with the request
 * @returns Promise with the API response
 */
async function apiRequest(endpoint: string, method: string = 'GET', data?: any): Promise<any> {
  try {
    const url = endpoint.startsWith('http') ? endpoint : endpoint;
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      credentials: 'include' // Include cookies for session-based auth
    };
    
    // Add request body for non-GET requests
    if (method !== 'GET' && data) {
      options.body = JSON.stringify(data);
    }
    
    // Make the API request
    const response = await fetch(url, options);
    
    // Handle non-OK responses
    if (!response.ok) {
      const errorText = await response.text();
      try {
        // Try to parse as JSON
        const errorJson = JSON.parse(errorText);
        throw new Error(errorJson.message || `API error: ${response.status}`);
      } catch (e) {
        // If parsing fails, use the raw text
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }
    }
    
    // Parse and return the response
    const result = await response.json();
    return result;
  } catch (error: any) {
    console.error(`API request error (${endpoint}):`, error);
    throw error;
  }
}

/**
 * ===================================================================================
 * 6. UTILITY FUNCTIONS
 * ===================================================================================
 * 
 * Additional utility functions for working with the Workflow Trigger Node.
 */

/**
 * Extract a specific property from an object, handling nested paths
 * 
 * @param obj The object to extract data from
 * @param path The dot-notation path to the property
 * @param defaultValue Default value if property not found
 * @returns The extracted value or default value
 */
function getValueByPath(obj: any, path: string, defaultValue: any = null): any {
  if (!obj || !path) return defaultValue;
  
  // Handle simple property access
  if (typeof path === 'string' && path.indexOf('.') === -1) {
    return obj[path] !== undefined ? obj[path] : defaultValue;
  }
  
  // Handle nested property access with dot notation
  try {
    const keys = path.split('.');
    let value = obj;
    
    for (const key of keys) {
      if (value === undefined || value === null) return defaultValue;
      value = value[key];
    }
    
    return value !== undefined ? value : defaultValue;
  } catch (error) {
    return defaultValue;
  }
}

/**
 * Create a settings drawer component for configuring the workflow trigger node
 * 
 * This is a simplified example - actual implementation would depend on your UI components.
 */
function WorkflowTriggerSettingsDrawer({ isOpen, onClose, node, onSettingsChange, workflows }) {
  // State for selected workflow ID
  const [workflowId, setWorkflowId] = useState(node?.data?.settings?.workflowId || null);
  // State for input field
  const [inputField, setInputField] = useState(node?.data?.settings?.inputField || 'text');
  // State for timeout
  const [timeout, setTimeout] = useState(node?.data?.settings?.timeout || 30000);
  
  // Handle save button
  const handleSave = () => {
    // Create updated settings
    const newSettings = {
      workflowId,
      inputField,
      timeout: Number(timeout)
    };
    
    // Call parent handler with new settings
    onSettingsChange(node.id, newSettings);
    onClose();
  };
  
  return (
    <div className={`workflow-settings-drawer ${isOpen ? 'open' : 'closed'}`}>
      <div className="drawer-header">
        <h3>Workflow Trigger Settings</h3>
        <button onClick={onClose}>×</button>
      </div>
      
      <div className="drawer-content">
        <div className="form-group">
          <label>Select Workflow</label>
          <select
            value={workflowId || ''}
            onChange={(e) => setWorkflowId(Number(e.target.value))}
          >
            <option value="">-- Select Workflow --</option>
            {workflows.map(workflow => (
              <option key={workflow.id} value={workflow.id}>
                {workflow.name}
              </option>
            ))}
          </select>
        </div>
        
        <div className="form-group">
          <label>Input Field</label>
          <select
            value={inputField}
            onChange={(e) => setInputField(e.target.value)}
          >
            <option value="text">Text</option>
            <option value="json">JSON</option>
            <option value="content">Content</option>
          </select>
          <small>The field from the input to pass to the workflow</small>
        </div>
        
        <div className="form-group">
          <label>Timeout (ms)</label>
          <input
            type="number"
            value={timeout}
            onChange={(e) => setTimeout(Number(e.target.value))}
            min="1000"
            step="1000"
          />
          <small>Maximum time to wait for workflow completion</small>
        </div>
      </div>
      
      <div className="drawer-footer">
        <button onClick={onClose}>Cancel</button>
        <button onClick={handleSave}>Save</button>
      </div>
    </div>
  );
}

/**
 * ===================================================================================
 * 7. INTEGRATION GUIDE
 * ===================================================================================
 * 
 * How to integrate the Workflow Trigger Node into your application.
 * 
 * Steps:
 * 1. Register the node component with ReactFlow
 * 2. Register the node executor with your workflow engine
 * 3. Implement the settings UI
 * 4. Implement API endpoints for workflow triggering
 */

/**
 * Node Registration in ReactFlow
 * 
 * Add the WorkflowTriggerNode to your ReactFlow nodeTypes.
 * 
 * Example:
 * ```jsx
 * const nodeTypes = {
 *   // Other nodes...
 *   'workflow_trigger': WorkflowTriggerNode,
 * };
 * 
 * <ReactFlow
 *   nodes={nodes}
 *   edges={edges}
 *   nodeTypes={nodeTypes}
 *   // Other props...
 * />
 * ```
 */

/**
 * Node Executor Registration
 * 
 * Register the workflowTriggerExecutor with your workflow engine.
 * 
 * Example:
 * ```javascript
 * import { workflowTriggerExecutor } from './executors/workflowTriggerExecutor';
 * 
 * // Register with your workflow engine
 * workflowEngine.registerNodeExecutor('workflow_trigger', workflowTriggerExecutor);
 * ```
 */

/**
 * API Endpoint Implementation
 * 
 * You need to implement a backend endpoint to handle workflow trigger requests.
 * 
 * Example Express.js route:
 * ```javascript
 * app.post('/api/workflows/:id/trigger', async (req, res) => {
 *   try {
 *     const workflowId = req.params.id;
 *     const { prompt, _callStack, metadata } = req.body;
 *     
 *     // Check for circular dependencies
 *     if (_callStack && _callStack.includes(workflowId)) {
 *       return res.status(400).json({ 
 *         error: 'Circular dependency detected',
 *         callStack: _callStack 
 *       });
 *     }
 *     
 *     // Execute the workflow
 *     const result = await workflowExecutionService.executeWorkflow(
 *       workflowId, 
 *       { prompt, callStack: _callStack, metadata }
 *     );
 *     
 *     // Return the result
 *     return res.json(result);
 *   } catch (error) {
 *     console.error('Error triggering workflow:', error);
 *     return res.status(500).json({ error: error.message });
 *   }
 * });
 * ```
 */

/**
 * ADDITIONAL CONSIDERATIONS
 * 
 * 1. Error Handling: Ensure proper error handling both in the UI and executor.
 * 
 * 2. Performance: For long-running workflows, consider implementing:
 *    - Websocket updates for real-time progress
 *    - Asynchronous execution with status polling
 * 
 * 3. Security: 
 *    - Add permission checks to prevent unauthorized workflow access
 *    - Consider rate limiting to prevent abuse
 * 
 * 4. Workflow Variables:
 *    - Add support for passing variables between parent and child workflows
 *    - Implement context sharing between workflows
 */

/**
 * This completes the export of the Workflow Trigger Node.
 * With this implementation, you can easily add the ability for workflows to trigger
 * other workflows in your system, enabling powerful modular workflow compositions.
 */
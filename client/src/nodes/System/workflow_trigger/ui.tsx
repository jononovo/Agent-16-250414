/**
 * Simple Workflow Trigger Node UI Component
 * 
 * A simplified version that uses basic UI elements to avoid SelectItem issues
 */

import React, { useEffect, useState } from 'react';
import { Handle, Position } from 'reactflow';
import { GitBranch, Settings, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

// Simplified interface that focuses on node props
interface WorkflowTriggerProps {
  id: string;
  data: any;
  selected: boolean;
  isConnectable?: boolean;
}

// Main component for the workflow trigger node
const component: React.FC<WorkflowTriggerProps> = ({ 
  id, 
  data, 
  selected,
  isConnectable = true 
}) => {
  // State for UI
  const [isConfigured, setIsConfigured] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [availableWorkflows, setAvailableWorkflows] = useState<any[]>([]);
  
  // Node settings - local state to manage changes before saving
  const [workflowId, setWorkflowId] = useState<string>(
    data.workflowId ? data.workflowId.toString() : ""
  );
  const [inputField, setInputField] = useState<string>(data.inputField || 'json');
  const [timeout, setTimeout] = useState<string>(
    (data.timeout || 30000).toString()
  );
  const [waitForCompletion, setWaitForCompletion] = useState<boolean>(
    data.waitForCompletion !== undefined ? data.waitForCompletion : true
  );
  
  // Load available workflows
  useEffect(() => {
    const fetchWorkflows = async () => {
      try {
        const response = await fetch('/api/workflows');
        if (response.ok) {
          const data = await response.json();
          setAvailableWorkflows(Array.isArray(data) ? data : []);
        } else {
          console.error('Failed to fetch workflows');
        }
      } catch (error) {
        console.error('Error fetching workflows:', error);
      }
    };
    
    fetchWorkflows();
  }, []);
  
  // Update configuration status based on workflowId
  useEffect(() => {
    setIsConfigured(!!data.workflowId);
  }, [data.workflowId]);
  
  // Save settings back to node data
  const saveSettings = () => {
    // Create updated data object
    const updatedData = {
      ...data,
      workflowId: workflowId ? parseInt(workflowId, 10) : null,
      inputField,
      timeout: parseInt(timeout, 10),
      waitForCompletion
    };
    
    // Dispatch custom event for the workflow editor to handle
    const updateEvent = new CustomEvent('node-data-update', {
      detail: {
        nodeId: id,
        data: updatedData
      }
    });
    window.dispatchEvent(updateEvent);
    
    setIsSettingsOpen(false);
  };
  
  // Toggle settings panel open/closed
  const handleSettingsClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    setIsSettingsOpen(!isSettingsOpen);
  };
  
  // Get selected workflow name for display
  const getSelectedWorkflowName = () => {
    if (!data.workflowId) return 'None selected';
    const workflow = availableWorkflows.find(w => w.id === data.workflowId);
    return workflow ? workflow.name : `ID: ${data.workflowId}`;
  };

  return (
    <>
      {/* Input handle */}
      <Handle 
        type="target" 
        position={Position.Top} 
        id="input"
        isConnectable={isConnectable}
        className="w-2 h-2 rounded-full border-2 border-blue-500 bg-white"
      />

      {/* Main node container */}
      <div className={cn(
        "workflow-trigger-node rounded-lg border shadow-sm min-w-[240px] max-w-[320px]",
        selected ? "ring-2 ring-blue-500" : "",
        data._hasError ? "border-red-300 bg-red-50" : "border-slate-200 bg-white"
      )}>
        {/* Node header */}
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
            {!isConfigured && (
              <div className="bg-blue-100 text-blue-800 border-blue-300 text-xs px-2 py-0.5 rounded-full border">
                Needs Config
              </div>
            )}
            <button
              onClick={handleSettingsClick}
              className="w-5 h-5 flex items-center justify-center rounded hover:bg-slate-100"
              title="Settings"
            >
              <Settings size={12} className="text-slate-500" />
            </button>
          </div>
        </div>

        {/* Node content - either settings form or status display */}
        {isSettingsOpen ? (
          <div className="p-3 text-sm">
            <h3 className="font-medium mb-3">Workflow Settings</h3>
            
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="block text-xs font-medium">Select Workflow</label>
                <select
                  value={workflowId}
                  onChange={(e) => setWorkflowId(e.target.value)}
                  className="w-full border rounded p-1.5 text-sm"
                >
                  <option value="">-- Select a workflow --</option>
                  {availableWorkflows.map(workflow => (
                    <option key={workflow.id} value={workflow.id}>
                      {workflow.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-1">
                <label className="block text-xs font-medium">Input Field</label>
                <select
                  value={inputField}
                  onChange={(e) => setInputField(e.target.value)}
                  className="w-full border rounded p-1.5 text-sm"
                >
                  <option value="json">JSON (entire object)</option>
                  <option value="text">Text content</option>
                  <option value="content">Content field</option>
                </select>
              </div>
              
              <div className="space-y-1">
                <label className="block text-xs font-medium">Timeout (ms)</label>
                <input
                  type="number"
                  value={timeout}
                  onChange={(e) => setTimeout(e.target.value)}
                  className="w-full border rounded p-1.5 text-sm"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium">Wait for completion</label>
                <input
                  type="checkbox"
                  checked={waitForCompletion}
                  onChange={(e) => setWaitForCompletion(e.target.checked)}
                  className="h-4 w-4"
                />
              </div>
              
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="px-3 py-1 text-xs rounded border border-slate-300 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  onClick={saveSettings}
                  className="px-3 py-1 text-xs rounded bg-blue-500 text-white hover:bg-blue-600"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-3 text-sm">
            {isConfigured ? (
              <div className="text-slate-700">
                <p className="flex items-center">
                  <span className="font-medium">Workflow:</span>
                  <span className="ml-1">{getSelectedWorkflowName()}</span>
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Input Field: {data.inputField || 'json'}
                </p>
                {data.waitForCompletion === false && (
                  <p className="text-xs text-slate-500">
                    Runs asynchronously
                  </p>
                )}
              </div>
            ) : (
              <div className="flex items-center text-amber-600">
                <AlertCircle size={14} className="mr-1" />
                <span>Click Settings to configure workflow</span>
              </div>
            )}

            {data._hasError && data._errorMessage && (
              <div className="mt-2 text-xs text-red-600 p-2 bg-red-50 rounded border border-red-200">
                Error: {data._errorMessage}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Output handle */}
      <Handle 
        type="source" 
        position={Position.Bottom} 
        id="output"
        isConnectable={isConnectable}
        className="w-2 h-2 rounded-full border-2 border-blue-500 bg-white"
      />
    </>
  );
};

export default component;
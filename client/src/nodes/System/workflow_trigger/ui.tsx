/**
 * Workflow Trigger Node UI Component
 * 
 * A specialized UI component for the Workflow Trigger node that includes
 * a custom workflow selection interface and configuration options.
 */

import React, { useEffect, useState } from 'react';
import { Handle, Position } from 'reactflow';
import { GitBranch, Settings, AlertCircle, Check, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
// Helper function to make API requests
async function apiRequest(endpoint: string, method: string = 'GET', data?: any): Promise<any> {
  const url = endpoint.startsWith('http') ? endpoint : `/api${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    credentials: 'same-origin'
  };
  
  if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    options.body = JSON.stringify(data);
  }
  
  const response = await fetch(url, options);
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API request failed: ${response.status} ${response.statusText}\n${errorText}`);
  }
  
  try {
    return await response.json();
  } catch (error) {
    // Return text if not valid JSON
    return await response.text();
  }
}
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
  const [isLoading, setIsLoading] = useState(false);
  
  // Node settings - local state to manage changes before saving
  const [workflowId, setWorkflowId] = useState<number | null>(
    data.workflowId ? Number(data.workflowId) : null
  );
  const [inputField, setInputField] = useState<string>(data.inputField || 'json');
  const [timeout, setTimeout] = useState<number>(data.timeout || 30000);
  const [waitForCompletion, setWaitForCompletion] = useState<boolean>(
    data.waitForCompletion !== undefined ? data.waitForCompletion : true
  );
  
  // Load available workflows when settings panel opens
  useEffect(() => {
    const fetchWorkflows = async () => {
      setIsLoading(true);
      try {
        // Simulated data for testing if API call fails
        const sampleWorkflows = [
          { id: 1, name: "Company Search Workflow" },
          { id: 2, name: "Contact Search Workflow" },
          { id: 3, name: "Email Discovery Workflow" }
        ];
        
        try {
          // Make API call to get workflows
          const response = await apiRequest('/workflows', 'GET');
          setAvailableWorkflows(Array.isArray(response) ? response : sampleWorkflows);
        } catch (error) {
          console.error('Failed to fetch workflows, using sample data:', error);
          setAvailableWorkflows(sampleWorkflows);
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    if (isSettingsOpen) {
      fetchWorkflows();
    }
  }, [isSettingsOpen]);
  
  // Update configuration status based on workflowId
  useEffect(() => {
    setIsConfigured(!!data.workflowId);
  }, [data.workflowId]);
  
  // Save settings back to node data
  const saveSettings = () => {
    // Create updated data object
    const updatedData = {
      ...data,
      workflowId,
      inputField,
      timeout,
      waitForCompletion
    };
    
    // Find the best way to update node data based on available methods
    if (typeof data.updateNodeData === 'function') {
      data.updateNodeData(updatedData);
    } else if (data.onDataChange) {
      data.onDataChange(updatedData);
    } else {
      // Fallback - dispatch a custom event for the workflow editor to handle
      const updateEvent = new CustomEvent('node-data-update', {
        detail: {
          nodeId: id,
          data: updatedData
        }
      });
      window.dispatchEvent(updateEvent);
      console.log('Dispatched node-data-update event', id, updatedData);
    }
    
    setIsSettingsOpen(false);
  };
  
  // Toggle settings panel open/closed
  const handleSettingsClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    setIsSettingsOpen(!isSettingsOpen);
  };
  
  // Render appropriate status badge based on node state
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

        {/* Node content - either settings form or status display */}
        {isSettingsOpen ? (
          <div className="p-3 text-sm">
            <h3 className="font-medium mb-2">Workflow Settings</h3>
            
            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="workflow-select">Select Workflow</Label>
                {isLoading ? (
                  <div className="flex items-center text-sm text-slate-500">
                    <Loader2 size={14} className="mr-1 animate-spin" />
                    Loading workflows...
                  </div>
                ) : (
                  <Select 
                    value={workflowId?.toString() || ''} 
                    onValueChange={(value) => setWorkflowId(value ? parseInt(value, 10) : null)}
                  >
                    <SelectTrigger id="workflow-select" className="w-full">
                      <SelectValue placeholder="Select a workflow" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableWorkflows.length === 0 ? (
                        <SelectItem value="" disabled>No workflows available</SelectItem>
                      ) : (
                        availableWorkflows.map(workflow => (
                          <SelectItem key={workflow.id} value={workflow.id.toString()}>
                            {workflow.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                )}
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="input-field">Input Field</Label>
                <Select 
                  value={inputField} 
                  onValueChange={setInputField}
                >
                  <SelectTrigger id="input-field" className="w-full">
                    <SelectValue placeholder="Select input field" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="json">JSON (entire object)</SelectItem>
                    <SelectItem value="text">Text content</SelectItem>
                    <SelectItem value="content">Content field</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="timeout">Timeout (ms)</Label>
                <Input
                  id="timeout"
                  type="number"
                  value={timeout}
                  onChange={(e) => setTimeout(parseInt(e.target.value, 10))}
                  className="w-full"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="wait-for-completion">Wait for completion</Label>
                <Switch
                  id="wait-for-completion"
                  checked={waitForCompletion}
                  onCheckedChange={setWaitForCompletion}
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
                  className="px-3 py-1 text-xs rounded bg-blue-500 text-white hover:bg-blue-600 flex items-center"
                >
                  <Check size={12} className="mr-1" />
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
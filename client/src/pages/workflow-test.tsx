/**
 * Workflow Test Page
 * 
 * This page provides a UI for testing workflow execution
 * directly in the client.
 */
"use client";

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { executeWorkflow, loadWorkflow } from '@/lib/workflowClient';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { NodeState, WorkflowExecutionState } from '@/lib/types/workflow';
import { ScrollArea } from '@/components/ui/scroll-area';
import { registerAllEnhancedNodeExecutors } from '@/lib/enhancedWorkflowEngine';

export default function WorkflowTestPage() {
  const [workflowId, setWorkflowId] = useState<string>('15'); // Default to workflow 15
  const [inputData, setInputData] = useState<string>(''); 
  const [jsonInput, setJsonInput] = useState<string>('{\n  "name": "Test Agent",\n  "description": "A test agent created from the workflow tester",\n  "type": "custom",\n  "icon": "sparkles",\n  "source": "ui_form"\n}');
  const [workflowData, setWorkflowData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [nodeStates, setNodeStates] = useState<Record<string, NodeState>>({});
  const [executionResult, setExecutionResult] = useState<WorkflowExecutionState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [executionLogs, setExecutionLogs] = useState<string[]>([]);
  const [inputTab, setInputTab] = useState<string>('json');
  const [skipLogging, setSkipLogging] = useState<boolean>(false);
  const [debugMode, setDebugMode] = useState<boolean>(false);

  // Initialize workflow engine when component mounts
  useEffect(() => {
    const initWorkflowEngine = async () => {
      try {
        await registerAllEnhancedNodeExecutors();
        console.log('Workflow engine initialized');
      } catch (err) {
        console.error('Failed to initialize workflow engine:', err);
        setError('Failed to initialize workflow engine. See console for details.');
      }
    };

    initWorkflowEngine();
  }, []);

  // Function to load workflow data
  const handleLoadWorkflow = async () => {
    if (!workflowId) {
      setError('Please enter a workflow ID');
      return;
    }

    setIsLoading(true);
    setError(null);
    setWorkflowData(null);
    setNodeStates({});
    setExecutionResult(null);
    setExecutionLogs([]);

    try {
      const id = parseInt(workflowId);
      const data = await loadWorkflow(id);
      setWorkflowData(data);
      addLog(`Workflow "${data.name}" (ID: ${data.id}) loaded successfully`);
    } catch (err) {
      console.error('Error loading workflow:', err);
      setError(`Failed to load workflow: ${err instanceof Error ? err.message : String(err)}`);
      addLog(`Error loading workflow: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to execute the loaded workflow
  const handleExecuteWorkflow = async () => {
    if (!workflowData) {
      setError('Please load a workflow first');
      return;
    }

    setIsExecuting(true);
    setError(null);
    setNodeStates({});
    setExecutionResult(null);
    
    addLog(`Starting execution of workflow "${workflowData.name}" (ID: ${workflowData.id})`);

    try {
      // Parse input based on selected tab
      let parsedInput;
      
      if (inputTab === 'json') {
        try {
          parsedInput = JSON.parse(jsonInput);
          addLog(`Using JSON input: ${JSON.stringify(parsedInput)}`);
        } catch (err) {
          setError(`Invalid JSON input: ${err instanceof Error ? err.message : String(err)}`);
          setIsExecuting(false);
          return;
        }
      } else {
        parsedInput = inputData;
        addLog(`Using text input: ${inputData}`);
      }
      
      // Execute workflow with appropriate metadata
      const result = await executeWorkflow(
        workflowData.id,
        parsedInput,
        {
          onNodeStateChange: (nodeId, state) => {
            setNodeStates(prev => ({
              ...prev,
              [nodeId]: state
            }));
            
            const statusEmoji = state.status === 'running' ? '🔄' : 
                               state.status === 'completed' ? '✅' : 
                               state.status === 'error' ? '❌' : '⏳';
                               
            addLog(`Node ${nodeId} ${statusEmoji} ${state.status}${state.error ? `: ${state.error}` : ''}`);
          },
          onWorkflowComplete: (state) => {
            setExecutionResult(state);
            const statusEmoji = state.status === 'completed' ? '✅' : '❌';
            addLog(`Workflow execution ${statusEmoji} ${state.status}${state.error ? `: ${state.error}` : ''}`);
          },
          metadata: {
            source: parsedInput.source || 'ui_form',
            test_execution: true,
            debug_mode: debugMode
          },
          logToServer: !skipLogging
        }
      );
      
      addLog(`Execution completed with status: ${result.status}`);
    } catch (err) {
      console.error('Error executing workflow:', err);
      setError(`Failed to execute workflow: ${err instanceof Error ? err.message : String(err)}`);
      addLog(`Error executing workflow: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsExecuting(false);
    }
  };

  // Helper to add a log message
  const addLog = (message: string) => {
    setExecutionLogs(prev => [...prev, `[${new Date().toISOString()}] ${message}`]);
  };

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Workflow Test Bench</h1>
      <p className="text-muted-foreground mb-6">
        This page allows you to test workflow execution directly in the client-side workflow engine.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left column - Controls */}
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Workflow Settings</CardTitle>
              <CardDescription>Load and execute a workflow</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="workflowId">Workflow ID</Label>
                <div className="flex gap-2">
                  <Input
                    id="workflowId"
                    value={workflowId}
                    onChange={(e) => setWorkflowId(e.target.value)}
                    placeholder="Enter workflow ID"
                  />
                  <Button onClick={handleLoadWorkflow} disabled={isLoading}>
                    {isLoading ? 'Loading...' : 'Load'}
                  </Button>
                </div>
              </div>

              {workflowData && (
                <div className="pt-2">
                  <p className="font-medium">{workflowData.name}</p>
                  <p className="text-sm text-muted-foreground">{workflowData.description}</p>
                  <div className="flex gap-2 mt-2">
                    <Badge>{workflowData.type}</Badge>
                    <Badge variant="outline">ID: {workflowData.id}</Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Input Data</CardTitle>
              <CardDescription>Configure the input for this workflow</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Tabs defaultValue={inputTab} onValueChange={setInputTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="text">Text</TabsTrigger>
                  <TabsTrigger value="json">JSON</TabsTrigger>
                </TabsList>
                <TabsContent value="text" className="pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="inputText">Text Input</Label>
                    <Textarea
                      id="inputText"
                      value={inputData}
                      onChange={(e) => setInputData(e.target.value)}
                      placeholder="Enter text input for the workflow"
                      rows={5}
                    />
                  </div>
                </TabsContent>
                <TabsContent value="json" className="pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="jsonInput">JSON Input</Label>
                    <Textarea
                      id="jsonInput"
                      value={jsonInput}
                      onChange={(e) => setJsonInput(e.target.value)}
                      placeholder="Enter JSON input for the workflow"
                      rows={8}
                      className="font-mono text-sm"
                    />
                  </div>
                </TabsContent>
              </Tabs>
              
              <div className="pt-2">
                <Label className="text-sm mb-2 block">Common Test Templates</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setJsonInput('{\n  "name": "Test Agent",\n  "description": "A test agent created from the workflow tester",\n  "type": "custom",\n  "icon": "sparkles",\n  "source": "ui_form"\n}')}
                  >
                    New Agent
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setJsonInput('{\n  "name": "Weather Agent",\n  "description": "Checks weather forecasts",\n  "type": "weather",\n  "icon": "cloud",\n  "source": "ai_chat"\n}')}
                  >
                    Weather Agent
                  </Button>
                </div>
              </div>
              
              <div className="pt-2">
                <Label className="text-sm mb-2 block">Execution Options</Label>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="skipLogging" 
                      checked={skipLogging}
                      onCheckedChange={(checked) => setSkipLogging(checked as boolean)}
                    />
                    <Label htmlFor="skipLogging" className="text-sm font-normal">Skip server logging</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="debugMode" 
                      checked={debugMode}
                      onCheckedChange={(checked) => setDebugMode(checked as boolean)}
                    />
                    <Label htmlFor="debugMode" className="text-sm font-normal">Enable debug mode</Label>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleExecuteWorkflow} 
                disabled={isExecuting || !workflowData} 
                className="w-full"
              >
                {isExecuting ? 'Executing...' : 'Run Workflow'}
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Right column - Results */}
        <div className="md:col-span-2 space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Execution Logs</CardTitle>
              <CardDescription>Real-time logs of workflow execution</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[200px] w-full rounded-md border p-4">
                <div className="font-mono text-sm">
                  {executionLogs.length === 0 ? (
                    <p className="text-muted-foreground italic">No logs yet. Run a workflow to see execution logs.</p>
                  ) : (
                    executionLogs.map((log, i) => (
                      <div key={i} className="pb-1">
                        {log}
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Node Execution States</CardTitle>
              <CardDescription>Status of each node in the workflow</CardDescription>
            </CardHeader>
            <CardContent>
              {Object.keys(nodeStates).length === 0 ? (
                <p className="text-muted-foreground italic">No node states yet. Execute a workflow to see node states.</p>
              ) : (
                <div className="space-y-4">
                  {Object.entries(nodeStates).map(([nodeId, state]) => {
                    const statusColor = 
                      state.status === 'completed' ? 'bg-green-500' :
                      state.status === 'running' ? 'bg-blue-500' :
                      state.status === 'error' ? 'bg-red-500' : 'bg-gray-500';
                    
                    return (
                      <div key={nodeId} className="rounded-md border p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-medium">Node: {nodeId}</div>
                          <div className="flex items-center">
                            <div className={`h-3 w-3 rounded-full ${statusColor} mr-2`}></div>
                            <span className="text-sm font-medium">{state.status}</span>
                          </div>
                        </div>
                        
                        {state.error && (
                          <div className="mt-2 text-sm text-red-500">
                            Error: {state.error}
                          </div>
                        )}
                        
                        {state.output && (
                          <div className="mt-2">
                            <div className="text-sm font-medium">Output:</div>
                            <div className="mt-1 p-2 bg-muted rounded text-xs font-mono overflow-auto max-h-[100px]">
                              {JSON.stringify(state.output, null, 2)}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {executionResult && (
            <Card>
              <CardHeader>
                <CardTitle>Final Result</CardTitle>
                <CardDescription>Workflow execution result</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge variant={executionResult.status === 'completed' ? 'default' : 'destructive'}>
                      {executionResult.status}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      Execution time: {
                        executionResult.endTime && executionResult.startTime
                          ? `${(new Date(executionResult.endTime).getTime() - new Date(executionResult.startTime).getTime()) / 1000}s`
                          : 'Unknown'
                      }
                    </span>
                  </div>
                  
                  {executionResult.error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-800">
                      {executionResult.error}
                    </div>
                  )}
                  
                  {executionResult.output && (
                    <div>
                      <Separator className="my-4" />
                      <div className="font-medium mb-2">Output Data:</div>
                      <pre className="bg-muted p-4 rounded-md overflow-auto max-h-[300px] text-xs">
                        {JSON.stringify(executionResult.output, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
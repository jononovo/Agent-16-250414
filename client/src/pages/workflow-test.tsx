import React, { useState } from 'react';
import { useRoute } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { Workflow } from '@shared/schema';

import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

export default function WorkflowTestPage() {
  const [, params] = useRoute('/workflow-test/:id');
  const workflowId = params?.id;
  
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Fetch workflow details
  const { data: workflow, isLoading: isLoadingWorkflow } = useQuery<Workflow>({
    queryKey: [`/api/workflows/${workflowId}`],
    enabled: !!workflowId,
  });
  
  const handleExecute = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setResult(null);
    
    try {
      const response = await apiRequest<any>(
        'POST',
        `/api/test-workflow/${workflowId}`,
        { prompt }
      );
      
      setResult(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error executing workflow:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  if (!workflowId) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>No workflow ID provided</AlertDescription>
        </Alert>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Test Workflow</h1>
      
      {isLoadingWorkflow ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>{workflow?.name || 'Workflow'}</CardTitle>
                <CardDescription>{workflow?.description || 'Test your workflow with different prompts'}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1" htmlFor="prompt">
                      Prompt
                    </label>
                    <Textarea
                      id="prompt"
                      placeholder="Enter your prompt here..."
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      rows={4}
                      className="w-full"
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={handleExecute} 
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Executing Workflow...
                    </>
                  ) : (
                    'Execute Workflow'
                  )}
                </Button>
              </CardFooter>
            </Card>
            
            {error && (
              <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {result && (
              <Card>
                <CardHeader>
                  <CardTitle>Execution Result</CardTitle>
                  <CardDescription>
                    Status: {result.status} | 
                    Execution Time: {result.executionTime?.toFixed(2)}s
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {result.error && (
                      <Alert variant="destructive">
                        <AlertTitle>Execution Error</AlertTitle>
                        <AlertDescription>{result.error}</AlertDescription>
                      </Alert>
                    )}
                    
                    <div>
                      <h3 className="font-medium mb-2">Output:</h3>
                      <pre className="bg-muted p-4 rounded-md overflow-auto max-h-96 text-sm">
                        {JSON.stringify(result.result, null, 2)}
                      </pre>
                    </div>
                    
                    <div>
                      <h3 className="font-medium mb-2">Node States:</h3>
                      <div className="overflow-auto max-h-96">
                        {Object.entries(result.nodeStates || {}).map(([nodeId, state]: [string, any]) => (
                          <div key={nodeId} className="mb-4 p-3 border rounded-md">
                            <p className="font-medium">
                              Node: {nodeId}
                              <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                                state.state === 'complete' ? 'bg-green-100 text-green-800' :
                                state.state === 'error' ? 'bg-red-100 text-red-800' :
                                state.state === 'running' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {state.state}
                              </span>
                            </p>
                            {state.error && (
                              <p className="text-red-500 text-sm mt-1">{state.error}</p>
                            )}
                            <div className="mt-2">
                              <p className="text-sm font-medium mb-1">Data:</p>
                              <pre className="bg-muted p-2 rounded-md overflow-auto max-h-32 text-xs">
                                {JSON.stringify(state.data, null, 2)}
                              </pre>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </>
      )}
    </div>
  );
}
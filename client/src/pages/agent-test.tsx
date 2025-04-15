/**
 * Agent Test Page
 * 
 * This page provides a test bench for agent tools, allowing both direct tool execution
 * and natural language testing to analyze the agent's behavior.
 */
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Play, Send, Code, MessageSquare, PanelLeft, SplitSquareVertical } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface Tool {
  name: string;
  description: string;
  category: string;
  parameters: any;
}

interface ToolExecutionResult {
  success: boolean;
  message?: string;
  error?: string;
  data?: any;
}

interface AgentResponse {
  response: string;
  action?: string;
  toolName?: string;
  toolParams?: any;
  toolResult?: ToolExecutionResult;
}

const AgentTestPage: React.FC = () => {
  const { toast } = useToast();
  
  // State for direct tool execution
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [toolParameters, setToolParameters] = useState<string>('{}');
  const [directResult, setDirectResult] = useState<string>('');
  const [isExecuting, setIsExecuting] = useState(false);
  
  // State for natural language testing
  const [prompt, setPrompt] = useState<string>('');
  const [context, setContext] = useState<string>('general');
  const [nlResult, setNlResult] = useState<AgentResponse | null>(null);
  const [nlHistory, setNlHistory] = useState<Array<{prompt: string, result: AgentResponse}>>([]);
  const [isSending, setIsSending] = useState(false);
  const [sessionId, setSessionId] = useState(`session_${Math.random().toString(36).substring(2, 9)}`);
  
  // Get available tools
  const { data: tools, isLoading: isLoadingTools } = useQuery<Tool[]>({
    queryKey: ['/api/tools'],
    queryFn: async () => {
      const response = await fetch('/api/tools');
      if (!response.ok) {
        throw new Error('Failed to fetch tools');
      }
      return response.json();
    }
  });
  
  // Group tools by category
  const toolsByCategory = tools ? 
    tools.reduce((acc, tool) => {
      if (!acc[tool.category]) {
        acc[tool.category] = [];
      }
      acc[tool.category].push(tool);
      return acc;
    }, {} as Record<string, Tool[]>) : 
    {};
    
  // Format JSON with indentation
  const formatJson = (json: any) => {
    try {
      return JSON.stringify(json, null, 2);
    } catch (error) {
      return String(json);
    }
  };
  
  // Direct tool execution
  const executeDirectTool = async () => {
    if (!selectedTool) {
      toast({
        title: 'No tool selected',
        description: 'Please select a tool to execute',
        variant: 'destructive'
      });
      return;
    }
    
    setIsExecuting(true);
    
    try {
      // Parse parameters (handle JSON errors)
      let params = {};
      try {
        params = JSON.parse(toolParameters);
      } catch (error) {
        toast({
          title: 'Invalid JSON',
          description: 'Please check your parameters JSON format',
          variant: 'destructive'
        });
        setIsExecuting(false);
        return;
      }
      
      // Call the API to execute the tool directly
      const response = await fetch('/api/tools/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tool: selectedTool.name,
          parameters: params
        }),
      });
      
      const data = await response.json();
      setDirectResult(formatJson(data));
    } catch (error) {
      setDirectResult(JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }, null, 2));
    } finally {
      setIsExecuting(false);
    }
  };
  
  // Natural language testing
  const testNaturalLanguage = async () => {
    if (!prompt.trim()) {
      toast({
        title: 'Empty prompt',
        description: 'Please enter a prompt to test',
        variant: 'destructive'
      });
      return;
    }
    
    setIsSending(true);
    
    try {
      // Call the agent chat API
      const response = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: prompt,
          context,
          sessionId,
          debug: true // Request debug information
        }),
      });
      
      const result = await response.json();
      setNlResult(result);
      
      // Add to history
      setNlHistory(prev => [
        { prompt, result },
        ...prev
      ]);
      
      // Clear prompt
      setPrompt('');
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to get response from agent',
        variant: 'destructive'
      });
    } finally {
      setIsSending(false);
    }
  };
  
  // Reset the natural language test
  const resetNlTest = () => {
    setNlResult(null);
    setNlHistory([]);
    setSessionId(`session_${Math.random().toString(36).substring(2, 9)}`);
    toast({
      title: 'Test reset',
      description: 'Started a new conversation session'
    });
  };
  
  // Update parameter template when tool selection changes
  useEffect(() => {
    if (selectedTool && selectedTool.parameters) {
      // Create an empty template based on the required parameters
      const requiredParams = selectedTool.parameters.required || [];
      const template: Record<string, any> = {};
      
      requiredParams.forEach((param: string) => {
        // Set empty strings or appropriate default values
        template[param] = '';
      });
      
      setToolParameters(formatJson(template));
    } else {
      setToolParameters('{}');
    }
  }, [selectedTool]);
  
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Agent Tool Testing</h1>
      <p className="text-muted-foreground mb-6">
        This page allows you to test agent tools directly or via natural language input, helping you 
        understand how the agent processes requests and uses tools.
      </p>
      
      <Tabs defaultValue="direct" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="direct" className="flex items-center">
            <Code className="mr-2 h-4 w-4" />
            Direct Tool Execution
          </TabsTrigger>
          <TabsTrigger value="nl" className="flex items-center">
            <MessageSquare className="mr-2 h-4 w-4" />
            Natural Language Testing
          </TabsTrigger>
        </TabsList>
        
        {/* Direct Tool Execution Tab */}
        <TabsContent value="direct">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Tool Selection Panel */}
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle>Tool Selection</CardTitle>
                <CardDescription>Select a tool to execute directly</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px] pr-4">
                  {isLoadingTools ? (
                    <div className="flex items-center justify-center h-20">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {Object.entries(toolsByCategory).map(([category, categoryTools]) => (
                        <div key={category} className="space-y-2">
                          <h3 className="font-medium text-sm uppercase text-muted-foreground">
                            {category}
                          </h3>
                          <div className="space-y-1">
                            {categoryTools.map(tool => (
                              <Button
                                key={tool.name}
                                variant={selectedTool?.name === tool.name ? "default" : "ghost"}
                                className="w-full justify-start"
                                onClick={() => setSelectedTool(tool)}
                              >
                                {tool.name}
                              </Button>
                            ))}
                          </div>
                          <Separator className="my-2" />
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
            
            {/* Parameters and Execution Panel */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>
                  {selectedTool ? `${selectedTool.name}` : 'No Tool Selected'}
                </CardTitle>
                <CardDescription>
                  {selectedTool ? selectedTool.description : 'Select a tool from the left panel'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedTool && (
                  <>
                    <div className="mb-4">
                      <Label htmlFor="parameters" className="mb-2 block">Parameters:</Label>
                      <Textarea
                        id="parameters"
                        value={toolParameters}
                        onChange={(e) => setToolParameters(e.target.value)}
                        className="font-mono h-48 resize-none"
                        placeholder="Enter parameters as JSON"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Enter parameters as a JSON object.
                      </p>
                    </div>
                    
                    <Button 
                      onClick={executeDirectTool} 
                      disabled={isExecuting}
                      className="w-full"
                    >
                      {isExecuting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Executing...
                        </>
                      ) : (
                        <>
                          <Play className="mr-2 h-4 w-4" />
                          Execute Tool
                        </>
                      )}
                    </Button>
                    
                    {directResult && (
                      <div className="mt-4">
                        <Label htmlFor="result" className="mb-2 block">Result:</Label>
                        <div className="relative">
                          <pre className="bg-muted p-4 rounded-md overflow-auto text-sm max-h-64">
                            <code>{directResult}</code>
                          </pre>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Natural Language Testing Tab */}
        <TabsContent value="nl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Input and History Panel */}
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>Natural Language Input</span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={resetNlTest}
                  >
                    Reset Session
                  </Button>
                </CardTitle>
                <CardDescription>Test how the agent interprets and processes natural language</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="context" className="mb-2 block">Context:</Label>
                    <Select value={context} onValueChange={setContext}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a context" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="canvas">Canvas</SelectItem>
                        <SelectItem value="workflow">Workflow</SelectItem>
                        <SelectItem value="home">Home</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      The context helps the agent decide which tools are available.
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor="prompt" className="mb-2 block">Prompt:</Label>
                    <Textarea
                      id="prompt"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      className="h-32 resize-none"
                      placeholder="Enter your natural language prompt"
                    />
                  </div>
                  
                  <Button 
                    onClick={testNaturalLanguage} 
                    disabled={isSending}
                    className="w-full"
                  >
                    {isSending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Send to Agent
                      </>
                    )}
                  </Button>
                  
                  {nlHistory.length > 0 && (
                    <div className="mt-4">
                      <h3 className="font-medium text-sm">History:</h3>
                      <ScrollArea className="h-[200px] mt-2">
                        <div className="space-y-2">
                          {nlHistory.map((item, index) => (
                            <div 
                              key={index} 
                              className="p-2 rounded border cursor-pointer hover:bg-muted"
                              onClick={() => setNlResult(item.result)}
                            >
                              <p className="text-sm font-medium truncate">{item.prompt}</p>
                              <p className="text-xs text-muted-foreground truncate">
                                {item.result.toolName ? `Used: ${item.result.toolName}` : 'No tool used'}
                              </p>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Results Panel */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Agent Response</CardTitle>
                <CardDescription>See how the agent processed the request and what tools were used</CardDescription>
              </CardHeader>
              <CardContent>
                {nlResult ? (
                  <div className="space-y-4">
                    <div>
                      <Label className="mb-2 block">User Response:</Label>
                      <div className="p-4 rounded-md bg-muted">
                        <p>{nlResult.response}</p>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <Label className="mb-2 block">Technical Details:</Label>
                      
                      <div className="space-y-2">
                        <div className="bg-muted p-3 rounded-md">
                          <h4 className="text-sm font-medium">Action:</h4>
                          <p className="text-sm">{nlResult.action || 'No action taken'}</p>
                        </div>
                        
                        {nlResult.toolName && (
                          <div className="bg-muted p-3 rounded-md">
                            <h4 className="text-sm font-medium">Tool Used:</h4>
                            <p className="text-sm">{nlResult.toolName}</p>
                          </div>
                        )}
                        
                        {nlResult.toolParams && (
                          <div className="bg-muted p-3 rounded-md">
                            <h4 className="text-sm font-medium">Tool Parameters:</h4>
                            <pre className="text-xs overflow-auto max-h-32">
                              <code>{formatJson(nlResult.toolParams)}</code>
                            </pre>
                          </div>
                        )}
                        
                        {nlResult.toolResult && (
                          <div className="bg-muted p-3 rounded-md">
                            <h4 className="text-sm font-medium">Tool Result:</h4>
                            <div className="flex items-center gap-2 mb-1">
                              <div 
                                className={`h-2 w-2 rounded-full ${
                                  nlResult.toolResult.success ? 'bg-green-500' : 'bg-red-500'
                                }`} 
                              />
                              <span className="text-xs">
                                {nlResult.toolResult.success ? 'Success' : 'Failed'}
                              </span>
                            </div>
                            <pre className="text-xs overflow-auto max-h-64">
                              <code>{formatJson(nlResult.toolResult)}</code>
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 text-center">
                    <PanelLeft className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No response yet</h3>
                    <p className="text-muted-foreground max-w-md">
                      Enter a natural language prompt on the left panel and send it to the agent to see the results here.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AgentTestPage;
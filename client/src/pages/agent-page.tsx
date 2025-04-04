import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  Eye,
  Loader2,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Play,
  Clock
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import type { Agent, Log as BaseLog, Workflow } from '@shared/schema';
import { queryClient, apiRequest } from '@/lib/queryClient';

// Extended Log type with proper typing for executionPath
interface ExecutionPath {
  nodes?: string[];
  completed?: boolean;
  error?: string;
}

interface Log extends BaseLog {
  executionPath: ExecutionPath;
}

const AgentPage = () => {
  const [_, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const agentId = parseInt(params.id);
  const [activeTab, setActiveTab] = useState('workflows');
  const [selectedLog, setSelectedLog] = useState<Log | null>(null);
  const [isLogDetailsOpen, setIsLogDetailsOpen] = useState(false);
  
  // Debug logs
  useEffect(() => {
    console.log('Agent page params:', params);
    console.log('Agent ID:', agentId);
    
    if (isNaN(agentId)) {
      console.error('Invalid agent ID');
    }
  }, [params, agentId]);

  // Fetch agent details
  const { data: agent, isLoading: isLoadingAgent, error: agentError } = useQuery({
    queryKey: ['/api/agents', agentId],
    queryFn: async () => {
      return apiRequest<Agent>(`/api/agents/${agentId}`);
    },
    enabled: !isNaN(agentId)
  });

  // Fetch agent workflows
  const { data: workflows, isLoading: isLoadingWorkflows } = useQuery({
    queryKey: ['/api/agents', agentId, 'workflows'],
    queryFn: async () => {
      return apiRequest<Workflow[]>(`/api/agents/${agentId}/workflows`);
    },
    enabled: !isNaN(agentId) && activeTab === 'workflows'
  });

  // Fetch agent logs
  const { data: logs, isLoading: isLoadingLogs } = useQuery({
    queryKey: ['/api/agents', agentId, 'logs'],
    queryFn: async () => {
      return apiRequest<Log[]>(`/api/agents/${agentId}/logs`);
    },
    enabled: !isNaN(agentId) && activeTab === 'logs'
  });

  const handleLogClick = (log: Log) => {
    setSelectedLog(log);
    setIsLogDetailsOpen(true);
  };

  const openWorkflowEditor = (workflowId: number) => {
    setLocation(`/workflow-editor/${workflowId}`);
  };
  
  // Function to unlink a workflow from the agent
  const unlinkWorkflow = async (workflowId: number) => {
    if (!confirm("Are you sure you want to unlink this workflow from the agent?")) {
      return;
    }
    
    try {
      // Update the workflow to set agentId to null
      const response = await fetch(`/api/workflows/${workflowId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agentId: null
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to unlink workflow');
      }
      
      // Invalidate the workflows query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['/api/agents', agentId, 'workflows'] });
      
      // Show success message
      alert('Workflow has been unlinked from this agent');
    } catch (error) {
      console.error('Error unlinking workflow:', error);
      alert('Failed to unlink workflow. Please try again.');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'running':
        return <Play className="h-4 w-4 text-blue-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatDate = (date: Date | null | string) => {
    if (!date) return 'N/A';
    return format(new Date(date), 'MMM dd, yyyy HH:mm:ss');
  };

  const formatJsonContent = (content: any) => {
    if (!content) return 'No data';
    
    try {
      const jsonString = typeof content === 'string' 
        ? content 
        : JSON.stringify(content, null, 2);
      
      return (
        <pre className="text-xs whitespace-pre-wrap overflow-auto max-h-[400px] p-2 bg-muted rounded-md">
          {jsonString}
        </pre>
      );
    } catch (e) {
      return <span>Invalid format</span>;
    }
  };

  if (isLoadingAgent) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading agent...</span>
      </div>
    );
  }

  if (agentError || !agent) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <h2 className="text-xl font-bold">Error loading agent</h2>
        <p>Unable to load the agent details. The agent may not exist.</p>
        <Button variant="outline" onClick={() => setLocation('/builder')}>
          Return to Builder
        </Button>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl mx-auto p-6">
      <div className="flex items-center gap-2 mb-6">
        <Button variant="ghost" onClick={() => setLocation('/builder')}>
          Builder
        </Button>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">Agent Details</span>
      </div>
      
      <div className="grid gap-6">
        {/* Agent Header */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">{agent.name}</CardTitle>
                <CardDescription className="text-lg mt-1">{agent.description}</CardDescription>
              </div>
              <div className="flex gap-2">
                <Badge variant={agent.status === 'active' ? 'default' : agent.status === 'draft' ? 'outline' : 'secondary'}>
                  {agent.status}
                </Badge>
                <Badge variant="outline">{agent.type}</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Buttons removed as requested */}
          </CardContent>
        </Card>
        
        {/* Tabs for Workflows and Logs */}
        <Tabs defaultValue="workflows" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="workflows">Workflows</TabsTrigger>
            <TabsTrigger value="logs">Execution Logs</TabsTrigger>
          </TabsList>
          
          {/* Workflows Tab */}
          <TabsContent value="workflows">
            <Card>
              <CardHeader>
                <CardTitle>Workflows</CardTitle>
                <CardDescription>
                  Workflows associated with this agent
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingWorkflows ? (
                  <div className="flex justify-center items-center p-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="ml-2">Loading workflows...</span>
                  </div>
                ) : workflows && workflows.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {workflows.map((workflow) => (
                      <Card key={workflow.id}>
                        <CardHeader className="pb-2 cursor-pointer" onClick={() => openWorkflowEditor(workflow.id)}>
                          <div className="flex justify-between items-start">
                            <CardTitle>{workflow.name}</CardTitle>
                            <Badge variant={workflow.status === 'active' ? 'default' : 'outline'}>
                              {workflow.status}
                            </Badge>
                          </div>
                          <CardDescription>{workflow.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-2">
                          <div className="flex justify-between items-center">
                            <div className="text-sm text-muted-foreground">
                              Updated {formatDate(workflow.updatedAt)}
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={(e) => {
                                e.stopPropagation();
                                unlinkWorkflow(workflow.id);
                              }}
                            >
                              Unlink
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-8 border rounded-lg bg-muted/50">
                    <h3 className="font-medium">No workflows found</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      This agent doesn't have any associated workflows yet.
                    </p>
                    <Button className="mt-4" variant="outline" 
                      onClick={() => setLocation(`/builder?create-workflow=${agent.id}`)}>
                      Create a workflow
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Logs Tab */}
          <TabsContent value="logs">
            <Card>
              <CardHeader>
                <CardTitle>Execution Logs</CardTitle>
                <CardDescription>
                  Recent execution logs for this agent
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingLogs ? (
                  <div className="flex justify-center items-center p-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="ml-2">Loading logs...</span>
                  </div>
                ) : logs && logs.length > 0 ? (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Status</TableHead>
                          <TableHead>Started</TableHead>
                          <TableHead>Completed</TableHead>
                          <TableHead>Input</TableHead>
                          <TableHead>Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {logs.map((log) => (
                          <TableRow key={log.id} className="cursor-pointer hover:bg-accent/50" 
                            onClick={() => handleLogClick(log)}>
                            <TableCell>
                              <div className="flex items-center">
                                {getStatusIcon(log.status)}
                                <span className="ml-2 capitalize">{log.status}</span>
                              </div>
                            </TableCell>
                            <TableCell>{formatDate(log.startedAt)}</TableCell>
                            <TableCell>{formatDate(log.completedAt)}</TableCell>
                            <TableCell className="truncate max-w-[200px]">
                              {log.input && typeof log.input === 'object' 
                                ? (typeof log.input === 'object' && 'query' in log.input && log.input.query
                                  ? String(log.input.query).substring(0, 30) + (String(log.input.query).length > 30 ? '...' : '')
                                  : JSON.stringify(log.input).substring(0, 30) + '...')
                                : 'No input data'}
                            </TableCell>
                            <TableCell>
                              <Button size="sm" variant="ghost">
                                <Eye className="h-4 w-4 mr-2" />
                                View
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center p-8 border rounded-lg bg-muted/50">
                    <h3 className="font-medium">No logs found</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      This agent doesn't have any execution logs yet.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Log Details Sheet */}
      <Sheet open={isLogDetailsOpen} onOpenChange={setIsLogDetailsOpen}>
        <SheetContent className="sm:max-w-lg md:max-w-xl lg:max-w-2xl">
          <SheetHeader>
            <SheetTitle>Log Details</SheetTitle>
            <SheetDescription>
              Execution details for log #{selectedLog?.id}
            </SheetDescription>
          </SheetHeader>
          
          {selectedLog && (
            <ScrollArea className="h-[calc(100vh-120px)] mt-6 pr-4">
              <div className="grid gap-6">
                {/* Status and Timestamps */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Status</h4>
                    <div className="flex items-center">
                      {getStatusIcon(selectedLog.status)}
                      <span className="ml-2 font-medium capitalize">{selectedLog.status}</span>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Duration</h4>
                    <div className="font-medium">
                      {selectedLog.completedAt 
                        ? (() => {
                            try {
                              // Both timestamps from database are either string or Date objects
                              const completedTime = typeof selectedLog.completedAt === 'string' 
                                ? new Date(selectedLog.completedAt).getTime() 
                                : (selectedLog.completedAt as unknown as Date).getTime();
                                
                              const startedTime = typeof selectedLog.startedAt === 'string'
                                ? new Date(selectedLog.startedAt).getTime()
                                : (selectedLog.startedAt as unknown as Date).getTime();
                                
                              return `${Math.round((completedTime - startedTime) / 1000)} seconds`;
                            } catch (e) {
                              return 'Error calculating duration';
                            }
                          })()
                        : 'Not completed'}
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Started At</h4>
                    <div className="font-medium">{formatDate(selectedLog.startedAt)}</div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Completed At</h4>
                    <div className="font-medium">{formatDate(selectedLog.completedAt)}</div>
                  </div>
                </div>
                
                <Separator />
                
                {/* Input */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Input</h4>
                  {formatJsonContent(selectedLog.input)}
                </div>
                
                {/* Output or Error */}
                {selectedLog.status === 'error' ? (
                  <div>
                    <h4 className="text-sm font-medium mb-2 text-red-500">Error</h4>
                    <div className="text-red-500 p-2 bg-red-50 dark:bg-red-950/30 rounded-md">
                      {selectedLog.error || 'Unknown error'}
                    </div>
                  </div>
                ) : (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Output</h4>
                    {formatJsonContent(selectedLog.output)}
                  </div>
                )}
                
                <Separator />
                
                {/* Execution Path */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Execution Path</h4>
                  {selectedLog.executionPath && (
                    <div className="border rounded-md p-3">
                      {selectedLog.executionPath.nodes && Array.isArray(selectedLog.executionPath.nodes) ? (
                        <div>
                          <div className="text-sm font-medium mb-2">Nodes Executed:</div>
                          <div className="grid grid-cols-1 gap-2">
                            {selectedLog.executionPath.nodes.map((node: string, index: number) => (
                              <div key={index} className="flex items-center bg-accent/50 p-2 rounded-md">
                                <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium">
                                  {index + 1}
                                </div>
                                <span className="ml-2">{node}</span>
                              </div>
                            ))}
                          </div>
                          
                          <div className="mt-4 flex items-center">
                            <div className="h-2 w-2 rounded-full mr-2" 
                              style={{ backgroundColor: selectedLog.executionPath.completed ? '#4ade80' : '#ef4444' }}></div>
                            <span className="text-sm">
                              {selectedLog.executionPath.completed ? 'Completed Successfully' : 'Failed to Complete'}
                            </span>
                          </div>
                          
                          {selectedLog.executionPath.error && (
                            <div className="mt-2 text-red-500 text-sm">
                              {selectedLog.executionPath.error}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">
                          No execution path data available
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default AgentPage;
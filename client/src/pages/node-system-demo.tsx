/**
 * Node System Demo Page
 * 
 * This page demonstrates the new node system architecture.
 * It shows the available nodes and allows testing their execution.
 */
import { useState, useEffect } from 'react';
import { getAllNodes, getNodesByCategory, getAllCategories } from '../lib/nodeRegistry';
import { executeNode } from '../lib/nodeExecution';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { InfoIcon, PlayIcon, ArrowRightIcon } from 'lucide-react';
import { NodeRegistryEntry } from '../nodes/registry';

export default function NodeSystemDemo() {
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [nodes, setNodes] = useState<NodeRegistryEntry[]>([]);
  const [selectedNode, setSelectedNode] = useState<NodeRegistryEntry | null>(null);
  const [nodeInput, setNodeInput] = useState<string>('');
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load categories and nodes on mount
  useEffect(() => {
    try {
      const allCategories = getAllCategories();
      setCategories(allCategories);
      
      if (allCategories.length > 0) {
        setSelectedCategory(allCategories[0]);
      }
      
      const allNodes = getAllNodes();
      setNodes(allNodes);
    } catch (err: any) {
      setError(`Error loading nodes: ${err.message}`);
    }
  }, []);

  // Filter nodes when category changes
  useEffect(() => {
    if (selectedCategory) {
      try {
        const categoryNodes = getNodesByCategory(selectedCategory);
        setNodes(categoryNodes);
        
        if (categoryNodes.length > 0 && (!selectedNode || !categoryNodes.includes(selectedNode))) {
          setSelectedNode(categoryNodes[0]);
        }
      } catch (err: any) {
        setError(`Error filtering nodes: ${err.message}`);
      }
    }
  }, [selectedCategory]);

  // Execute the selected node
  const handleExecuteNode = async () => {
    if (!selectedNode) return;
    
    setIsExecuting(true);
    setError(null);
    setExecutionResult(null);
    
    try {
      // Create node data based on the node type
      let nodeData: any = {};
      
      if (selectedNode.type === 'text_input') {
        nodeData = { inputText: nodeInput };
      } else if (selectedNode.type === 'claude') {
        nodeData = { 
          prompt: nodeInput,
          model: 'claude-3-haiku-20240307',
          temperature: 0.7,
          maxTokens: 500
        };
      }
      
      // Execute the node
      const result = await executeNode(selectedNode.type, nodeData);
      setExecutionResult(result);
    } catch (err: any) {
      setError(`Error executing node: ${err.message}`);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Node System Demo</h1>
      
      {error && (
        <Alert variant="destructive" className="mb-6">
          <InfoIcon className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">Available Nodes</h2>
              <p className="text-sm text-muted-foreground">Select a node to test</p>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue={categories[0]} value={selectedCategory} onValueChange={setSelectedCategory}>
                <TabsList className="w-full mb-4">
                  {categories.map(category => (
                    <TabsTrigger key={category} value={category} className="flex-1">
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </TabsTrigger>
                  ))}
                </TabsList>
                
                <TabsContent value={selectedCategory} className="min-h-[200px]">
                  <div className="space-y-3">
                    {nodes.length === 0 && <p className="text-center text-sm text-muted-foreground py-6">No nodes found in this category</p>}
                    
                    {nodes.map(node => (
                      <div 
                        key={node.type}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedNode?.type === node.type 
                            ? 'bg-primary text-primary-foreground border-primary' 
                            : 'bg-card hover:bg-accent'
                        }`}
                        onClick={() => setSelectedNode(node)}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-md bg-background flex items-center justify-center">
                            {typeof node.icon === 'string' && <span>{node.icon}</span>}
                            {typeof node.icon !== 'string' && node.icon}
                          </div>
                          <span className="font-medium">{node.metadata.name}</span>
                        </div>
                        <p className="text-xs mt-1 line-clamp-2">{node.metadata.description}</p>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
        
        <div className="md:col-span-2">
          {selectedNode && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">{selectedNode.metadata.name}</h2>
                  <Badge variant="outline">{selectedNode.type}</Badge>
                </div>
                <p className="text-sm">{selectedNode.metadata.description}</p>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">Node Details</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="bg-muted p-2 rounded">
                      <span className="font-medium">Category:</span> {selectedNode.metadata.category}
                    </div>
                    <div className="bg-muted p-2 rounded">
                      <span className="font-medium">Version:</span> {selectedNode.metadata.version}
                    </div>
                    <div className="bg-muted p-2 rounded col-span-2">
                      <span className="font-medium">Inputs:</span> {
                        Object.keys(selectedNode.schema.inputs).length > 0 
                          ? Object.keys(selectedNode.schema.inputs).join(', ') 
                          : 'None'
                      }
                    </div>
                    <div className="bg-muted p-2 rounded col-span-2">
                      <span className="font-medium">Outputs:</span> {Object.keys(selectedNode.schema.outputs).join(', ')}
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-2">Test Node</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium">Input:</label>
                      <textarea
                        rows={4}
                        className="w-full p-2 border rounded mt-1"
                        value={nodeInput}
                        onChange={(e) => setNodeInput(e.target.value)}
                        placeholder={
                          selectedNode.type === 'text_input' 
                            ? 'Enter input text...' 
                            : selectedNode.type === 'claude'
                            ? 'Enter prompt for Claude...'
                            : 'Enter input data...'
                        }
                      />
                    </div>
                    
                    <Button 
                      onClick={handleExecuteNode} 
                      disabled={isExecuting}
                      className="w-full"
                    >
                      {isExecuting ? 'Executing...' : 'Execute Node'} <PlayIcon className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {executionResult && (
                  <div>
                    <h3 className="text-sm font-medium mb-2">Execution Result</h3>
                    <div className="bg-muted p-3 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant={executionResult.meta.status === 'success' ? 'default' : 'destructive'}>
                          {executionResult.meta.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Executed in {
                            (new Date(executionResult.meta.endTime).getTime() - 
                             new Date(executionResult.meta.startTime).getTime()
                            ).toFixed(0)
                          }ms
                        </span>
                      </div>
                      
                      {executionResult.meta.status === 'error' ? (
                        <div className="text-destructive text-sm">{executionResult.meta.message}</div>
                      ) : executionResult.items.length > 0 ? (
                        <div className="text-sm">
                          <h4 className="font-medium flex items-center">
                            <ArrowRightIcon className="h-3 w-3 mr-1" /> Output:
                          </h4>
                          <pre className="mt-2 p-2 bg-card rounded overflow-auto max-h-[200px] text-xs">
                            {JSON.stringify(executionResult.items[0].json, null, 2)}
                          </pre>
                        </div>
                      ) : (
                        <div className="text-sm">No output items</div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
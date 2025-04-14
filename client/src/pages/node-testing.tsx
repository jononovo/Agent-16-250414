/**
 * Node Testing Page
 * 
 * This page provides a UI for testing individual node implementations
 * and their interactions in simple workflows.
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

// Import node definitions to test
import textTemplateNode from '../nodes/text_template';
import decisionNode from '../nodes/decision';
import dataTransformNode from '../nodes/data_transform';

/**
 * Node Testing Page Component
 */
export default function NodeTestingPage() {
  // Text Template Node State
  const [templateText, setTemplateText] = useState('Hello, {{name}}! Welcome to our {{service}}.');
  const [templateVariables, setTemplateVariables] = useState(JSON.stringify({
    name: 'User',
    service: 'AI workflow system'
  }, null, 2));
  const [templateResult, setTemplateResult] = useState('');
  
  // Decision Node State
  const [decisionInput, setDecisionInput] = useState('');
  const [decisionConditions, setDecisionConditions] = useState(JSON.stringify([
    {
      field: 'text',
      operator: 'contains',
      value: 'workflow',
      outputPath: 'workflow_path'
    },
    {
      field: 'text',
      operator: 'contains',
      value: 'system',
      outputPath: 'system_path'
    }
  ], null, 2));
  const [decisionDefaultPath, setDecisionDefaultPath] = useState('default_path');
  const [decisionResult, setDecisionResult] = useState('');
  
  // Data Transform Node State
  const [transformInput, setTransformInput] = useState('');
  const [transformCode, setTransformCode] = useState(`
return {
  original: data.text,
  words: data.text.split(' '),
  wordCount: data.text.split(' ').length,
  characters: data.text.length
};
  `);
  const [transformResult, setTransformResult] = useState('');
  
  // Active tab state
  const [activeTab, setActiveTab] = useState('template');
  
  // Function to execute the text template node
  const runTemplateNode = async () => {
    try {
      // Parse the variables
      const variables = JSON.parse(templateVariables);
      
      // Create node data
      const nodeData = { template: templateText };
      const inputs = { variables };
      
      // Execute the node
      const result = await textTemplateNode.executor.execute(nodeData, inputs);
      
      // Display the result
      setTemplateResult(JSON.stringify(result, null, 2));
      
      // If successful, also set as input for next nodes
      if (result.text) {
        setDecisionInput(result.text);
        setTransformInput(JSON.stringify({ text: result.text }, null, 2));
      }
      
      return result;
    } catch (error) {
      console.error('Error executing text template node:', error);
      setTemplateResult(JSON.stringify({ error: String(error) }, null, 2));
    }
  };
  
  // Function to execute the decision node
  const runDecisionNode = async () => {
    try {
      // Parse the conditions
      const conditions = JSON.parse(decisionConditions);
      
      // Create node data
      const nodeData = {
        conditions,
        defaultPath: decisionDefaultPath
      };
      const inputs = { text: decisionInput };
      
      // Execute the node
      const result = await decisionNode.executor.execute(nodeData, inputs);
      
      // Display the result
      setDecisionResult(JSON.stringify(result, null, 2));
      
      return result;
    } catch (error) {
      console.error('Error executing decision node:', error);
      setDecisionResult(JSON.stringify({ error: String(error) }, null, 2));
    }
  };
  
  // Function to execute the data transform node
  const runTransformNode = async () => {
    try {
      // Parse the input data
      const inputData = JSON.parse(transformInput);
      
      // Create node data
      const nodeData = {
        mode: 'custom',
        transformation: transformCode
      };
      const inputs = { data: inputData };
      
      // Execute the node
      const result = await dataTransformNode.executor.execute(nodeData, inputs);
      
      // Display the result
      setTransformResult(JSON.stringify(result, null, 2));
      
      return result;
    } catch (error) {
      console.error('Error executing data transform node:', error);
      setTransformResult(JSON.stringify({ error: String(error) }, null, 2));
    }
  };
  
  // Run a simple workflow connecting all nodes
  const runWorkflow = async () => {
    // Step 1: Text Template
    const templateResult = await runTemplateNode();
    if (!templateResult || templateResult.error) {
      return; // Stop if there was an error
    }
    
    // Auto-switch to the decision tab
    setActiveTab('decision');
    
    // Step 2: Decision
    const decisionResult = await runDecisionNode();
    if (!decisionResult) {
      return; // Stop if there was an error
    }
    
    // Auto-switch to the transform tab
    setActiveTab('transform');
    
    // Step 3: Transform
    await runTransformNode();
  };
  
  // Extract variables from template text for display
  const extractVariables = (template: string): string[] => {
    const matches = template.match(/\{\{([^}]+)\}\}/g) || [];
    return matches.map(match => match.replace(/\{\{|\}\}/g, '').trim());
  };
  
  const detectedVariables = extractVariables(templateText);
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Node Testing Laboratory</h1>
      
      <div className="mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Workflow Testing</CardTitle>
            <CardDescription>
              Test a simple workflow connecting multiple nodes together
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={runWorkflow}
              className="w-full"
              size="lg"
            >
              Run Complete Workflow
            </Button>
            <p className="text-sm text-muted-foreground mt-2">
              This will execute all nodes in sequence: Text Template → Decision → Data Transform
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 mb-8">
          <TabsTrigger value="template">Text Template Node</TabsTrigger>
          <TabsTrigger value="decision">Decision Node</TabsTrigger>
          <TabsTrigger value="transform">Data Transform Node</TabsTrigger>
        </TabsList>
        
        {/* Text Template Node */}
        <TabsContent value="template">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Text Template Node</CardTitle>
                <CardDescription>
                  Generate text using a template with variable placeholders
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="template">Template</Label>
                  <Textarea
                    id="template"
                    value={templateText}
                    onChange={(e) => setTemplateText(e.target.value)}
                    className="font-mono text-sm min-h-[100px]"
                    placeholder="Enter template with placeholders"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Use &#123;&#123;variableName&#125;&#125; syntax for variable placeholders
                  </p>
                  
                  {detectedVariables.length > 0 && (
                    <div className="mt-2">
                      <Label className="text-xs">Detected Variables</Label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {detectedVariables.map((variable, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {variable}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="variables">Variables (JSON)</Label>
                  <Textarea
                    id="variables"
                    value={templateVariables}
                    onChange={(e) => setTemplateVariables(e.target.value)}
                    className="font-mono text-sm min-h-[100px]"
                  />
                </div>
                
                <Button onClick={runTemplateNode} className="w-full">Execute Node</Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Result</CardTitle>
                <CardDescription>
                  Output from the text template node
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={templateResult}
                  readOnly
                  className="font-mono text-sm min-h-[300px]"
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Decision Node */}
        <TabsContent value="decision">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Decision Node</CardTitle>
                <CardDescription>
                  Route execution based on conditions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="decisionInput">Input Text</Label>
                  <Textarea
                    id="decisionInput"
                    value={decisionInput}
                    onChange={(e) => setDecisionInput(e.target.value)}
                    className="font-mono text-sm min-h-[80px]"
                  />
                </div>
                
                <div>
                  <Label htmlFor="conditions">Conditions (JSON)</Label>
                  <Textarea
                    id="conditions"
                    value={decisionConditions}
                    onChange={(e) => setDecisionConditions(e.target.value)}
                    className="font-mono text-sm min-h-[150px]"
                  />
                </div>
                
                <div>
                  <Label htmlFor="defaultPath">Default Path</Label>
                  <Textarea
                    id="defaultPath"
                    value={decisionDefaultPath}
                    onChange={(e) => setDecisionDefaultPath(e.target.value)}
                    className="font-mono text-sm min-h-[40px]"
                  />
                </div>
                
                <Button onClick={runDecisionNode} className="w-full">Execute Node</Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Result</CardTitle>
                <CardDescription>
                  Output from the decision node
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={decisionResult}
                  readOnly
                  className="font-mono text-sm min-h-[300px]"
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Data Transform Node */}
        <TabsContent value="transform">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Data Transform Node</CardTitle>
                <CardDescription>
                  Transform data using JavaScript code
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="transformInput">Input Data (JSON)</Label>
                  <Textarea
                    id="transformInput"
                    value={transformInput}
                    onChange={(e) => setTransformInput(e.target.value)}
                    className="font-mono text-sm min-h-[100px]"
                  />
                </div>
                
                <div>
                  <Label htmlFor="transformCode">Transformation Code</Label>
                  <Textarea
                    id="transformCode"
                    value={transformCode}
                    onChange={(e) => setTransformCode(e.target.value)}
                    className="font-mono text-sm min-h-[150px]"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Write JavaScript code that operates on the 'data' object and returns a result
                  </p>
                </div>
                
                <Button onClick={runTransformNode} className="w-full">Execute Node</Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Result</CardTitle>
                <CardDescription>
                  Output from the data transform node
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={transformResult}
                  readOnly
                  className="font-mono text-sm min-h-[300px]"
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
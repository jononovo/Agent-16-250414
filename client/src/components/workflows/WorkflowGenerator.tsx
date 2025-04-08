'use client';

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Loader2, Wand2 } from 'lucide-react';
import { useLocation } from 'wouter';
import { useMutation } from '@tanstack/react-query';

export function WorkflowGenerator() {
  const [prompt, setPrompt] = useState('');
  const [name, setName] = useState('');
  const [complexity, setComplexity] = useState<'simple' | 'moderate' | 'complex'>('moderate');
  const [apiKey, setApiKey] = useState('');
  const { toast } = useToast();
  const [_, navigate] = useLocation();

  const generateMutation = useMutation({
    mutationFn: async (data: {
      prompt: string;
      name?: string;
      options: {
        apiKey?: string;
        complexity: 'simple' | 'moderate' | 'complex';
      };
    }) => {
      const response = await fetch('/api/workflows/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate workflow');
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Workflow Generated!',
        description: `Successfully created: ${data.workflow.name}`,
      });
      
      // Navigate to the workflow editor with the newly created workflow
      navigate(`/workflow-editor?id=${data.workflow.id}`);
    },
    onError: (error: Error) => {
      console.error('Workflow generation error:', error);
      
      // Special handling for API key errors
      if (error.message.includes('API key')) {
        toast({
          title: 'API Key Required',
          description: 'Please provide a valid OpenAI API key to generate workflows.',
          variant: 'destructive',
        });
        return;
      }
      
      toast({
        title: 'Generation Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!prompt.trim()) {
      toast({
        title: 'Input Required',
        description: 'Please enter a description of the workflow you want to create.',
        variant: 'destructive',
      });
      return;
    }
    
    generateMutation.mutate({
      prompt,
      name: name.trim() || undefined,
      options: {
        apiKey: apiKey.trim() || undefined,
        complexity,
      },
    });
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Workflow Generator</CardTitle>
        <CardDescription>
          Describe the workflow you want to create in natural language. Our AI will generate a workflow for you.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Workflow Name (Optional)</Label>
            <Input
              id="name"
              placeholder="Give your workflow a name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="prompt">Workflow Description</Label>
            <Textarea
              id="prompt"
              placeholder="Describe what your workflow should do in detail..."
              className="min-h-[120px]"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              required
            />
            <p className="text-sm text-muted-foreground">
              Example: "Create a workflow that fetches product data, analyzes it, and sends a summary report via email"
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="complexity">Complexity</Label>
            <Select 
              value={complexity} 
              onValueChange={(value) => setComplexity(value as 'simple' | 'moderate' | 'complex')}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select complexity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="simple">Simple (3-5 nodes)</SelectItem>
                <SelectItem value="moderate">Moderate (5-8 nodes)</SelectItem>
                <SelectItem value="complex">Complex (8-12 nodes)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="apiKey">OpenAI API Key (Optional)</Label>
            <Input
              id="apiKey"
              type="password"
              placeholder="sk-..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              If not provided, the system will use the server's API key (if configured).
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            type="submit" 
            className="w-full" 
            disabled={generateMutation.isPending}
          >
            {generateMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Workflow...
              </>
            ) : (
              <>
                <Wand2 className="mr-2 h-4 w-4" />
                Generate Workflow
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
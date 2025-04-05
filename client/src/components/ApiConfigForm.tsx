import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Key, Save, Check, Lock } from "lucide-react";

interface ApiConfigFormProps {
  onApiKeysSaved?: () => void;
  onClose?: () => void;
}

export function ApiConfigForm({ onApiKeysSaved, onClose }: ApiConfigFormProps) {
  const [claudeApiKey, setClaudeApiKey] = useState('');
  const [perplexityApiKey, setPerplexityApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch('/api/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          claudeApiKey: claudeApiKey.trim(),
          perplexityApiKey: perplexityApiKey.trim(),
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save API keys');
      }
      
      const data = await response.json();
      
      toast({
        title: "API Keys Saved",
        description: "Your API keys have been saved successfully.",
        duration: 3000,
      });
      
      setSuccess(true);
      
      // Trigger callback if provided
      if (onApiKeysSaved) {
        onApiKeysSaved();
      }
      
      // Clear form after successful submission
      setTimeout(() => {
        setSuccess(false);
        if (onClose) {
          onClose();
        }
      }, 1500);
      
    } catch (error) {
      console.error('Error saving API keys:', error);
      toast({
        title: "Error",
        description: "Failed to save API keys. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key size={20} />
          API Configuration
        </CardTitle>
        <CardDescription>
          Provide your API keys to enable AI features in the workflow editor
        </CardDescription>
      </CardHeader>
      
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="claude-api-key" className="flex items-center gap-1">
              <Lock size={14} />
              Claude API Key
            </Label>
            <Input
              id="claude-api-key"
              type="password"
              placeholder="sk-ant-api..."
              value={claudeApiKey}
              onChange={(e) => setClaudeApiKey(e.target.value)}
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">
              Used for Claude AI text generation. Get a key from{" "}
              <a href="https://console.anthropic.com/" target="_blank" rel="noreferrer" className="text-primary hover:underline">
                Anthropic Console
              </a>
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="perplexity-api-key" className="flex items-center gap-1">
              <Lock size={14} />
              Perplexity API Key
            </Label>
            <Input
              id="perplexity-api-key"
              type="password"
              placeholder="pplx-..."
              value={perplexityApiKey}
              onChange={(e) => setPerplexityApiKey(e.target.value)}
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">
              Used for Perplexity AI nodes. Get a key from{" "}
              <a href="https://www.perplexity.ai/settings/api" target="_blank" rel="noreferrer" className="text-primary hover:underline">
                Perplexity API Settings
              </a>
            </p>
          </div>
        </CardContent>
        
        <CardFooter className="justify-between">
          {onClose && (
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={loading || success}>
            {loading ? (
              <span className="flex items-center gap-1">
                <Key className="animate-pulse" size={16} />
                Saving...
              </span>
            ) : success ? (
              <span className="flex items-center gap-1">
                <Check size={16} className="text-green-500" />
                Saved
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <Save size={16} />
                Save API Keys
              </span>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
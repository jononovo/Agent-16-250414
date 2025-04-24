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

  // Validate the Claude API key format
  const validateClaudeApiKey = (key: string): boolean => {
    return key.startsWith('sk-ant-') || // New Claude API key format
           key.startsWith('sk-'); // Allow older format too
  };
  
  // Validate the Perplexity API key format
  const validatePerplexityApiKey = (key: string): boolean => {
    return key.startsWith('pplx-');
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const trimmedClaudeKey = claudeApiKey.trim();
    const trimmedPerplexityKey = perplexityApiKey.trim();
    
    // Validate keys if they're provided
    if (trimmedClaudeKey && !validateClaudeApiKey(trimmedClaudeKey)) {
      toast({
        title: "Invalid Claude API Key",
        description: "Claude API keys should start with 'sk-ant-'. Please check your key format.",
        variant: "destructive",
        duration: 5000,
      });
      setLoading(false);
      return;
    }
    
    if (trimmedPerplexityKey && !validatePerplexityApiKey(trimmedPerplexityKey)) {
      toast({
        title: "Invalid Perplexity API Key",
        description: "Perplexity API keys should start with 'pplx-'. Please check your key format.",
        variant: "destructive",
        duration: 5000,
      });
      setLoading(false);
      return;
    }
    
    try {
      const response = await fetch('/api/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          claudeApiKey: trimmedClaudeKey,
          perplexityApiKey: trimmedPerplexityKey,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save API keys');
      }
      
      const data = await response.json();
      
      toast({
        title: "API Keys Saved",
        description: "Your API keys have been saved successfully. You may need to refresh the page for them to take effect.",
        duration: 4000,
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
    <div className="w-full">
      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="claude-api-key" className="flex items-center gap-1 text-base">
              <Lock size={16} />
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
            <Label htmlFor="perplexity-api-key" className="flex items-center gap-1 text-base">
              <Lock size={16} />
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
          
          <div className="flex justify-end">
            {onClose && (
              <Button type="button" variant="outline" onClick={onClose} className="mr-2">
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
          </div>
        </div>
      </form>
    </div>
  );
}
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Key, Save, Check, Lock, RefreshCw } from "lucide-react";

interface ApiConfigFormProps {
  onApiKeysSaved?: () => void;
  onClose?: () => void;
}

export function ApiConfigForm({ onApiKeysSaved, onClose }: ApiConfigFormProps) {
  const [claudeApiKey, setClaudeApiKey] = useState('');
  const [perplexityApiKey, setPerplexityApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true); // Flag to indicate we're checking for existing keys
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();
  
  // Check for existing config on component mount
  useEffect(() => {
    const fetchApiConfig = async () => {
      try {
        setCheckingStatus(true);
        const response = await fetch('/api/config');
        const data = await response.json();
        
        // If we have masks of the keys, show placeholders
        if (data.claudeApiKey) {
          setClaudeApiKey('[API key already configured]');
        }
        
        if (data.perplexityApiKey) {
          setPerplexityApiKey('[API key already configured]');
        }
      } catch (error) {
        console.error('Error checking API config:', error);
      } finally {
        setCheckingStatus(false);
      }
    };
    
    fetchApiConfig();
  }, []);

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
          {checkingStatus ? (
            <div className="py-4 flex flex-col items-center justify-center space-y-2">
              <RefreshCw className="animate-spin h-6 w-6 text-primary" />
              <p className="text-sm text-muted-foreground">Checking for existing API keys...</p>
            </div>
          ) : (
            <>
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
                  onChange={(e) => {
                    // If the input previously showed the placeholder text for existing key, clear it on edit
                    if (claudeApiKey === '[API key already configured]') {
                      setClaudeApiKey('');
                    } else {
                      setClaudeApiKey(e.target.value);
                    }
                  }}
                  onClick={() => {
                    // Clear placeholder text when clicked
                    if (claudeApiKey === '[API key already configured]') {
                      setClaudeApiKey('');
                    }
                  }}
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
                  onChange={(e) => {
                    // If the input previously showed the placeholder text for existing key, clear it on edit
                    if (perplexityApiKey === '[API key already configured]') {
                      setPerplexityApiKey('');
                    } else {
                      setPerplexityApiKey(e.target.value);
                    }
                  }}
                  onClick={() => {
                    // Clear placeholder text when clicked
                    if (perplexityApiKey === '[API key already configured]') {
                      setPerplexityApiKey('');
                    }
                  }}
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  Used for Perplexity AI nodes. Get a key from{" "}
                  <a href="https://www.perplexity.ai/settings/api" target="_blank" rel="noreferrer" className="text-primary hover:underline">
                    Perplexity API Settings
                  </a>
                </p>
              </div>
            </>
          )}
        </CardContent>
        
        <CardFooter className="justify-between">
          {onClose && (
            <Button type="button" variant="outline" onClick={onClose} disabled={checkingStatus}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={loading || success || checkingStatus}>
            {checkingStatus ? (
              <span className="flex items-center gap-1">
                <RefreshCw className="animate-spin" size={16} />
                Checking...
              </span>
            ) : loading ? (
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
import { useState, useEffect } from 'react';
import MainContent from '@/components/layout/MainContent';
import Sidebar from '@/components/layout/Sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ApiConfigForm } from '@/components/ApiConfigForm';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { Key, Settings as SettingsIcon } from 'lucide-react';

const Settings = () => {
  const [apiKeyStatus, setApiKeyStatus] = useState<'present' | 'missing' | 'loading'>('loading');
  const { toast } = useToast();
  const isMobile = useIsMobile();

  useEffect(() => {
    // Check API key status on mount
    const checkApiKeys = async () => {
      try {
        const response = await fetch('/api/config');
        const data = await response.json();
        
        const hasAnyKey = 
          data.claudeApiKey || 
          data.perplexityApiKey || 
          data.openaiApiKey;
        
        setApiKeyStatus(hasAnyKey ? 'present' : 'missing');
      } catch (error) {
        console.error('Error checking API keys:', error);
        setApiKeyStatus('missing');
      }
    };
    
    checkApiKeys();
  }, []);

  const handleApiKeySaved = () => {
    toast({
      title: "API Keys Configured",
      description: "API keys have been saved and will be used in workflows.",
      duration: 3000,
    });
    
    setApiKeyStatus('present');
  };

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar collapsed={isMobile} />
      <MainContent>
        <div className="container mx-auto p-6 max-w-4xl">
          <div className="grid gap-6">
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <SettingsIcon className="h-5 w-5" />
                  Application Settings
                </CardTitle>
                <CardDescription>
                  Configure your application settings to enhance your workflow experience
                </CardDescription>
              </CardHeader>
              <CardContent>
                <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  API Configuration
                </h3>
                <p className="text-muted-foreground mb-4">
                  Provide your API keys to enable AI features in the workflow editor. 
                  These keys are securely stored on the server and used for API calls.
                </p>
                
                <div className="mt-6">
                  <ApiConfigForm onApiKeysSaved={handleApiKeySaved} />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </MainContent>
    </div>
  );
};

export default Settings;
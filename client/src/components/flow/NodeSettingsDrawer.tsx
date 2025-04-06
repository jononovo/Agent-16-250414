import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetClose,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Node } from 'reactflow';
import { NodeData } from './NodeItem';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Save, X } from 'lucide-react';

interface NodeSettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  node: Node<NodeData> | null;
  onSettingsChange: (nodeId: string, settings: Record<string, any>) => void;
}

type TabType = 'properties' | 'variables' | 'settings';

interface SettingsField {
  id: string;
  label: string;
  type: 'text' | 'password' | 'select' | 'textarea';
  placeholder?: string;
  description?: string;
  options?: { value: string; label: string }[];
}

const NodeSettingsDrawer: React.FC<NodeSettingsDrawerProps> = ({
  isOpen,
  onClose,
  node,
  onSettingsChange,
}) => {
  const [activeTab, setActiveTab] = React.useState<TabType>('properties');
  const [settings, setSettings] = React.useState<Record<string, any>>({});
  const [nodeName, setNodeName] = React.useState('');
  const [nodeDescription, setNodeDescription] = React.useState('');

  // Reset settings when node changes
  React.useEffect(() => {
    if (node && node.data) {
      // Initialize with current settings or defaults
      setSettings(node.data.settings || {});
      setNodeName(node.data.label || '');
      setNodeDescription(node.data.description || '');
    } else {
      setSettings({});
      setNodeName('');
      setNodeDescription('');
    }
  }, [node]);

  // Get fields configuration based on node type
  const getFieldsForNodeType = (type: string | undefined): SettingsField[] => {
    if (!type) return [];
    
    switch (type) {
      case 'perplexity':
        return [
          {
            id: 'apiKey',
            label: 'API Key',
            type: 'password',
            placeholder: 'Enter your Perplexity API key',
            description: 'Your Perplexity API key is securely stored and used only for this node.'
          },
          {
            id: 'model',
            label: 'Model',
            type: 'text',
            placeholder: 'e.g., sonar',
            description: 'The Perplexity model to use for search queries.'
          },
        ];
      case 'generate_text':
      case 'generateText':
        return [
          {
            id: 'apiKey',
            label: 'API Key',
            type: 'password',
            placeholder: 'Enter your Claude API key',
            description: 'Your Claude API key is securely stored and used only for this node.'
          },
          {
            id: 'model',
            label: 'Model',
            type: 'text',
            placeholder: 'e.g., claude-3.5-sonnet',
            description: 'The model to use for text generation.'
          },
          {
            id: 'temperature',
            label: 'Temperature',
            type: 'text',
            placeholder: '0.7',
            description: 'Controls randomness. Lower values are more deterministic, higher values more creative.'
          },
          {
            id: 'maxTokens',
            label: 'Max Tokens',
            type: 'text',
            placeholder: '1024',
            description: 'Maximum number of tokens to generate.'
          },
        ];
      case 'internal_new_agent':
        return [
          {
            id: 'agentTemplate',
            label: 'Agent Template',
            type: 'select',
            placeholder: 'Select an agent template',
            description: 'Optional template to use as a base for the new agent.',
            options: [
              { value: 'blank', label: 'Blank Agent' },
              { value: 'customer-support', label: 'Customer Support Agent' },
              { value: 'data-analysis', label: 'Data Analysis Agent' },
              { value: 'content-creation', label: 'Content Creation Agent' }
            ]
          },
          {
            id: 'defaultWorkflow',
            label: 'Default Workflow',
            type: 'select',
            placeholder: 'Create default workflow?',
            description: 'Automatically create a starter workflow for the new agent',
            options: [
              { value: 'none', label: 'No Default Workflow' },
              { value: 'basic-chat', label: 'Basic Chat Workflow' },
              { value: 'data-processing', label: 'Data Processing Workflow' },
              { value: 'custom', label: 'Custom Template' }
            ]
          },
          {
            id: 'autoActivate',
            label: 'Auto-Activate',
            type: 'select',
            placeholder: 'Automatically activate the agent?',
            description: 'Set the agent as active immediately after creation.',
            options: [
              { value: 'true', label: 'Yes - Activate Immediately' },
              { value: 'false', label: 'No - Manual Activation' }
            ]
          },
          {
            id: 'sendWelcomeMessage',
            label: 'Welcome Message',
            type: 'textarea',
            placeholder: 'Enter a welcome message to display when the agent is created...',
            description: 'Optional message to show upon successful agent creation.'
          }
        ];
      case 'internal_ai_chat_agent':
        return [
          {
            id: 'triggerPhrases',
            label: 'Trigger Phrases',
            type: 'textarea',
            placeholder: 'create a new agent, build agent, make an agent...',
            description: 'Comma-separated list of phrases that will trigger this node when detected in chat.'
          },
          {
            id: 'responseTemplate',
            label: 'Response Template',
            type: 'textarea',
            placeholder: 'I\'ll create a new agent called {{name}} for you...',
            description: 'Template for the response when this node is triggered. Use {{variable}} for placeholders.'
          },
          {
            id: 'extractionPrompt',
            label: 'Extraction Prompt',
            type: 'textarea',
            placeholder: 'Extract the name and description for the new agent...',
            description: 'Prompt to extract structured data from the user\'s chat message.'
          }
        ];
      case 'internal_create_agent':
        return [
          {
            id: 'defaultAgentType',
            label: 'Default Agent Type',
            type: 'select',
            placeholder: 'Select default agent type',
            description: 'The type of agent to create if not specified in the input.',
            options: [
              { value: 'custom', label: 'Custom Agent' },
              { value: 'specialized', label: 'Specialized Agent' },
              { value: 'system', label: 'System Agent' }
            ]
          },
          {
            id: 'defaultIcon',
            label: 'Default Icon',
            type: 'text',
            placeholder: 'e.g., brain',
            description: 'Default icon to use if not specified in the input.'
          },
          {
            id: 'notifyOnCreate',
            label: 'Notification',
            type: 'select',
            placeholder: 'Send notification on creation?',
            description: 'Whether to show a notification when the agent is created.',
            options: [
              { value: 'true', label: 'Yes - Show Notification' },
              { value: 'false', label: 'No - Silent Creation' }
            ]
          },
          {
            id: 'logLevel',
            label: 'Logging Level',
            type: 'select',
            placeholder: 'Select logging level',
            description: 'Level of detail for logging agent creation events.',
            options: [
              { value: 'minimal', label: 'Minimal' },
              { value: 'standard', label: 'Standard' },
              { value: 'verbose', label: 'Verbose' }
            ]
          }
        ];
      default:
        // For any other node that starts with "internal_"
        if (type && type.startsWith('internal_')) {
          return [
            {
              id: 'eventType',
              label: 'Event Type',
              type: 'select',
              placeholder: 'Select event type',
              description: 'The type of system event this node responds to.',
              options: [
                { value: 'ui_action', label: 'UI Action' },
                { value: 'system_event', label: 'System Event' },
                { value: 'scheduled', label: 'Scheduled Task' },
                { value: 'manual', label: 'Manual Trigger' }
              ]
            },
            {
              id: 'priority',
              label: 'Priority Level',
              type: 'select',
              placeholder: 'Select priority',
              description: 'Execution priority for this internal operation.',
              options: [
                { value: 'low', label: 'Low' },
                { value: 'medium', label: 'Medium' },
                { value: 'high', label: 'High' },
                { value: 'critical', label: 'Critical' }
              ]
            },
            {
              id: 'customConfig',
              label: 'Custom Configuration',
              type: 'textarea',
              placeholder: 'Enter any custom configuration as JSON...',
              description: 'Additional configuration options in JSON format.'
            }
          ];
        }
        return [];
    }
  };

  if (!node) return null;

  const fields = getFieldsForNodeType(node.type);

  const handleSettingChange = (fieldId: string, value: any) => {
    const updatedSettings = { ...settings, [fieldId]: value };
    setSettings(updatedSettings);
  };

  const handleSave = () => {
    if (node) {
      // Create a copy of the current settings
      const updatedSettings = { ...settings };
      
      // Update the node with all changes (properties and settings)
      onSettingsChange(node.id, {
        ...updatedSettings,
        nodeProperties: {
          label: nodeName,
          description: nodeDescription
        }
      });
      onClose();
    }
  };

  // When Sheet close button is clicked, call onClose
  const handleOpenChange = (open: boolean) => {
    if (!open) onClose();
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="w-[400px] sm:w-[540px] p-0">
        <SheetHeader className="p-6 pb-2">
          <SheetTitle>Node Configuration <span className="text-sm text-muted-foreground">({node.type})</span></SheetTitle>
          <SheetDescription>
            Configure the properties and variables for this node.
          </SheetDescription>
        </SheetHeader>
        
        {/* Tabs */}
        <div className="bg-muted/50 p-1 mx-6 rounded-lg mb-4 flex">
          <button
            className={cn(
              "flex-1 px-3 py-2 text-sm font-medium rounded-md",
              activeTab === 'properties' ? "bg-background border border-border shadow-sm" : "hover:bg-background/50"
            )}
            onClick={() => setActiveTab('properties')}
          >
            Properties
          </button>
          <button
            className={cn(
              "flex-1 px-3 py-2 text-sm font-medium rounded-md",
              activeTab === 'variables' ? "bg-background border border-border shadow-sm" : "hover:bg-background/50"
            )}
            onClick={() => setActiveTab('variables')}
          >
            Variables
          </button>
          <button
            className={cn(
              "flex-1 px-3 py-2 text-sm font-medium rounded-md",
              activeTab === 'settings' ? "bg-background border border-border shadow-sm" : "hover:bg-background/50"
            )}
            onClick={() => setActiveTab('settings')}
          >
            Settings
          </button>
        </div>
        
        <ScrollArea className="px-6 h-[calc(100vh-220px)]">
          {/* Properties Tab */}
          {activeTab === 'properties' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nodeName">Node Name</Label>
                <Input
                  id="nodeName"
                  value={nodeName}
                  onChange={(e) => setNodeName(e.target.value)}
                  placeholder="Enter node name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="nodeDescription">Description</Label>
                <Textarea
                  id="nodeDescription"
                  value={nodeDescription}
                  onChange={(e) => setNodeDescription(e.target.value)}
                  placeholder="Add description to your workflow"
                  className="min-h-[100px]"
                />
              </div>
            </div>
          )}
          
          {/* Variables Tab */}
          {activeTab === 'variables' && (
            <div className="space-y-4">
              <Button className="w-full" variant="outline">
                Add Variable
              </Button>
              
              {/* We'll implement variable handling in the future */}
              {!settings.variables || settings.variables?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No variables defined for this node.
                </div>
              ) : null}
            </div>
          )}
          
          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-4">
              {node.type === 'perplexity' && (
                <div className="mb-4">
                  <p className="text-sm text-muted-foreground">
                    Additional settings specific to this node type.
                  </p>
                  
                  <Alert className="mt-2">
                    <AlertDescription>
                      Configure your Perplexity API settings below. An API key is required for actual API requests. 
                      Without an API key, the node will use simulated responses for testing.
                    </AlertDescription>
                  </Alert>
                </div>
              )}
              
              {(node.type === 'generate_text' || node.type === 'generateText') && (
                <div className="mb-4">
                  <p className="text-sm text-muted-foreground">
                    Configure settings for the Claude AI text generation.
                  </p>
                  
                  <Alert className="mt-2">
                    <AlertDescription>
                      Configure your Claude API settings below. An API key is required for actual AI text generation.
                      Without an API key, the node will use simulated responses for testing purposes.
                    </AlertDescription>
                  </Alert>
                </div>
              )}
              
              {node.type === 'internal_new_agent' && (
                <div className="mb-4">
                  <p className="text-sm text-muted-foreground">
                    Configure settings for the New Agent Trigger node.
                  </p>
                  
                  <Alert className="mt-2">
                    <AlertDescription>
                      This node triggers when a user clicks the "New Agent" button in the UI. 
                      Configure the template settings and default behavior when creating new agents.
                    </AlertDescription>
                  </Alert>
                </div>
              )}
              
              {node.type === 'internal_ai_chat_agent' && (
                <div className="mb-4">
                  <p className="text-sm text-muted-foreground">
                    Configure settings for the AI Chat Agent Trigger node.
                  </p>
                  
                  <Alert className="mt-2">
                    <AlertDescription>
                      This node triggers when a user asks the chat agent to create a new agent.
                      Configure trigger phrases and response templates to customize how the agent responds.
                    </AlertDescription>
                  </Alert>
                </div>
              )}
              
              {node.type === 'internal_create_agent' && (
                <div className="mb-4">
                  <p className="text-sm text-muted-foreground">
                    Configure settings for the Create Agent Action node.
                  </p>
                  
                  <Alert className="mt-2">
                    <AlertDescription>
                      This node creates a new agent in the system with the specified properties.
                      Configure default settings and notification preferences for agent creation.
                    </AlertDescription>
                  </Alert>
                </div>
              )}
              
              {node.type && node.type.startsWith('internal_') && 
               node.type !== 'internal_new_agent' && 
               node.type !== 'internal_ai_chat_agent' && 
               node.type !== 'internal_create_agent' && (
                <div className="mb-4">
                  <p className="text-sm text-muted-foreground">
                    Configure settings for this Internal System node.
                  </p>
                  
                  <Alert className="mt-2">
                    <AlertDescription>
                      Internal nodes connect directly to system functions and events.
                      Configure how this node interacts with internal system components.
                    </AlertDescription>
                  </Alert>
                </div>
              )}
              
              {fields.length > 0 ? (
                <div className="space-y-4 pb-6">
                  {fields.map((field) => (
                    <div key={field.id} className="space-y-2">
                      <Label htmlFor={field.id}>{field.label}</Label>
                      
                      {field.type === 'password' ? (
                        <Input
                          id={field.id}
                          type="password"
                          placeholder={field.placeholder}
                          value={settings[field.id] || ''}
                          onChange={(e) => handleSettingChange(field.id, e.target.value)}
                        />
                      ) : field.type === 'select' && field.options ? (
                        <Select 
                          value={settings[field.id] || ''} 
                          onValueChange={(value) => handleSettingChange(field.id, value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select an option" />
                          </SelectTrigger>
                          <SelectContent>
                            {field.options.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : field.type === 'textarea' ? (
                        <Textarea
                          id={field.id}
                          placeholder={field.placeholder}
                          value={settings[field.id] || ''}
                          onChange={(e) => handleSettingChange(field.id, e.target.value)}
                          className="min-h-[100px]"
                        />
                      ) : (
                        <div>
                          <Input
                            id={field.id}
                            type="text"
                            placeholder={field.placeholder}
                            value={settings[field.id] || ''}
                            onChange={(e) => handleSettingChange(field.id, e.target.value)}
                          />
                          {field.id === 'model' && node.type === 'perplexity' && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Common models: sonar, sonar-small-online, sonar-medium-online, mistral-7b-instruct
                            </p>
                          )}
                          {field.id === 'model' && (node.type === 'generate_text' || node.type === 'generateText') && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Claude models: claude-3.5-sonnet, claude-3-opus, claude-3-sonnet, claude-3-haiku
                            </p>
                          )}
                        </div>
                      )}
                      
                      {/* Show description if available */}
                      {field.description && (
                        <p className="text-xs text-muted-foreground">
                          {field.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No settings available for this node type.
                </div>
              )}
            </div>
          )}
        </ScrollArea>
        
        <SheetFooter className="px-6 py-4 border-t">
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-2" /> Cancel
          </Button>
          <Button onClick={handleSave} className="bg-primary text-primary-foreground">
            <Save className="h-4 w-4 mr-2" /> Save Changes
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default NodeSettingsDrawer;
import React from 'react';
import { Drawer } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Node } from 'reactflow';
import { NodeData } from './NodeItem';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface NodeSettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  node: Node<NodeData> | null;
  onSettingsChange: (nodeId: string, settings: Record<string, any>) => void;
}

interface SettingsField {
  id: string;
  label: string;
  type: 'text' | 'password' | 'select' | 'textarea';
  placeholder?: string;
  options?: { value: string; label: string }[];
}

const NodeSettingsDrawer: React.FC<NodeSettingsDrawerProps> = ({
  isOpen,
  onClose,
  node,
  onSettingsChange,
}) => {
  const [settings, setSettings] = React.useState<Record<string, any>>({});

  // Reset settings when node changes
  React.useEffect(() => {
    if (node && node.data) {
      // Initialize with current settings or defaults
      setSettings(node.data.settings || {});
    } else {
      setSettings({});
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
          },
          {
            id: 'model',
            label: 'Model',
            type: 'select',
            options: [
              { value: 'sonar', label: 'Sonar' },
              { value: 'sonar-small-online', label: 'Sonar Small Online' },
              { value: 'sonar-medium-online', label: 'Sonar Medium Online' },
              { value: 'mistral-7b-instruct', label: 'Mistral 7B Instruct' },
            ],
          },
        ];
      default:
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
      onSettingsChange(node.id, settings);
      onClose();
    }
  };

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <div className="mx-auto w-full max-w-sm">
        <div className="p-4 pb-0">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">{node?.data?.label || 'Node'} Settings</h3>
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
        <ScrollArea className="h-[400px] p-4">
          {node.type === 'perplexity' && (
            <Alert className="mb-4">
              <AlertDescription>
                Configure your Perplexity API settings below. An API key is required for actual API requests. 
                Without an API key, the node will use simulated responses for testing.
              </AlertDescription>
            </Alert>
          )}
          
          {fields.length > 0 ? (
            <div className="space-y-4">
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
                    <Input
                      id={field.id}
                      type="text"
                      placeholder={field.placeholder}
                      value={settings[field.id] || ''}
                      onChange={(e) => handleSettingChange(field.id, e.target.value)}
                    />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No settings available for this node type.
            </div>
          )}
        </ScrollArea>
        <div className="p-4 flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Settings</Button>
        </div>
      </div>
    </Drawer>
  );
};

export default NodeSettingsDrawer;
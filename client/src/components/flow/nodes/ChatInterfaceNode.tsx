import { useState } from 'react';
import { Handle, Position } from 'reactflow';
import { cn } from '@/lib/utils';
import { MessagesSquare, Settings } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'agent' | 'system';
  timestamp: Date;
}

export interface ChatInterfaceNodeProps {
  data: {
    label?: string;
    description?: string;
    messages?: ChatMessage[];
    isProcessing?: boolean;
    isComplete?: boolean;
    hasError?: boolean;
    errorMessage?: string;
    onSettingsClick?: () => void;
    settings?: {
      welcomeMessage?: string;
      userPrompt?: string;
    };
  };
  isConnectable?: boolean;
  selected?: boolean;
}

const ChatInterfaceNode = ({ data, isConnectable = true, selected }: ChatInterfaceNodeProps) => {
  const [inputValue, setInputValue] = useState('');
  const messages = data.messages || [];
  const welcomeMessage = data.settings?.welcomeMessage || 'How can I help you today?';
  
  const getStatusBadge = () => {
    if (data.hasError) {
      return <Badge variant="destructive" className="ml-2">Error</Badge>;
    }
    if (data.isComplete) {
      return <Badge variant="outline" className="bg-green-500 text-white ml-2">Complete</Badge>;
    }
    if (data.isProcessing) {
      return <Badge variant="outline" className="bg-blue-500 text-white ml-2">Processing</Badge>;
    }
    return null;
  };
  
  return (
    <div className={cn(
      'chat-interface-node relative p-0 rounded-md min-w-[300px] max-w-[400px] bg-background border transition-all shadow-md',
      selected ? 'border-primary ring-2 ring-primary ring-opacity-20' : 'border-border'
    )}>
      {/* Header */}
      <div className="p-3 border-b flex items-center justify-between">
        <div className="font-medium text-sm flex items-center">
          <MessagesSquare className="h-4 w-4 mr-2 text-green-500" />
          <span>{data.label || 'Chat Interface'}</span>
          {getStatusBadge()}
        </div>
        {data.onSettingsClick && (
          <button 
            onClick={data.onSettingsClick}
            className="ml-auto hover:bg-muted p-1 rounded-sm"
          >
            <Settings className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
      </div>
      
      {/* Body */}
      <div className="p-3 space-y-3">
        {data.description && (
          <p className="text-sm text-muted-foreground">{data.description}</p>
        )}
        
        <div className="border rounded-md bg-muted/30">
          <ScrollArea className="h-[200px] p-3">
            {/* Welcome message */}
            {messages.length === 0 && (
              <div className="flex flex-col space-y-2">
                <div className="bg-muted p-2 rounded-md text-sm self-start max-w-[80%]">
                  {welcomeMessage}
                </div>
              </div>
            )}
            
            {/* Chat messages */}
            {messages.length > 0 && (
              <div className="flex flex-col space-y-2">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "p-2 rounded-md text-sm",
                      message.role === 'user' ? "bg-primary/10 self-end max-w-[80%]" : "bg-muted self-start max-w-[80%]"
                    )}
                  >
                    {message.content}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
          
          <Separator />
          
          <div className="p-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type your message..."
              className="text-sm"
            />
          </div>
        </div>
        
        {data.errorMessage && (
          <div className="mt-2 text-xs text-red-500 bg-red-50 p-2 rounded">
            {data.errorMessage}
          </div>
        )}
      </div>
      
      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        className="w-3 h-3 left-[-6px] bg-green-500 border-2 border-background"
        isConnectable={isConnectable}
      />
      
      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        className="w-3 h-3 right-[-6px] bg-green-500 border-2 border-background"
        isConnectable={isConnectable}
      />
    </div>
  );
};

export default ChatInterfaceNode;
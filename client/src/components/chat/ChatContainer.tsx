/**
 * Chat Container Component
 * 
 * This component renders a chat interface with messages and input.
 */
import { useState, useRef, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Send, X, Minimize2, Maximize2 } from 'lucide-react';

// Message interface (should match the one in ChatContext)
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

// Chat Message Component
interface ChatMessageProps {
  message: ChatMessage;
}

export function ChatMessageItem({ message }: ChatMessageProps) {
  // Format timestamp for display
  const formatTimestamp = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: 'numeric',
    }).format(date);
  };

  // Different styling based on message role
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';
  
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`flex ${isUser ? 'flex-row-reverse' : 'flex-row'} max-w-[80%] gap-2`}>
        {/* Message content */}
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
          <div className={`
            px-4 py-2 rounded-lg 
            ${isUser 
              ? 'bg-primary text-primary-foreground' 
              : isSystem 
                ? 'bg-muted text-muted-foreground' 
                : 'bg-card border border-border'
            }
          `}>
            {typeof message.content === 'object' 
              ? JSON.stringify(message.content, null, 2) 
              : message.content}
          </div>
          
          {/* Timestamp */}
          <div className="text-xs text-muted-foreground mt-1">
            {formatTimestamp(message.timestamp)}
          </div>
        </div>
      </div>
    </div>
  );
}

// Chat Container props
export interface ChatContainerProps {
  title?: string;
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  placeholder?: string;
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
  className?: string;
  isLoading?: boolean;
}

export function ChatContainer({
  title = 'Chat with Agent',
  messages,
  onSendMessage,
  placeholder = 'Type a message...',
  isMinimized = false,
  onToggleMinimize,
  className = '',
  isLoading = false,
}: ChatContainerProps) {
  const [inputValue, setInputValue] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  // Handle sending a message
  const handleSendMessage = () => {
    if (inputValue.trim() === '' || isLoading) return;
    
    onSendMessage(inputValue);
    setInputValue('');
  };

  // Handle enter key press
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Card className={`flex flex-col overflow-hidden ${className}`}>
      {/* Chat header */}
      <div className="flex items-center justify-between border-b p-3">
        <div className="font-medium">{title}</div>
        <div className="flex gap-1">
          {onToggleMinimize && (
            <Button variant="ghost" size="icon" onClick={onToggleMinimize}>
              {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={onToggleMinimize}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Chat content */}
      {!isMinimized && (
        <>
          {/* Messages area */}
          <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
            <div className="flex flex-col">
              {messages.map((message) => (
                <ChatMessageItem key={message.id} message={message} />
              ))}
              
              {/* Loading indicator */}
              {isLoading && (
                <div className="flex justify-start mb-4">
                  <div className="flex items-center space-x-2 bg-muted text-muted-foreground px-4 py-2 rounded-lg">
                    <div className="flex space-x-1">
                      <span className="animate-bounce h-2 w-2 bg-current rounded-full" style={{ animationDelay: '0ms' }}></span>
                      <span className="animate-bounce h-2 w-2 bg-current rounded-full" style={{ animationDelay: '100ms' }}></span>
                      <span className="animate-bounce h-2 w-2 bg-current rounded-full" style={{ animationDelay: '200ms' }}></span>
                    </div>
                    <span className="text-sm">Agent is thinking...</span>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
          
          {/* Input area */}
          <div className="border-t p-3">
            <div className="flex gap-2">
              <Textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isLoading ? "Waiting for response..." : placeholder}
                className="min-h-[40px] max-h-[120px]"
                rows={1}
                disabled={isLoading}
              />
              <Button 
                onClick={handleSendMessage} 
                size="icon" 
                disabled={isLoading || inputValue.trim() === ''}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </Card>
  );
}
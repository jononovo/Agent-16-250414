/**
 * Chat Sidebar Component
 * 
 * This component renders a sidebar with chat messages and an input form
 * for interacting with the natural language agent.
 */
import { useState, useRef, useEffect } from 'react';
import { useChat, ChatMessage } from './ChatContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Trash2, Loader2 } from 'lucide-react';

interface ChatSidebarProps {
  isOpen: boolean;
}

export const ChatSidebar = ({ isOpen }: ChatSidebarProps) => {
  const { messages, sendMessage, isLoading, clearMessages } = useChat();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Focus input when sidebar is opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);
  
  // Format timestamps
  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: 'numeric',
    }).format(date);
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    await sendMessage(input);
    setInput('');
  };
  
  // Handle key press (Ctrl+Enter to submit)
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSubmit(e);
    }
  };
  
  // Resize the Textarea as the user types
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 150)}px`;
  };
  
  // Render each message
  const renderMessage = (message: ChatMessage) => {
    const isUser = message.role === 'user';
    
    return (
      <div 
        key={message.id} 
        className={`mb-4 ${isUser ? 'ml-auto max-w-[80%]' : 'mr-auto max-w-[85%]'}`}
      >
        <div className={`p-3 rounded-lg ${
          isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'
        }`}>
          {message.content}
        </div>
        <div className={`text-xs text-muted-foreground mt-1 ${
          isUser ? 'text-right' : 'text-left'
        }`}>
          {formatTime(message.timestamp)}
        </div>
      </div>
    );
  };
  
  return (
    <aside 
      className={`fixed right-0 top-0 h-full bg-background border-l border-border
        w-[350px] flex flex-col transition-transform duration-300 ease-in-out z-50
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
    >
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="text-lg font-medium">AI Assistant</h2>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={clearMessages}
          title="Clear conversation"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      
      <ScrollArea className="flex-1 p-4">
        <div className="flex flex-col">
          {messages.map(renderMessage)}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
      
      <Separator />
      
      <form onSubmit={handleSubmit} className="p-4">
        <div className="flex flex-col gap-2">
          <Textarea
            ref={inputRef}
            value={input}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyPress}
            placeholder="Ask the AI assistant..."
            className="min-h-[60px] resize-none"
            disabled={isLoading}
          />
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">
              Press Ctrl+Enter to send
            </span>
            <Button 
              type="submit" 
              size="sm" 
              disabled={isLoading || !input.trim()}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Send
            </Button>
          </div>
        </div>
      </form>
    </aside>
  );
};
/**
 * COMPLETE CHAT SYSTEM IMPLEMENTATION
 * 
 * This file contains all the components needed to implement the chat system.
 * It includes:
 * 1. ChatContext - For state management
 * 2. ChatContainer - Main chat UI component
 * 3. ChatMessage - Individual message component
 * 4. ChatSidebar - Chat sidebar component 
 * 5. ChatToggle - Toggle button for chat
 * 6. PromptInput - Initial prompt input
 * 
 * Implementation Notes:
 * - Replace setTimeout with actual API calls when connecting to a database
 * - Add proper authentication and user identification
 * - Implement WebSockets for real-time updates
 */

import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { MessageSquare, Send, X, Minimize2, Maximize2 } from 'lucide-react';
import { format } from 'date-fns';

/**************************************
 * 1. CHAT CONTEXT - STATE MANAGEMENT
 **************************************/

// Message interface
export interface Message {
  id: string;
  role: 'user' | 'system' | 'agent';
  content: string;
  timestamp: Date;
}

// Chat context interface
interface ChatContextType {
  messages: Message[];
  addMessage: (content: string, role: 'user' | 'system' | 'agent') => void;
  resetChat: () => void;
  isChatOpen: boolean;
  toggleChat: () => void;
}

// Initial welcome message
const initialMessage: Message = {
  id: 'welcome',
  role: 'system',
  content: 'Hello! How can I help you build your workflow today?',
  timestamp: new Date()
};

// Create context with default values
const ChatContext = createContext<ChatContextType>({
  messages: [initialMessage],
  addMessage: () => {},
  resetChat: () => {},
  isChatOpen: false,
  toggleChat: () => {}
});

// Chat provider component
export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<Message[]>([initialMessage]);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Add a new message to the chat
  const addMessage = (content: string, role: 'user' | 'system' | 'agent') => {
    const newMessage: Message = {
      id: Date.now().toString(),
      role,
      content,
      timestamp: new Date()
    };
    
    setMessages((prevMessages) => [...prevMessages, newMessage]);
    
    // If this is a database implementation, add API call here:
    // await fetch('/api/messages', {
    //   method: 'POST',
    //   body: JSON.stringify(newMessage)
    // });
  };

  // Reset the chat to initial state
  const resetChat = () => {
    setMessages([initialMessage]);
    
    // If this is a database implementation, add API call here:
    // await fetch('/api/conversations', {
    //   method: 'POST',
    //   body: JSON.stringify({ reset: true })
    // });
  };

  // Toggle chat visibility
  const toggleChat = () => {
    setIsChatOpen((prev) => !prev);
  };

  // Context value
  const contextValue: ChatContextType = {
    messages,
    addMessage,
    resetChat,
    isChatOpen,
    toggleChat
  };

  return (
    <ChatContext.Provider value={contextValue}>
      {children}
    </ChatContext.Provider>
  );
};

// Custom hook to use chat context
export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

/**************************************
 * 2. CHAT MESSAGE - INDIVIDUAL MESSAGE
 **************************************/

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  // Format timestamp for display
  const formatTimestamp = (date: Date) => {
    return format(date, 'h:mm a');
  };

  // Different styling based on message role
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';
  
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`flex ${isUser ? 'flex-row-reverse' : 'flex-row'} max-w-[80%] gap-2`}>
        {/* Avatar - only for non-user messages */}
        {!isUser && (
          <Avatar className="h-8 w-8 mt-1">
            {message.role === 'agent' && (
              <div className="flex h-full w-full items-center justify-center bg-primary text-primary-foreground">
                A
              </div>
            )}
            {isSystem && (
              <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground">
                S
              </div>
            )}
          </Avatar>
        )}
        
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
            {message.content}
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

/**************************************
 * 3. CHAT CONTAINER - MAIN CHAT UI
 **************************************/

export interface ChatContainerProps {
  title?: string;
  messages: Message[];
  onSendMessage: (message: string) => void;
  placeholder?: string;
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
  className?: string;
}

export function ChatContainer({
  title = 'Agent Chat',
  messages,
  onSendMessage,
  placeholder = 'Type a message...',
  isMinimized = false,
  onToggleMinimize,
  className = '',
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
    if (inputValue.trim() === '') return;
    
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
          <Button variant="ghost" size="icon" onClick={() => {}}>
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
                <ChatMessage key={message.id} message={message} />
              ))}
            </div>
          </ScrollArea>
          
          {/* Input area */}
          <div className="border-t p-3">
            <div className="flex gap-2">
              <Textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className="min-h-[40px] max-h-[120px]"
                rows={1}
              />
              <Button onClick={handleSendMessage} size="icon">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </Card>
  );
}

/**************************************
 * 4. CHAT SIDEBAR - COLLAPSIBLE CONTAINER
 **************************************/

interface ChatSidebarProps {
  className?: string;
}

export function ChatSidebar({ className = '' }: ChatSidebarProps) {
  const { messages, addMessage, isChatOpen, toggleChat } = useChat();
  const isMobile = useIsMobile();
  
  // Sample responses for demo purposes - replace with actual API calls
  const responses = [
    "I understand what you're trying to build. Let me help you set that up.",
    "That's an interesting approach. Here's how we could implement it.",
    "I need a bit more information to help you with that. Could you explain what you're trying to accomplish?",
    "I've created that component for you. Let's test it to make sure it works as expected.",
    "I'm searching for the best way to implement this. Give me a moment..."
  ];

  // Handle sending a message
  const handleSendMessage = (content: string) => {
    // Add user message
    addMessage(content, 'user');
    
    // For database implementation, replace this with API call
    setTimeout(() => {
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      addMessage(randomResponse, 'agent');
    }, 1000);
  };

  if (!isChatOpen) return null;

  return (
    <div
      className={`fixed ${
        isMobile ? 'bottom-0 left-0 right-0 z-50' : 'bottom-6 right-6 z-50'
      } ${className}`}
    >
      <ChatContainer
        messages={messages}
        onSendMessage={handleSendMessage}
        className={`${isMobile ? 'h-[60vh]' : 'w-[400px] h-[600px]'}`}
        onToggleMinimize={toggleChat}
      />
    </div>
  );
}

/**************************************
 * 5. CHAT TOGGLE - TOGGLE BUTTON
 **************************************/

interface ChatToggleProps {
  className?: string;
}

export function ChatToggle({ className = '' }: ChatToggleProps) {
  const { isChatOpen, toggleChat } = useChat();
  const isMobile = useIsMobile();

  if (isChatOpen) return null;

  return (
    <div className={`fixed ${isMobile ? 'bottom-4 right-4' : 'bottom-6 right-6'} z-50 ${className}`}>
      <Button
        onClick={toggleChat}
        className="h-12 w-12 rounded-full shadow-lg"
      >
        <MessageSquare className="h-6 w-6" />
      </Button>
    </div>
  );
}

/**************************************
 * 6. PROMPT INPUT - INITIAL INPUT
 **************************************/

export default function PromptInput() {
  const [prompt, setPrompt] = useState('');
  const { addMessage, toggleChat } = useChat();

  // Handle prompt submission
  const handleSubmit = () => {
    if (prompt.trim() === '') return;
    
    // Store prompt before clearing
    const userText = prompt;
    setPrompt('');
    
    // Add user message to chat
    addMessage(userText, 'user');
    
    // For database implementation, replace with API call
    setTimeout(() => {
      // Sample agent response - replace with actual API response
      addMessage("I'll help you build this workflow. Let me gather some details...", 'agent');
      
      // Open chat sidebar
      toggleChat();
    }, 1000);
  };

  return (
    <div className="w-full my-8">
      <div className="max-w-3xl mx-auto px-4">
        <div className="flex flex-col items-center">
          <h1 className="text-2xl font-bold mb-6 text-center">What would you like to build today?</h1>
          
          <div className="flex w-full max-w-2xl gap-2">
            <Input
              className="flex-1"
              placeholder="Enter a prompt to start building..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
            <Button onClick={handleSubmit}>Build</Button>
          </div>
          
          <p className="text-sm text-muted-foreground mt-4 text-center">
            Describe the workflow you want to create, and our agent will help you build it step by step.
          </p>
        </div>
      </div>
    </div>
  );
}

/**************************************
 * 7. MOBILE DETECTION HOOK
 **************************************/

// Create a hook to detect mobile screens
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Initial check
    checkMobile();
    
    // Add listener for window resize
    window.addEventListener('resize', checkMobile);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  return isMobile;
}

/**************************************
 * 8. DATABASE INTEGRATION EXAMPLE
 **************************************/

// Example of how to modify the ChatContext to use a database
// Replace the existing implementation with this when ready

/*
export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [conversationId, setConversationId] = useState<string | null>(null);

  // Fetch messages on initial load
  useEffect(() => {
    const fetchInitialMessages = async () => {
      try {
        // Get or create conversation
        const convoResponse = await fetch('/api/conversations');
        const { id, messages: initialMessages } = await convoResponse.json();
        
        setConversationId(id);
        setMessages(initialMessages || [initialMessage]);
      } catch (error) {
        console.error('Failed to fetch messages:', error);
        // Fallback to initial message
        setMessages([initialMessage]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchInitialMessages();
  }, []);

  // Add a message to the database and local state
  const addMessage = async (content: string, role: 'user' | 'system' | 'agent') => {
    // Create optimistic message
    const optimisticMsg: Message = {
      id: `temp-${Date.now()}`,
      role,
      content,
      timestamp: new Date()
    };
    
    // Update UI immediately
    setMessages(prev => [...prev, optimisticMsg]);
    
    try {
      // Send to server
      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content, role })
      });
      
      if (!response.ok) throw new Error('Failed to save message');
      
      const savedMsg = await response.json();
      
      // Replace optimistic message with saved one
      setMessages(prev => 
        prev.map(msg => (msg.id === optimisticMsg.id ? savedMsg : msg))
      );
    } catch (error) {
      console.error('Failed to save message:', error);
      // Could add error state to the message here
    }
  };

  // Reset the conversation
  const resetChat = async () => {
    try {
      // Create new conversation
      const response = await fetch('/api/conversations', {
        method: 'POST'
      });
      
      const { id } = await response.json();
      setConversationId(id);
      setMessages([initialMessage]);
    } catch (error) {
      console.error('Failed to reset chat:', error);
      // Fallback
      setMessages([initialMessage]);
    }
  };

  // Context value
  const contextValue: ChatContextType = {
    messages,
    addMessage,
    resetChat,
    isChatOpen,
    toggleChat: () => setIsChatOpen(prev => !prev),
    isLoading
  };

  return (
    <ChatContext.Provider value={contextValue}>
      {children}
    </ChatContext.Provider>
  );
};
*/

/**************************************
 * 9. APP INTEGRATION EXAMPLE
 **************************************/

/*
// Add this to your App.tsx
import { ChatProvider } from './contexts/ChatContext';
import { ChatSidebar } from './components/chat/ChatSidebar';
import { ChatToggle } from './components/chat/ChatToggle';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BuilderProvider>
        <ChatProvider>
          <Router />
          <Toaster />
          {/* Global chat components */}
          <ChatSidebar />
          <ChatToggle />
        </ChatProvider>
      </BuilderProvider>
    </QueryClientProvider>
  );
}
*/

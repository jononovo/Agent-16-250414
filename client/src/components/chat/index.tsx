import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { MessageSquare, Send, X, Minimize2, Maximize2 } from 'lucide-react';
import { format } from 'date-fns';
import { apiClient } from '@/lib/apiClient';

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
  };

  // Reset the chat to initial state
  const resetChat = () => {
    setMessages([initialMessage]);
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
  isLoading?: boolean;
}

export function ChatContainer({
  title = 'Agent Chat',
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
                <ChatMessage key={message.id} message={message} />
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

/**************************************
 * 4. CHAT SIDEBAR - COLLAPSIBLE CONTAINER
 **************************************/

interface ChatSidebarProps {
  className?: string;
}

export function ChatSidebar({ className = '' }: ChatSidebarProps) {
  const { messages, addMessage, isChatOpen, toggleChat } = useChat();
  const isMobile = useIsMobile();
  const [isLoading, setIsLoading] = useState(false);
  
  // Handle sending a message
  const handleSendMessage = async (content: string) => {
    // Add user message
    addMessage(content, 'user');
    
    // Set loading state
    setIsLoading(true);
    
    try {
      // Send the message to the updated chat UI endpoint using apiClient
      const data = await apiClient.post('/api/user-chat-ui-main', { prompt: content });
      
      // Add the agent's response to the chat
      if (data.success) {
        // First, show the simple chat (generator) result immediately for a quick response
        if (data.generatorResult?.output) {
          const generatorOutput = data.generatorResult.output;
          
          // Handle the generator output based on its type
          if (typeof generatorOutput === 'string') {
            // Check if it's HTML content
            if (generatorOutput.trim().startsWith('<!DOCTYPE html>') || 
               generatorOutput.trim().startsWith('<html')) {
              // Skip HTML content
            } 
            // Check if it's a JSON string
            else if (generatorOutput.trim().startsWith('{') && 
                generatorOutput.trim().endsWith('}')) {
              try {
                // Parse the JSON string into an object
                const jsonData = JSON.parse(generatorOutput);
                
                // Check for success message patterns in structured data
                if (jsonData.result?.settings?.successMessage) {
                  addMessage(jsonData.result.settings.successMessage, 'agent');
                } else if (jsonData.message) {
                  addMessage(jsonData.message, 'agent');
                } else if (jsonData.text) {
                  addMessage(jsonData.text, 'agent');
                } else if (jsonData.result?.message) {
                  addMessage(jsonData.result.message, 'agent');
                } else {
                  // Regular content
                  addMessage("Operation completed successfully", 'agent');
                }
              } catch (error) {
                // If parsing fails, just display the string
                console.error("Error parsing JSON response:", error);
                addMessage(generatorOutput, 'agent');
              }
            } else {
              // Regular string content
              addMessage(generatorOutput, 'agent');
            }
          } else if (typeof generatorOutput === 'object') {
            // Extract structured content from the object
            const message = generatorOutput.result?.settings?.successMessage ||
                           generatorOutput.settings?.successMessage ||
                           generatorOutput.message || 
                           generatorOutput.text || 
                           "Operation completed successfully";
            addMessage(message, 'agent');
          }
        }
        
        // Then show the coordinator result if it's available
        const coordinatorOutput = data.coordinatorResult?.output;
        const formattedMessage = data.coordinatorResult?.formattedMessage;
        
        // Check if we have coordinator content to display that's not HTML
        if ((coordinatorOutput || formattedMessage) && 
            (typeof coordinatorOutput !== 'string' || 
             (!coordinatorOutput.includes('<!DOCTYPE html>') && 
              !coordinatorOutput.trim().startsWith('<html')))) {
          
          // Add a typing indicator before showing the coordinator response
          setTimeout(() => {
            addMessage(
              "Based on your request, I have some additional insights or specialized capabilities to offer.",
              'system'
            );
            
            // Then show the actual coordinator response - prioritize formatted message if available
            setTimeout(() => {
              if (formattedMessage) {
                addMessage(formattedMessage, 'agent');
              } else if (typeof coordinatorOutput === 'string') {
                // Check if it's a JSON string
                if (coordinatorOutput.trim().startsWith('{') && 
                    coordinatorOutput.trim().endsWith('}')) {
                  try {
                    // Parse the JSON string into an object
                    const jsonData = JSON.parse(coordinatorOutput);
                    
                    // Check for success message patterns in structured data
                    if (jsonData.result?.settings?.successMessage) {
                      addMessage(jsonData.result.settings.successMessage, 'agent');
                    } else if (jsonData.message) {
                      addMessage(jsonData.message, 'agent');
                    } else if (jsonData.text) {
                      addMessage(jsonData.text, 'agent');
                    } else if (jsonData.result?.message) {
                      addMessage(jsonData.result.message, 'agent');
                    } else {
                      // Handle cases where we can't extract a specific message
                      addMessage("Operation completed successfully", 'agent');
                    }
                  } catch (error) {
                    // If parsing fails, just display the string
                    console.error("Error parsing JSON response:", error);
                    addMessage(coordinatorOutput, 'agent');
                  }
                } else {
                  // It's a regular string, so display it
                  addMessage(coordinatorOutput, 'agent');
                }
              } else if (coordinatorOutput && typeof coordinatorOutput === 'object') {
                // Extract the most appropriate message from the object
                const message = coordinatorOutput.result?.settings?.successMessage ||
                               coordinatorOutput.settings?.successMessage ||
                               coordinatorOutput.message || 
                               coordinatorOutput.text || 
                               "Operation completed successfully";
                addMessage(message, 'agent');
              }
            }, 1000);
          }, 2000);
        }
      } else {
        // If there's an error, add it to the chat
        addMessage(`Sorry, I encountered an error: ${data.message || 'Unknown error'}`, 'system');
      }
    } catch (error) {
      console.error('Error sending message to agent chain:', error);
      addMessage(`Sorry, I encountered an error while processing your request. Please try again.`, 'system');
    } finally {
      setIsLoading(false);
    }
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
        isLoading={isLoading}
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
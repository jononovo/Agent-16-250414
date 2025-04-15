/**
 * Chat Context Provider
 * 
 * This component manages the chat state and provides methods for interacting
 * with the natural language agent.
 */
import { 
  createContext, 
  useContext, 
  useState, 
  useEffect, 
  ReactNode 
} from 'react';

// Define message types
export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  timestamp: Date;
}

// Context interface
interface ChatContextType {
  messages: ChatMessage[];
  sendMessage: (content: string) => Promise<void>;
  isLoading: boolean;
  clearMessages: () => void;
}

// Create the context
const ChatContext = createContext<ChatContextType | undefined>(undefined);

// Hook for using the chat context
export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

// Props for the provider
interface ChatProviderProps {
  children: ReactNode;
}

// Generate a random ID for messages
const generateId = () => `msg_${Math.random().toString(36).substring(2, 9)}`;

export const ChatProvider = ({ children }: ChatProviderProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize with welcome message
  useEffect(() => {
    const welcomeMessage: ChatMessage = {
      id: generateId(),
      content: "Hello! I'm your AI assistant. How can I help you with your workflow today?",
      role: 'assistant',
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
  }, []);

  // Send a message to the agent
  const sendMessage = async (content: string) => {
    try {
      // Generate a session ID if not exists
      if (!sessionStorage.getItem('chatSessionId')) {
        sessionStorage.setItem('chatSessionId', `session_${Math.random().toString(36).substring(2, 9)}`);
      }
      
      // Add user message to state
      const userMessage: ChatMessage = {
        id: generateId(),
        content,
        role: 'user',
        timestamp: new Date(),
      };
      
      setMessages(prevMessages => [...prevMessages, userMessage]);
      setIsLoading(true);
      
      // Call the agent API with our natural language agent
      const response = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: content,
          context: 'general', // Provide context to get relevant tools
          sessionId: sessionStorage.getItem('chatSessionId') || 'default-session',
          // Optional parameters
          // agentId: 1, // If you want to use a specific agent
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to get response from agent');
      }
      
      const data = await response.json();
      
      // Add assistant message to state
      const assistantMessage: ChatMessage = {
        id: generateId(),
        content: data.response || 'I processed your request but have no specific response.',
        role: 'assistant',
        timestamp: new Date(),
      };
      
      // If there's tool execution info, add it to the message content
      if (data.toolName && data.toolResult) {
        console.log(`Tool executed: ${data.toolName}`, data.toolResult);
        
        // If the tool execution failed, show an error message
        if (data.toolResult.success === false) {
          const errorMessage: ChatMessage = {
            id: generateId(),
            content: `I tried to use the ${data.toolName} tool, but encountered an error: ${data.toolResult.error || 'Unknown error'}`,
            role: 'system',
            timestamp: new Date(),
          };
          setMessages(prevMessages => [...prevMessages, errorMessage]);
        }
      }
      
      setMessages(prevMessages => [...prevMessages, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Add error message
      const errorMessage: ChatMessage = {
        id: generateId(),
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        role: 'assistant',
        timestamp: new Date(),
      };
      
      setMessages(prevMessages => [...prevMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Clear all messages
  const clearMessages = () => {
    const welcomeMessage: ChatMessage = {
      id: generateId(),
      content: "Hello! I'm your AI assistant. How can I help you with your workflow today?",
      role: 'assistant',
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
  };

  return (
    <ChatContext.Provider value={{ 
      messages, 
      sendMessage, 
      isLoading, 
      clearMessages 
    }}>
      {children}
    </ChatContext.Provider>
  );
};
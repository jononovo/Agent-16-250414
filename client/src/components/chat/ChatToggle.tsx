/**
 * Chat Toggle Component
 * 
 * This component renders a button that toggles the chat sidebar visibility.
 */
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';
import { ChatSidebar } from './ChatSidebar';

export const ChatToggle = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  const toggleChat = () => {
    setIsChatOpen(prev => !prev);
  };
  
  return (
    <>
      <Button
        variant="outline"
        size="icon"
        className="fixed bottom-4 right-4 rounded-full h-12 w-12 shadow-lg z-50"
        onClick={toggleChat}
        title="Toggle AI Assistant"
      >
        <MessageSquare className="h-5 w-5" />
      </Button>
      
      <ChatSidebar isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </>
  );
};
/**
 * Chat Toggle Component
 * 
 * This component renders a button that toggles the chat sidebar visibility.
 * It only shows on certain pages, not on workflow editor pages.
 */
import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';
import { ChatSidebar } from './ChatSidebar';

export const ChatToggle = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [location] = useLocation();
  
  const toggleChat = () => {
    setIsChatOpen(prev => !prev);
  };
  
  // Check if current page is a workflow editor page
  const isWorkflowEditorPage = 
    location.startsWith('/workflow-editor') || 
    location.includes('/workflow-test');
  
  // Don't render chat on workflow editor pages
  if (isWorkflowEditorPage) {
    return null;
  }
  
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
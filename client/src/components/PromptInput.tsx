import { useState } from 'react';
import { useChat } from '@/components/chat';
import { Button } from '@/components/ui/button';

const PromptInput = () => {
  const [prompt, setPrompt] = useState('');
  const { addMessage, toggleChat } = useChat();

  const handleSubmit = () => {
    if (prompt.trim() === '') return;
    
    // Store prompt before clearing
    const userText = prompt;
    
    // Log the prompt (can be removed in production)
    console.log('Submitting prompt:', userText);
    
    // Clear the prompt
    setPrompt('');
    
    // Add user message to chat
    addMessage(userText, 'user');
    
    // For demonstration, simulate an agent response
    setTimeout(() => {
      // Sample agent response - would be replaced with actual API call in production
      addMessage("I'll help you build this workflow. Let me gather some details...", 'agent');
      
      // Open chat sidebar
      toggleChat();
    }, 1000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setPrompt(suggestion);
  };

  return (
    <div className="mb-8">
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
        <div className="flex items-start">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white flex-shrink-0 mt-1">
            <i className="fas fa-robot text-sm"></i>
          </div>
          <div className="ml-4 flex-grow">
            <div className="text-sm text-slate-500 mb-2">Coordinator Agent</div>
            <div className="text-slate-700 mb-4">
              Hi there! I'm ready to help you build a new agent. What would you like to create today?
            </div>
            <div className="relative">
              <textarea 
                className="w-full border border-slate-300 rounded-lg p-3 pr-12 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none" 
                rows={3} 
                placeholder="Describe what you want to build or ask for help..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
              ></textarea>
              <Button 
                className="absolute right-3 bottom-3"
                onClick={handleSubmit}
                size="sm"
                variant="ghost"
              >
                <i className="fas fa-paper-plane"></i>
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              <button 
                className="px-3 py-1.5 text-xs bg-slate-100 text-slate-700 rounded-full hover:bg-slate-200"
                onClick={() => handleSuggestionClick("Build a customer support agent for my e-commerce store that can handle order tracking and returns")}
              >
                Build a customer support agent
              </button>
              <button 
                className="px-3 py-1.5 text-xs bg-slate-100 text-slate-700 rounded-full hover:bg-slate-200"
                onClick={() => handleSuggestionClick("Create a data analysis workflow that can process CSV files and generate insights")}
              >
                Create a data analysis workflow
              </button>
              <button 
                className="px-3 py-1.5 text-xs bg-slate-100 text-slate-700 rounded-full hover:bg-slate-200"
                onClick={() => handleSuggestionClick("Design a social media scheduler that can post content across multiple platforms")}
              >
                Design a social media scheduler
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromptInput;

import { useState, useEffect, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { useMutation } from "@tanstack/react-query";
import { ChevronLeft, MinusCircle } from "lucide-react";
import { Workflow } from '@shared/schema';
import { Chat, type ChatMessage } from "@/components/ui/chat";
import { useLocation } from "wouter";

interface WorkflowResponse {
  workflow: {
    id: number;
    name: string;
    description: string;
    type: string;
    flowData: any;
  };
}

interface NodeDetails {
  id: string;
  type: string;
  position: { x: number, y: number };
  data: any;
}

interface MonkeyAgentChatOverlayProps {
  onWorkflowGenerated?: (workflowId: number) => void;
  workflow?: Workflow;
  isNew?: boolean;
}

export function MonkeyAgentChatOverlay({ 
  onWorkflowGenerated, 
  workflow, 
  isNew = false 
}: MonkeyAgentChatOverlayProps) {
  const [, params] = useLocation();
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome-message",
      role: "assistant",
      content: "Describe the workflow you want to create, and I'll help you build it.",
      createdAt: new Date()
    }
  ]);
  const [chatMinimized, setChatMinimized] = useState(true);
  
  // Store the currently selected node for editing
  const [selectedNodeForEdit, setSelectedNodeForEdit] = useState<NodeDetails | null>(null);
  
  // Listen for the monkey-agent-modify-node event
  useEffect(() => {
    const handleNodeModifyRequest = (event: CustomEvent<{ nodeDetails: NodeDetails }>) => {
      const { nodeDetails } = event.detail;
      
      // Store the selected node for editing
      setSelectedNodeForEdit(nodeDetails);
      
      // Format the node details for a nice display in the chat
      const nodeDescription = formatNodeDetails(nodeDetails);
      
      // Open the chat panel if it's minimized
      if (chatMinimized) {
        setChatMinimized(false);
      }
      
      // Add a system message with the node details and instructions
      const helpText = `
You can modify the node by using any of the following commands:

- Change label to "New Label"
- Update description to "New Description"
- Change system prompt to "Your new system prompt"
- Update model to claude-3-sonnet-20240229
- Set temperature to 0.8
- Change max tokens to 4000

Or you can specify settings as JSON:
{"settings": {"systemPrompt": "You are a helpful assistant", "temperature": 0.7}}
      `.trim();
      
      const systemMessage: ChatMessage = {
        id: uuidv4(),
        role: "system",
        content: `Please modify the following node:\n\n${nodeDescription}\n\n${helpText}`,
        createdAt: new Date()
      };
      
      setMessages(prev => [...prev, systemMessage]);
      
      // Focus the chat input
      setTimeout(() => {
        const chatInputEl = document.querySelector('[data-chat-input]') as HTMLTextAreaElement;
        if (chatInputEl) {
          chatInputEl.focus();
        }
      }, 100);
    };
    
    // Register the event listener
    window.addEventListener('monkey-agent-modify-node', handleNodeModifyRequest as EventListener);
    
    // Cleanup
    return () => {
      window.removeEventListener('monkey-agent-modify-node', handleNodeModifyRequest as EventListener);
    };
  }, [chatMinimized]);
  
  // Helper function to format node details for display
  const formatNodeDetails = (nodeDetails: NodeDetails): string => {
    return `
Node ID: ${nodeDetails.id}
Type: ${nodeDetails.type}
Position: x=${Math.round(nodeDetails.position.x)}, y=${Math.round(nodeDetails.position.y)}
Label: ${nodeDetails.data.label || 'Unnamed Node'}
Description: ${nodeDetails.data.description || 'No description'}
    
Technical Details:
\`\`\`json
${JSON.stringify(nodeDetails, null, 2)}
\`\`\`

Please provide instructions for how you'd like to modify this node.
    `.trim();
  };
  
  // Helper function to update a node based on user input
  const updateSelectedNode = (nodeId: string, updateData: Record<string, any>) => {
    // Dispatch a custom event to tell the FlowEditor to update this node
    const event = new CustomEvent('monkey-agent-update-node', {
      detail: { 
        nodeId,
        updateData
      }
    });
    
    console.log('Dispatching monkey-agent-update-node event:', event.detail);
    window.dispatchEvent(event);
    
    // Add a confirmation message to the chat
    const confirmationMessage: ChatMessage = {
      id: uuidv4(),
      role: 'assistant',
      content: `I've updated the node with ID "${nodeId}" according to your specifications. You should see the changes in the editor now.`,
      createdAt: new Date()
    };
    
    setMessages(prev => [...prev, confirmationMessage]);
  };
  
  // We no longer display workflow context messages in the chat
  // The component internally knows which workflow it's working with
  
  // Mutation for workflow operations
  const workflowMutation = useMutation({
    mutationFn: async ({ prompt, action: initialAction }: { prompt: string, action: 'generate' | 'update' }) => {
      console.log(`Executing ${initialAction} operation for workflow with prompt: ${prompt}`);
      console.log(`Current workflow state:`, { workflowId: workflow?.id, isNew });
      
      // Make action mutable
      let action = initialAction;
      // Make workflow mutable so we can update it if needed
      let workflowObj = workflow;
      
      // Check if prompt indicates this is an update even if no workflow is provided
      // People often say "Add nodes to this workflow that..." which indicates an update
      const forcedUpdate = prompt.toLowerCase().includes('add nodes to this workflow') || 
                           prompt.toLowerCase().includes('update this workflow');
      
      // If we detect an update intention, try to extract the workflow ID from the URL
      if (forcedUpdate && !workflowObj?.id) {
        const pathParts = window.location.pathname.split('/');
        const idFromUrl = pathParts[pathParts.length - 1];
        if (idFromUrl && !isNaN(Number(idFromUrl))) {
          console.log(`Detected update request without workflow object. Using ID from URL: ${idFromUrl}`);
          // Override the action to update
          action = 'update';
          // We'll use this ID in the update request
          const workflowIdFromUrl = Number(idFromUrl);
          
          // Make a GET request to fetch the workflow first
          const workflowResponse = await fetch(`/api/workflows/${workflowIdFromUrl}`);
          if (workflowResponse.ok) {
            const workflowData = await workflowResponse.json();
            console.log(`Successfully retrieved workflow from ID:`, workflowData);
            // Now we have the workflow object
            workflowObj = workflowData;
          }
        }
      }
      
      try {
        if (action === 'generate' && !forcedUpdate) {
          // Create a new workflow if we're not on a specific workflow page
          // or if explicitly directed to generate a new one
          console.log("Generating a new workflow...");
          const response = await fetch('/api/workflows/generate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prompt }),
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error("Generate workflow API error:", errorText);
            throw new Error(`Failed to generate workflow: ${errorText}`);
          }
          
          const data = await response.json();
          console.log("Generated workflow response:", data);
          
          return { 
            data: data as WorkflowResponse,
            action: 'generate'
          };
        } else if (action === 'update' && workflowObj?.id) {
          // Update the current workflow with the changes requested via the prompt
          console.log(`Updating existing workflow ID ${workflowObj.id}...`);
          const response = await fetch(`/api/workflows/update/${workflowObj.id}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              prompt,
              currentWorkflowId: workflowObj.id,
              currentWorkflowName: workflowObj.name
            }),
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error("Update workflow API error:", errorText);
            
            // If updating fails, add a message to the chat but don't throw an error
            setMessages(prev => [
              ...prev,
              {
                id: uuidv4(),
                role: 'assistant',
                content: `I received your request but couldn't update the workflow. The system returned: ${errorText}`,
                createdAt: new Date()
              }
            ]);
            
            // Return a dummy successful response so we don't break the UI
            return {
              data: {
                workflow: {
                  id: workflowObj.id,
                  name: workflowObj.name,
                  description: workflowObj.description || "",
                  type: workflowObj.type || "custom",
                  flowData: workflowObj.flowData
                }
              },
              action: 'update'
            };
          }
          
          const data = await response.json();
          console.log("Updated workflow response:", data);
          
          return { 
            data: data as WorkflowResponse,
            action: 'update'
          };
        } else {
          console.error("Invalid workflow action or missing workflow ID", { action, workflowId: workflowObj?.id });
          throw new Error('Invalid action or missing workflow ID');
        }
      } catch (error) {
        console.error("Workflow mutation error:", error);
        
        // Add error message to chat
        setMessages(prev => [
          ...prev,
          {
            id: uuidv4(),
            role: 'assistant',
            content: `I encountered an error while processing your request: ${error instanceof Error ? error.message : String(error)}`,
            createdAt: new Date()
          }
        ]);
        
        // Re-throw to trigger the error UI state
        throw error;
      }
    },
    onSuccess: (result) => {
      const { data, action } = result;
      
      console.log(`Workflow ${action} successful:`, data);
      
      // Notify parent about the workflow for both generate and update actions
      if (onWorkflowGenerated) {
        console.log(`Calling onWorkflowGenerated with id: ${data.workflow.id}`);
        onWorkflowGenerated(data.workflow.id);
      }
      
      // Add different AI responses based on the action taken
      let responseContent = '';
      
      if (action === 'generate') {
        responseContent = `I've generated a new workflow called "${data.workflow.name}" based on your description. You can see it in the editor and make any adjustments as needed.`;
      } else {
        responseContent = `I've updated the workflow "${data.workflow.name}" with your suggestions. The changes should now be visible in the editor. Please let me know if you'd like me to make any additional modifications.`;
      }
      
      setMessages(prev => [
        ...prev,
        {
          id: uuidv4(),
          role: 'assistant',
          content: responseContent,
          createdAt: new Date()
        }
      ]);
    },
    onError: (error) => {
      console.error("Workflow mutation error handler:", error);
      
      // We're handling errors in the mutation function itself
      // so we don't need to do anything else here
    }
  });

  const handleSubmit = useCallback((input: string) => {
    // Add user message
    const userMessage: ChatMessage = {
      id: uuidv4(),
      role: 'user',
      content: input,
      createdAt: new Date()
    };
    
    // Clear input and add message
    setChatInput('');
    setMessages(prev => [...prev, userMessage]);
    
    // Check if we're in node edit mode
    if (selectedNodeForEdit) {
      // Process the request to modify the selected node
      try {
        console.log('Processing node edit request:', input);
        
        // Add a thinking message
        const thinkingMessage: ChatMessage = {
          id: uuidv4(),
          role: 'assistant',
          content: "I'm analyzing your request to modify the node...",
          createdAt: new Date()
        };
        
        setMessages(prev => [...prev, thinkingMessage]);
        
        // Analyze the input to determine what changes to make
        // This is a simple implementation - in a real system we might use an LLM
        // to parse the user's natural language request
        
        // For now, we'll look for some specific patterns:
        // "change/set/update label to X" for changing the label
        // "change/set/update description to X" for changing the description
        // "change model to X" for changing the model (Claude node)
        
        const updateData: Record<string, any> = {};
        
        // Extract label changes
        const labelMatch = input.match(/(?:change|set|update)\s+(?:the\s+)?label\s+(?:to|as)\s+"([^"]+)"/i) ||
                          input.match(/(?:change|set|update)\s+(?:the\s+)?label\s+(?:to|as)\s+(.+?)(?:\.|$)/i);
        
        if (labelMatch) {
          updateData.label = labelMatch[1].trim();
        }
        
        // Extract description changes
        const descMatch = input.match(/(?:change|set|update)\s+(?:the\s+)?description\s+(?:to|as)\s+"([^"]+)"/i) ||
                         input.match(/(?:change|set|update)\s+(?:the\s+)?description\s+(?:to|as)\s+(.+?)(?:\.|$)/i);
        
        if (descMatch) {
          updateData.description = descMatch[1].trim();
        }
        
        // Extract model changes for Claude node
        const modelMatch = input.match(/(?:change|set|update)\s+(?:the\s+)?model\s+(?:to|as)\s+"([^"]+)"/i) ||
                          input.match(/(?:change|set|update)\s+(?:the\s+)?model\s+(?:to|as)\s+(.+?)(?:\.|$)/i);
        
        if (modelMatch && selectedNodeForEdit.type === 'claude') {
          if (!updateData.settings) updateData.settings = {};
          updateData.settings.model = modelMatch[1].trim();
        }
        
        // Extract system prompt changes for Claude node
        const systemPromptMatch = input.match(/(?:change|set|update)\s+(?:the\s+)?system\s+prompt\s+(?:to|as)\s+"([^"]+)"/i) ||
                                 input.match(/(?:change|set|update)\s+(?:the\s+)?system\s+prompt\s+(?:to|as)\s+(.+?)(?:\.|$)/i);
        
        if (systemPromptMatch && selectedNodeForEdit.type === 'claude') {
          if (!updateData.settings) updateData.settings = {};
          updateData.settings.systemPrompt = systemPromptMatch[1].trim();
        }
        
        // Extract temperature changes for Claude node
        const temperatureMatch = input.match(/(?:change|set|update)\s+(?:the\s+)?temperature\s+(?:to|as)\s+(\d+\.?\d*)/i);
        
        if (temperatureMatch && selectedNodeForEdit.type === 'claude') {
          if (!updateData.settings) updateData.settings = {};
          updateData.settings.temperature = parseFloat(temperatureMatch[1].trim());
        }
        
        // Extract max tokens changes for Claude node
        const maxTokensMatch = input.match(/(?:change|set|update)\s+(?:the\s+)?max(?:\s+)?tokens\s+(?:to|as)\s+(\d+)/i);
        
        if (maxTokensMatch && selectedNodeForEdit.type === 'claude') {
          if (!updateData.settings) updateData.settings = {};
          updateData.settings.maxTokens = parseInt(maxTokensMatch[1].trim(), 10);
        }
        
        // General approach for any setting: "change [setting name] to [value]"
        const generalSettingMatch = input.match(/(?:change|set|update)\s+(?:the\s+)?(\w+(?:\s+\w+)*)\s+(?:to|as)\s+"([^"]+)"/i) ||
                                   input.match(/(?:change|set|update)\s+(?:the\s+)?(\w+(?:\s+\w+)*)\s+(?:to|as)\s+([^\.]+)(?:\.|$)/i);
        
        if (generalSettingMatch) {
          const settingKey = generalSettingMatch[1].trim().replace(/\s+/g, '');
          const settingValue = generalSettingMatch[2].trim();
          
          // Only apply if it's not one of the settings we've already handled
          const handledSettings = ['model', 'systemprompt', 'temperature', 'maxtokens', 'label', 'description'];
          
          if (!handledSettings.includes(settingKey.toLowerCase())) {
            if (!updateData.settings) updateData.settings = {};
            
            // Try to parse as number or boolean if applicable
            if (settingValue === 'true') {
              updateData.settings[settingKey] = true;
            } else if (settingValue === 'false') {
              updateData.settings[settingKey] = false;
            } else if (!isNaN(Number(settingValue))) {
              updateData.settings[settingKey] = Number(settingValue);
            } else {
              updateData.settings[settingKey] = settingValue;
            }
          }
        }
        
        // If the user provides settings for a node as JSON
        const settingsMatch = input.match(/(?:change|set|update)\s+(?:the\s+)?settings\s+(?:to|as)\s+({.+})/i);
        if (settingsMatch) {
          try {
            const settingsObject = JSON.parse(settingsMatch[1]);
            if (!updateData.settings) updateData.settings = {};
            updateData.settings = {
              ...updateData.settings,
              ...settingsObject
            };
          } catch (e) {
            console.error('Failed to parse settings JSON:', e);
          }
        }
        
        // If no specific updates were detected but input contains JSON
        if (Object.keys(updateData).length === 0) {
          const jsonMatch = input.match(/({[\s\S]*})/);
          if (jsonMatch) {
            try {
              const jsonData = JSON.parse(jsonMatch[1]);
              Object.assign(updateData, jsonData);
            } catch (e) {
              console.error('Failed to parse JSON in input:', e);
            }
          }
        }
        
        // If we still don't have any updates, use the whole input as a content update for text nodes
        if (Object.keys(updateData).length === 0 && selectedNodeForEdit.type === 'text_prompt') {
          updateData.content = input;
        }
        
        // If we have updates to make
        if (Object.keys(updateData).length > 0) {
          // Remove the thinking message first
          setMessages(prev => prev.filter(msg => msg.id !== thinkingMessage.id));
          
          // Update the node
          updateSelectedNode(selectedNodeForEdit.id, updateData);
          
          // Clear the selected node so we're not in edit mode anymore
          setSelectedNodeForEdit(null);
        } else {
          // If we couldn't determine what to update, replace the thinking message with an error
          setMessages(prev => 
            prev.map(msg => 
              msg.id === thinkingMessage.id 
                ? {
                    ...msg,
                    content: "I couldn't determine how to update the node based on your input. Please provide specific instructions like 'change label to \"New Label\"' or 'update description to \"New description\"'."
                  }
                : msg
            )
          );
        }
      } catch (error) {
        console.error('Error processing node edit request:', error);
        
        // Add error message
        setMessages(prev => [
          ...prev,
          {
            id: uuidv4(),
            role: 'assistant',
            content: `I encountered an error while processing your request: ${error instanceof Error ? error.message : String(error)}`,
            createdAt: new Date()
          }
        ]);
      }
    } else {
      // Not in node edit mode, process as a normal workflow request
      // Determine whether to update existing workflow or generate a new one
      const action = (!isNew && workflow?.id) ? 'update' : 'generate';
      
      // Call the appropriate API
      workflowMutation.mutate({ 
        prompt: input, 
        action 
      });
    }
  }, [workflowMutation, workflow, isNew, selectedNodeForEdit]);

  // Toggle chat panel visibility
  const toggleChatPanel = () => {
    setChatMinimized(!chatMinimized);
  };

  return (
    <>
      {/* Chat Panel Toggle Button */}
      <button 
        onClick={toggleChatPanel}
        className="fixed top-24 z-20 p-2 bg-primary text-white rounded-full shadow-md hover:bg-primary/90 transition-all"
        style={{
          right: chatMinimized ? '16px' : '360px' /* Position differently based on chat state */
        }}
        aria-label={chatMinimized ? "Expand chat" : "Minimize chat"}
      >
        {chatMinimized ? <ChevronLeft className="h-4 w-4" /> : <MinusCircle className="h-4 w-4" />}
      </button>

      {/* Chat Panel - Fixed on the right side with toggle functionality */}
      {/* When minimized, the panel should be completely off-screen */}
      <div 
        className={`fixed top-24 bottom-4 w-[350px] z-10 transition-all duration-300 ease-in-out`} 
        style={{ 
          right: chatMinimized ? '-350px' : '4px',
          transform: 'none', /* Don't use transform as it can affect layout */ 
          boxShadow: chatMinimized ? 'none' : '0 4px 12px rgba(0,0,0,0.1)',
          pointerEvents: chatMinimized ? 'none' : 'auto'
        }}
      >
        <Chat
          messages={messages}
          input={chatInput}
          onInputChange={setChatInput}
          onSubmit={handleSubmit}
          isLoading={workflowMutation.isPending}
        />
      </div>
    </>
  );
}

export default MonkeyAgentChatOverlay;
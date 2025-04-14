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
  const [chatMinimized, setChatMinimized] = useState(false);
  
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
You can modify the node by describing the changes you want to make:

- "Change the label to 'New Label'"
- "Update the description to explain that this node processes customer data"
- "Change the system prompt to be more friendly and conversational"
- "Set the temperature to 0.7"
- "Make this node use the claude-3-haiku model"
- "Update the max tokens to 2000"

I'll understand natural language requests and apply the changes to the node.
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
          content: "I'm analyzing your request and updating the node...",
          createdAt: new Date()
        };
        
        setMessages(prev => [...prev, thinkingMessage]);
        
        // Call the AI-powered node editing API
        fetch('/api/nodes/edit-with-ai', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            nodeData: selectedNodeForEdit,
            userPrompt: input
          })
        })
        .then(response => {
          if (!response.ok) {
            throw new Error(`API returned ${response.status}: ${response.statusText}`);
          }
          return response.json();
        })
        .then(data => {
          if (data.success && data.updatedNodeData) {
            console.log('AI node edit successful:', data.updatedNodeData);
            
            // Update node with the AI-generated changes
            updateSelectedNode(selectedNodeForEdit.id, data.updatedNodeData);
            
            // Remove the "thinking" message
            setMessages(prev => prev.filter(msg => msg.id !== thinkingMessage.id));
            
            // Add a success message
            const successMessage: ChatMessage = {
              id: uuidv4(),
              role: 'assistant',
              content: `I've updated the node with your requested changes. The node has been modified as you requested.`,
              createdAt: new Date()
            };
            
            setMessages(prev => [...prev, successMessage]);
            
            // Reset the selected node
            setSelectedNodeForEdit(null);
          } else {
            throw new Error('API response did not contain valid update data');
          }
        })
        .catch(error => {
          console.error('Error in AI node editing:', error);
          
          // Remove the "thinking" message
          setMessages(prev => prev.filter(msg => msg.id !== thinkingMessage.id));
          
          // Add an error message
          const errorMessage: ChatMessage = {
            id: uuidv4(),
            role: 'assistant',
            content: `Sorry, I encountered an error while trying to update the node: ${error.message}. Please try again with different wording.`,
            createdAt: new Date()
          };
          
          setMessages(prev => [...prev, errorMessage]);
        });
        
        // Return early as we're handling the rest asynchronously
        return;
      } catch (error) {
        console.error('Error processing node edit:', error);
        
        // Add error message
        const errorMessage: ChatMessage = {
          id: uuidv4(),
          role: 'assistant',
          content: `Sorry, there was an error processing your request: ${error instanceof Error ? error.message : String(error)}`,
          createdAt: new Date()
        };
        
        setMessages(prev => [...prev, errorMessage]);
        return;
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
        className="absolute top-24 right-4 z-20 p-2 bg-primary text-white rounded-full shadow-md hover:bg-primary/90 transition-all"
        aria-label={chatMinimized ? "Expand chat" : "Minimize chat"}
      >
        {chatMinimized ? <ChevronLeft className="h-4 w-4" /> : <MinusCircle className="h-4 w-4" />}
      </button>

      {/* Chat Panel - Fixed on the right side with toggle functionality */}
      <div className={`absolute top-24 ${chatMinimized ? 'right-[-340px]' : 'right-4'} bottom-4 w-[350px] z-10 transition-all duration-300 ease-in-out`}>
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
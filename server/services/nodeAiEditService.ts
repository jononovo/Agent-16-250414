/**
 * Node AI Editing Service
 * 
 * This service provides AI-driven node editing functionality using Claude API.
 * It takes a node's data and a user's natural language request, then returns
 * an updated version of the node data with the requested changes applied.
 */
import { Request, Response } from "express";
import fetch from "node-fetch";
import { log } from "../vite";

export async function handleNodeAiEdit(req: Request, res: Response) {
  try {
    const { nodeData, userPrompt } = req.body;
    
    if (!nodeData || !userPrompt) {
      res.status(400).json({ error: "Node data and user prompt are required" });
      return;
    }
    
    // Get Claude API key from environment
    const claudeApiKey = process.env.CLAUDE_API_KEY;
    
    if (!claudeApiKey) {
      res.status(500).json({ 
        error: true, 
        message: "Claude API key is not configured" 
      });
      return;
    }
    
    // Log the edit request
    log(`AI node edit request for node type: ${nodeData.type}, id: ${nodeData.id}`, "node-ai-edit");
    
    // Format the message for Claude API
    const systemPrompt = `
You are a workflow node editor assistant. You'll receive a JSON representation of a node 
and a user request to modify its parameters. Your task is to:

1. Understand the current node structure and parameters
2. Parse the user's natural language request to determine what changes they want to make
3. Return a modified version of the JSON that reflects these changes
4. ONLY change parameters mentioned in the user request, preserve all other values
5. Return ONLY the modified data object with just the fields that need to change

IMPORTANT: 
- Do not modify the structure of the JSON or add fields that don't exist
- Only change values of existing fields
- Format your response as a clean JSON object only including the fields that changed
- For example, if only the "label" field changed, return {"label": "New Label"}
`;
    
    const userMessage = `
Here is the node data I want to modify:
\`\`\`json
${JSON.stringify(nodeData, null, 2)}
\`\`\`

My request: ${userPrompt}

Please provide ONLY the updated fields in valid JSON format.
`;
    
    // Make request to Claude API
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': claudeApiKey,
          'anthropic-version': '2023-01-01'
        },
        body: JSON.stringify({
          model: "claude-3-sonnet-20240229",
          max_tokens: 4000,
          temperature: 0.2,
          system: systemPrompt,
          messages: [
            { role: "user", content: userMessage }
          ]
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Claude API error:", errorText);
        throw new Error(`Claude API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json() as { content: Array<{ type: string, text: string }> };
      
      // Extract the content from Claude's response
      const aiResponse = data.content?.[0]?.text || "";
      
      // Extract the JSON from the response (Claude will likely wrap it in ```json and ```)
      const jsonMatch = aiResponse.match(/```(?:json)?([\s\S]+?)```/) || 
                        aiResponse.match(/({[\s\S]*})/);
      
      if (!jsonMatch) {
        throw new Error("Could not extract valid JSON from Claude response");
      }
      
      // Parse the extracted JSON
      const extractedJson = jsonMatch[1].trim();
      log(`Extracted JSON from Claude: ${extractedJson}`, "node-ai-edit");
      
      const updatedNodeData = JSON.parse(extractedJson);
      
      // Return the updated node data
      res.json({ 
        success: true, 
        updatedNodeData 
      });
    } catch (error) {
      console.error("Error calling Claude API:", error);
      res.status(500).json({ 
        error: true, 
        message: error instanceof Error ? error.message : "Failed to process node edit with AI" 
      });
    }
  } catch (error) {
    console.error("Error in AI node editing:", error);
    res.status(500).json({ 
      error: true, 
      message: error instanceof Error ? error.message : "Failed to process node edit request" 
    });
  }
}
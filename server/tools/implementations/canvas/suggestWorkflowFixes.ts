/**
 * Suggest Workflow Fixes Tool
 * 
 * This tool suggests specific fixes for workflow issues, including which nodes
 * to modify and what specific parameters to update.
 * It only works with valid node types from the system.
 */
import { Tool, ToolResult } from '../../toolTypes';
import { storage } from '../../../storage';
import { AVAILABLE_NODE_TYPES } from '../../../services/workflowGenerationService';

const suggestWorkflowFixesTool: Tool = {
  name: 'suggestWorkflowFixes',
  description: 'Suggest specific fixes for workflow issues, including which nodes to modify and what parameters to update',
  category: 'canvas',
  contexts: ['canvas', 'workflow'], // This tool is only available in canvas contexts
  parameters: {
    type: 'object',
    properties: {
      workflowId: {
        type: 'number',
        description: 'The ID of the workflow to analyze and suggest fixes for',
      },
      issues: {
        type: 'array',
        description: 'Optional array of specific issues to address (from analyzeWorkflowIssues)',
        items: {
          type: 'object',
          properties: {
            type: { type: 'string' },
            affectedNodes: { 
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'number' },
                  type: { type: 'string' }
                }
              }
            }
          }
        }
      },
      objective: {
        type: 'string',
        description: 'Optional description of what the workflow should accomplish',
      },
    },
    required: ['workflowId'],
  },
  async execute(params: any): Promise<ToolResult> {
    try {
      const { workflowId, issues, objective } = params;
      
      // Get the workflow
      const workflow = await storage.getWorkflow(workflowId);
      if (!workflow) {
        return {
          success: false,
          error: `Workflow with ID ${workflowId} not found`,
        };
      }
      
      // Get all nodes in the workflow
      const nodes = await storage.getNodes();
      const workflowNodes = nodes.filter(node => node.workflowId === workflowId);
      
      if (workflowNodes.length === 0) {
        // Use text_input which is in our AVAILABLE_NODE_TYPES list
        const inputNodeType = 'text_input';
        
        return {
          success: true,
          message: 'This workflow has no nodes to fix',
          data: {
            suggestedFixes: [{
              action: 'add_node',
              nodeType: inputNodeType,
              reason: 'Add an initial input node to start the workflow',
              details: 'Every workflow needs a starting point. A text input node allows users to provide initial data.'
            }],
          },
        };
      }
      
      // Generate suggested fixes
      const suggestedFixes = [];
      
      // If issues were provided, generate targeted fixes
      if (issues && issues.length > 0) {
        for (const issue of issues) {
          switch (issue.type) {
            case 'disconnected_nodes':
              // Suggest connecting disconnected nodes
              if (issue.affectedNodes && issue.affectedNodes.length > 0) {
                issue.affectedNodes.forEach((node: {id: number, type: string}) => {
                  // Find potential nodes to connect to
                  const potentialTargets = workflowNodes.filter((n) => n.id !== node.id);
                  
                  if (potentialTargets.length > 0) {
                    const target = potentialTargets[0]; // Simplistic - just pick the first one
                    
                    suggestedFixes.push({
                      action: 'connect_nodes',
                      sourceNodeId: node.id,
                      targetNodeId: target.id,
                      reason: `Connect disconnected node ${node.id} (${node.type}) to node ${target.id} (${target.type})`,
                      details: 'This will allow data to flow between these nodes in the workflow.'
                    });
                  }
                });
              }
              break;
              
            case 'missing_parameters':
              // Suggest parameters based on node type
              if (issue.affectedNodes && issue.affectedNodes.length > 0) {
                issue.affectedNodes.forEach((nodeInfo: {id: number, type: string}) => {
                  const node = workflowNodes.find((n) => n.id === nodeInfo.id);
                  if (node) {
                    let suggestedParams = {};
                    
                    // Suggest parameters based on node type - using our approved node types
                    switch (node.type) {
                      // Input nodes
                      case 'text_input':
                      case 'textInput': // For backward compatibility
                        suggestedParams = {
                          defaultValue: '',
                          label: 'Input',
                          placeholder: 'Enter your input here...',
                          required: true
                        };
                        break;
                        
                      case 'file_input':
                        suggestedParams = {
                          label: 'File Input',
                          acceptedTypes: '.txt,.json,.csv',
                          maxSize: 10, // MB
                          required: true
                        };
                        break;
                        
                      // Processing nodes  
                      case 'http_request':
                      case 'httpRequest': // For backward compatibility
                        suggestedParams = {
                          url: 'https://api.example.com/data',
                          method: 'GET',
                          headers: { 'Content-Type': 'application/json' },
                        };
                        break;
                        
                      case 'claude':
                        suggestedParams = {
                          model: 'claude-3-opus-20240229',
                          temperature: 0.7,
                          maxTokens: 1000,
                          systemPrompt: 'You are a helpful AI assistant.'
                        };
                        break;
                        
                      case 'json_parser':
                        suggestedParams = {
                          strictMode: false,
                          defaultValue: {},
                        };
                        break;
                        
                      case 'csv_parser':
                        suggestedParams = {
                          delimiter: ',',
                          hasHeader: true,
                        };
                        break;
                        
                      case 'decision':
                        suggestedParams = {
                          condition: 'value > 0',
                          defaultPath: 'false'
                        };
                        break;
                        
                      // Output nodes
                      case 'text_template':
                        suggestedParams = {
                          template: 'The result is: {{ result }}',
                        };
                        break;
                        
                      case 'api_response':
                        suggestedParams = {
                          statusCode: 200,
                          format: 'json',
                        };
                        break;
                       
                      default:
                        // Generic parameters for any node type
                        suggestedParams = {
                          configured: true,
                          enabled: true,
                        };
                    }
                    
                    suggestedFixes.push({
                      action: 'update_parameters',
                      nodeId: node.id,
                      nodeType: node.type,
                      parameters: suggestedParams,
                      reason: `Add required parameters to ${node.type} node`,
                      details: `Node ${node.id} is missing parameters needed for proper operation.`
                    });
                  }
                });
              }
              break;
              
            case 'potential_circular_references':
              // Suggest breaking circular references
              if (issue.affectedNodes && issue.affectedNodes.length > 0) {
                suggestedFixes.push({
                  action: 'modify_workflow_structure',
                  affectedNodes: issue.affectedNodes.map((n: {id: number, type: string}) => n.id),
                  reason: 'Break potential circular references in the workflow',
                  details: 'Circular references can cause infinite loops. Review the connections between these nodes and consider removing or redirecting some connections.'
                });
              }
              break;
              
            default:
              // Generic suggestion for unknown issue types
              suggestedFixes.push({
                action: 'review_workflow',
                issueType: issue.type,
                reason: `Address identified issue: ${issue.type}`,
                details: 'Review the workflow structure and node configurations to address this issue.'
              });
          }
        }
      } else {
        // Without specific issues, provide general improvement suggestions
        // Check for missing node types that would make the workflow more complete
        
        // Check if there's an input node - map to available node types
        const inputNodeTypes = ['text_input', 'file_input'];
        const hasInputNode = workflowNodes.some(node => 
          inputNodeTypes.includes(node.type) || 
          node.type === 'textInput' // Also check legacy names
        );
        
        if (!hasInputNode) {
          // Use text_input from our approved list
          const recommendedInputType = 'text_input';
          
          suggestedFixes.push({
            action: 'add_node',
            nodeType: recommendedInputType,
            position: { x: 100, y: 100 },
            reason: 'Add an input node to start the workflow',
            details: 'Every workflow needs a starting point for data input.'
          });
        }
        
        // Check if there's an output/display node
        const outputNodeTypes = ['api_response', 'text_template']; 
        const hasOutputNode = workflowNodes.some(node => 
          outputNodeTypes.includes(node.type) || 
          ['textOutput', 'visualization'].includes(node.type) // Check legacy names
        );
        
        if (!hasOutputNode) {
          // Use api_response from our approved list
          const recommendedOutputType = 'api_response';
          
          suggestedFixes.push({
            action: 'add_node',
            nodeType: recommendedOutputType,
            position: { x: 500, y: 300 },
            reason: 'Add an output node to display results',
            details: 'Adding an output node will help visualize the workflow results.'
          });
        }
        
        // Check node parameters for completeness
        workflowNodes.forEach(node => {
          if (!node.data || Object.keys(node.data).length < 2) {
            suggestedFixes.push({
              action: 'review_node_configuration',
              nodeId: node.id,
              nodeType: node.type,
              reason: `Review configuration for ${node.type} node (ID: ${node.id})`,
              details: 'This node has minimal configuration. Adding more parameters may improve its functionality.'
            });
          }
        });
      }
      
      // If an objective was provided, add suggestions for aligning with objective
      if (objective) {
        suggestedFixes.push({
          action: 'align_with_objective',
          objective,
          reason: 'Align workflow with stated objective',
          details: 'Review the entire workflow to ensure it properly addresses the stated objective.'
        });
        
        // If we have some context about what the workflow should do,
        // we could provide more specific suggestions here
      }
      
      return {
        success: true,
        message: `Generated ${suggestedFixes.length} suggested fixes for workflow ${workflowId} (${workflow.name})`,
        data: {
          workflowName: workflow.name,
          suggestedFixes: suggestedFixes.length > 0 ? suggestedFixes : [{
            action: 'no_fixes_needed',
            reason: 'No specific fixes needed',
            details: 'The workflow structure appears to be sound. Continue testing with different inputs.'
          }],
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to suggest workflow fixes: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  },
};

export default suggestWorkflowFixesTool;
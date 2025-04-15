/**
 * Improve Workflow Tool
 * 
 * This tool suggests improvements to an existing workflow by identifying 
 * specific nodes that can be modified to enhance the overall output.
 */
import { Tool, ToolResult } from '../../toolTypes';
import { storage } from '../../../storage';

const improveWorkflowTool: Tool = {
  name: 'improveWorkflow',
  description: 'Suggest improvements to an existing workflow based on stated criteria or objectives',
  category: 'canvas',
  contexts: ['canvas', 'workflow'], // This tool is only available in canvas contexts
  parameters: {
    type: 'object',
    properties: {
      workflowId: {
        type: 'number',
        description: 'The ID of the workflow to improve',
      },
      criteria: {
        type: 'array',
        description: 'List of criteria or objectives to optimize the workflow for',
        items: {
          type: 'string'
        }
      },
      focusArea: {
        type: 'string',
        description: 'Optional area to focus improvements on (e.g., "performance", "accuracy", "usability")',
      },
    },
    required: ['workflowId'],
  },
  async execute(params: any): Promise<ToolResult> {
    try {
      const { workflowId, criteria = [], focusArea = 'general' } = params;
      
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
        return {
          success: true,
          message: 'This workflow has no nodes to improve',
          data: {
            suggestedImprovements: [{
              type: 'empty_workflow',
              message: 'Workflow has no nodes to improve',
              suggestion: 'Add nodes to the workflow first before seeking improvements.'
            }],
          },
        };
      }
      
      // Generate suggested improvements
      const suggestedImprovements = [];
      
      // Analyze workflow for each node type and suggest improvements
      workflowNodes.forEach(node => {
        switch (node.type) {
          case 'textInput':
            suggestedImprovements.push({
              nodeId: node.id,
              nodeType: node.type,
              currentConfig: node.data || {},
              suggestedChanges: {
                validation: true,
                placeholder: 'Enter specific instructions...',
                helpText: 'Provide clear instructions for best results'
              },
              reason: 'Enhance user input guidance',
              benefitArea: 'usability',
              implementationDifficulty: 'low'
            });
            break;
            
          case 'httpRequest':
            suggestedImprovements.push({
              nodeId: node.id,
              nodeType: node.type,
              currentConfig: node.data || {},
              suggestedChanges: {
                caching: true,
                retryStrategy: {
                  maxRetries: 3,
                  backoffFactor: 2
                },
                timeout: 10000
              },
              reason: 'Improve reliability and performance of API calls',
              benefitArea: 'performance',
              implementationDifficulty: 'medium'
            });
            break;
            
          case 'openAiCompletion':
            suggestedImprovements.push({
              nodeId: node.id,
              nodeType: node.type,
              currentConfig: node.data || {},
              suggestedChanges: {
                model: 'gpt-4-1106-preview', // Suggest the latest model
                temperature: 0.5, // Suggest a balanced temperature
                systemMessage: 'You are a helpful AI assistant focused on providing clear, accurate responses.'
              },
              reason: 'Optimize AI model parameters for better responses',
              benefitArea: 'accuracy',
              implementationDifficulty: 'low'
            });
            break;
            
          case 'textTransformation':
            suggestedImprovements.push({
              nodeId: node.id,
              nodeType: node.type,
              currentConfig: node.data || {},
              suggestedChanges: {
                preserveFormatting: true,
                errorHandling: 'graceful'
              },
              reason: 'Enhance text processing robustness',
              benefitArea: 'reliability',
              implementationDifficulty: 'low'
            });
            break;
            
          case 'conditionalLogic':
            suggestedImprovements.push({
              nodeId: node.id,
              nodeType: node.type,
              currentConfig: node.data || {},
              suggestedChanges: {
                defaultPath: 'true',
                logicDisplay: 'visual'
              },
              reason: 'Improve conditional logic clarity and default behavior',
              benefitArea: 'usability',
              implementationDifficulty: 'medium'
            });
            break;
            
          default:
            // For any other node type, suggest general improvements
            suggestedImprovements.push({
              nodeId: node.id,
              nodeType: node.type,
              currentConfig: node.data || {},
              suggestedChanges: {
                documentation: true,
                logging: 'detailed'
              },
              reason: `General improvements for ${node.type} node`,
              benefitArea: 'maintainability',
              implementationDifficulty: 'low'
            });
        }
      });
      
      // Filter improvements based on focus area if specified
      let filteredImprovements = suggestedImprovements;
      if (focusArea !== 'general') {
        filteredImprovements = suggestedImprovements.filter(
          improvement => improvement.benefitArea === focusArea
        );
        
        // If no improvements match the focus area, provide a fallback
        if (filteredImprovements.length === 0) {
          filteredImprovements = [{
            type: 'focus_area_not_applicable',
            focusArea,
            message: `No specific improvements found for focus area '${focusArea}'`,
            suggestion: 'Consider a different focus area or view general improvements'
          }];
        }
      }
      
      // If criteria were provided, include those in the response
      let criteriaResponse = {};
      if (criteria.length > 0) {
        criteriaResponse = {
          providedCriteria: criteria,
          criteriaAnalysis: criteria.map(criterion => ({
            criterion,
            applicability: 'high',
            relatedImprovements: filteredImprovements
              .filter(imp => imp.nodeId) // Filter out non-node improvements
              .map(imp => imp.nodeId)
          }))
        };
      }
      
      return {
        success: true,
        message: `Generated ${filteredImprovements.length} improvement suggestions for workflow ${workflowId} (${workflow.name})`,
        data: {
          workflowName: workflow.name,
          workflowDescription: workflow.description,
          focusArea,
          ...criteriaResponse,
          suggestedImprovements: filteredImprovements.length > 0 ? filteredImprovements : [{
            type: 'no_improvements_needed',
            message: 'The workflow appears to be well-optimized already',
            suggestion: 'Consider adding more complex functionality to further enhance capabilities'
          }],
          implementationStrategy: {
            priorityOrder: ['high_impact_low_effort', 'address_bottlenecks', 'enhance_user_experience'],
            testingRecommendation: 'Test each improvement individually to measure impact'
          }
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to suggest workflow improvements: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  },
};

export default improveWorkflowTool;
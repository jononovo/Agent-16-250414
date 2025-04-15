/**
 * Improve Workflow Tool
 * 
 * This tool suggests improvements to an existing workflow by identifying 
 * specific nodes that can be modified to enhance the overall output.
 * It only works with valid node types from the system.
 */
import { Tool, ToolResult } from '../../toolTypes';
import { storage } from '../../../storage';
import { AVAILABLE_NODE_TYPES } from '../../../services/workflowGenerationService';

// Define the improvement suggestion interface
interface ImprovementSuggestion {
  nodeId?: number;
  nodeType?: string;
  currentConfig?: Record<string, any>;
  suggestedChanges?: Record<string, any>;
  reason?: string;
  benefitArea?: string;
  implementationDifficulty?: string;
  type?: string;
  message?: string;
  suggestion?: string;
  focusArea?: string;
}

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
      const suggestedImprovements: ImprovementSuggestion[] = [];
      
      // Analyze workflow for each node type and suggest improvements
      workflowNodes.forEach(node => {
        // First verify the node type is in our allowed list, or provide general improvements
        if (!AVAILABLE_NODE_TYPES.includes(node.type)) {
          // For legacy or custom node types, suggest migration to supported types
          suggestedImprovements.push({
            nodeId: node.id,
            nodeType: node.type,
            currentConfig: node.data || {},
            suggestedChanges: {
              migrateToSupportedType: true,
              recommendedType: AVAILABLE_NODE_TYPES.find(type => 
                type.toLowerCase().includes(node.type.toLowerCase().replace(/([A-Z])/g, '_$1').toLowerCase())
              ) || 'text_template'
            },
            reason: `Migrate from unsupported node type "${node.type}" to a supported node type`,
            benefitArea: 'compatibility',
            implementationDifficulty: 'medium'
          });
          return; // Skip to next node
        }
        
        // Now provide specific improvements for each of our approved node types
        switch (node.type) {
          // Input nodes
          case 'text_input':
          case 'textInput': // For backward compatibility
            suggestedImprovements.push({
              nodeId: node.id,
              nodeType: node.type,
              currentConfig: node.data || {},
              suggestedChanges: {
                validation: true,
                placeholder: 'Enter specific instructions...',
                helpText: 'Provide clear instructions for best results',
                required: true
              },
              reason: 'Enhance user input guidance',
              benefitArea: 'usability',
              implementationDifficulty: 'low'
            });
            break;
            
          case 'file_input':
            suggestedImprovements.push({
              nodeId: node.id,
              nodeType: node.type,
              currentConfig: node.data || {},
              suggestedChanges: {
                acceptedTypes: '.json,.csv,.txt',
                maxSize: 10,
                validation: true,
                helpText: 'Upload a file (10MB max)'
              },
              reason: 'Improve file input constraints and user guidance',
              benefitArea: 'usability',
              implementationDifficulty: 'low'
            });
            break;
          
          // API nodes
          case 'http_request':
          case 'httpRequest': // For backward compatibility
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
                timeout: 10000,
                errorHandling: 'graceful'
              },
              reason: 'Improve reliability and performance of API calls',
              benefitArea: 'performance',
              implementationDifficulty: 'medium'
            });
            break;
            
          // AI nodes  
          case 'claude':
            suggestedImprovements.push({
              nodeId: node.id,
              nodeType: node.type,
              currentConfig: node.data || {},
              suggestedChanges: {
                model: 'claude-3-opus-20240229', // Use latest model
                temperature: 0.5, // Suggest a balanced temperature
                systemPrompt: 'You are a helpful AI assistant focused on providing clear, accurate responses.',
                maxTokens: 2000
              },
              reason: 'Optimize Claude AI model parameters for better responses',
              benefitArea: 'accuracy',
              implementationDifficulty: 'low'
            });
            break;
            
          // Transformation nodes  
          case 'data_transform':
            suggestedImprovements.push({
              nodeId: node.id,
              nodeType: node.type,
              currentConfig: node.data || {},
              suggestedChanges: {
                preserveFormatting: true,
                errorHandling: 'graceful',
                transformationCode: 'return data.map(item => ({ ...item, processed: true }));'
              },
              reason: 'Enhance data transformation robustness',
              benefitArea: 'reliability',
              implementationDifficulty: 'low'
            });
            break;
            
          case 'text_template':
            suggestedImprovements.push({
              nodeId: node.id,
              nodeType: node.type,
              currentConfig: node.data || {},
              suggestedChanges: {
                template: '{{ #if data }}\n  Result: {{ data }}\n{{ else }}\n  No data available\n{{ /if }}',
                fallbackValue: 'Error processing template'
              },
              reason: 'Add conditional logic and error handling to template',
              benefitArea: 'reliability',
              implementationDifficulty: 'low'
            });
            break;
            
          // Logic nodes  
          case 'decision':
            suggestedImprovements.push({
              nodeId: node.id,
              nodeType: node.type,
              currentConfig: node.data || {},
              suggestedChanges: {
                defaultPath: 'false',
                condition: 'value != null && value.length > 0',
                description: 'Check if value exists and is not empty'
              },
              reason: 'Improve decision logic with better condition and documentation',
              benefitArea: 'usability',
              implementationDifficulty: 'medium'
            });
            break;
            
          // Parser nodes
          case 'json_parser':
            suggestedImprovements.push({
              nodeId: node.id,
              nodeType: node.type,
              currentConfig: node.data || {},
              suggestedChanges: {
                strictMode: false,
                fallbackValue: '{}',
                errorHandling: 'graceful'
              },
              reason: 'Add error handling for malformed JSON input',
              benefitArea: 'reliability',
              implementationDifficulty: 'low'
            });
            break;
            
          case 'csv_parser':
            suggestedImprovements.push({
              nodeId: node.id,
              nodeType: node.type,
              currentConfig: node.data || {},
              suggestedChanges: {
                delimiter: ',',
                hasHeader: true,
                skipEmptyLines: true,
                trimValues: true
              },
              reason: 'Improve CSV parsing with better defaults and error handling',
              benefitArea: 'reliability',
              implementationDifficulty: 'low'
            });
            break;
          
          // Output nodes  
          case 'api_response':
            suggestedImprovements.push({
              nodeId: node.id,
              nodeType: node.type,
              currentConfig: node.data || {},
              suggestedChanges: {
                statusCode: 200,
                headers: { 'Content-Type': 'application/json' },
                formatOutput: true
              },
              reason: 'Improve API response formatting and headers',
              benefitArea: 'compatibility',
              implementationDifficulty: 'low'
            });
            break;
            
          // Default case for all other node types
          default:
            // For any other validated node type, suggest general improvements
            suggestedImprovements.push({
              nodeId: node.id,
              nodeType: node.type,
              currentConfig: node.data || {},
              suggestedChanges: {
                documentation: true,
                logging: 'detailed',
                errorHandling: 'graceful'
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
          criteriaAnalysis: criteria.map((criterion: string) => ({
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
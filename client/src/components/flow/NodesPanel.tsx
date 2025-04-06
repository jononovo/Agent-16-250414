import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Node } from '@shared/schema';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Type, 
  Sparkles, 
  Cpu, 
  MessageSquare, 
  Database, 
  BarChart,
  Webhook,
  Clock,
  Mail,
  Globe,
  Send,
  FileJson,
  CheckCheck,
  Filter,
  Repeat,
  GitBranch,
  AlertCircle,
  Search as SearchIcon
} from 'lucide-react';
import NodeItem from './NodeItem';

// Node categories based on the documentation
const NODE_CATEGORIES = [
  { id: 'ai', name: 'AI', description: 'AI model interactions, prompt engineering, and text generation' },
  { id: 'data', name: 'Data', description: 'Data visualization, transformation, and filtering' },
  { id: 'triggers', name: 'Triggers', description: 'Nodes that initiate workflows based on events or schedules' },
  { id: 'actions', name: 'Actions', description: 'Nodes that perform operations such as API requests or database queries' },
  { id: 'internal', name: 'Internal', description: 'Internal system nodes that trigger system operations' }
];

// Specialized AI node types based on the documentation and screenshot
const NODE_TYPES = [
  // AI Nodes
  { 
    id: 'text_input', 
    name: 'Text Input', 
    description: 'Add text input to your workflow',
    category: 'ai',
    icon: Type
  },
  { 
    id: 'text_prompt', 
    name: 'Text Prompt', 
    description: 'Provide text prompts to your workflow',
    category: 'ai',
    icon: MessageSquare
  },
  { 
    id: 'claude', 
    name: 'Claude API', 
    description: 'Generate content with Claude AI',
    category: 'ai',
    icon: Sparkles
  },
  {
    id: 'chat_interface',
    name: 'Chat Interface',
    description: 'Add conversational chat interface',
    category: 'ai',
    icon: MessageSquare
  },
  { 
    id: 'generate_text', 
    name: 'Generate Text', 
    description: 'Create AI-generated text with model',
    category: 'ai',
    icon: Sparkles
  },
  { 
    id: 'prompt_crafter', 
    name: 'Prompt Crafter', 
    description: 'Design templated prompts for AI',
    category: 'ai',
    icon: MessageSquare
  },
  { 
    id: 'perplexity', 
    name: 'In-house Perplexity API', 
    description: 'Search web content with Perplexity API',
    category: 'ai',
    icon: SearchIcon
  },
  { 
    id: 'ai_processing', 
    name: 'AI Processing', 
    description: 'AI-powered data processing',
    category: 'ai',
    icon: Cpu
  },
  { 
    id: 'ai_chat', 
    name: 'AI Chat', 
    description: 'Generate text with AI chat',
    category: 'ai',
    icon: MessageSquare
  },
  { 
    id: 'valid_response', 
    name: 'Response Validator', 
    description: 'Verify content meets requirements',
    category: 'ai',
    icon: CheckCheck
  },
  { 
    id: 'visualize_text', 
    name: 'Visualize Text', 
    description: 'Display text output in the workflow',
    category: 'data',
    icon: BarChart
  },
  
  // Trigger Nodes
  { 
    id: 'webhook', 
    name: 'Webhook Trigger', 
    description: 'Triggers a workflow from an HTTP request',
    category: 'triggers',
    icon: Webhook
  },
  { 
    id: 'scheduler', 
    name: 'Scheduler', 
    description: 'Runs a workflow on a schedule',
    category: 'triggers',
    icon: Clock
  },
  { 
    id: 'email_trigger', 
    name: 'Email Trigger', 
    description: 'Triggers from email events',
    category: 'triggers',
    icon: Mail
  },
  
  // Action Nodes
  { 
    id: 'http_request', 
    name: 'HTTP Request', 
    description: 'Makes API requests to external services',
    category: 'actions',
    icon: Globe
  },
  { 
    id: 'email_send', 
    name: 'Email Send', 
    description: 'Sends email messages',
    category: 'actions',
    icon: Send
  },
  { 
    id: 'database_query', 
    name: 'Database Query', 
    description: 'Performs database operations',
    category: 'actions',
    icon: Database
  },
  { 
    id: 'agent_trigger', 
    name: 'Agent Trigger', 
    description: 'Call another agent within the system',
    category: 'actions',
    icon: Cpu
  },
  { 
    id: 'workflow_trigger', 
    name: 'Workflow Trigger', 
    description: 'Call another workflow within the system',
    category: 'actions',
    icon: GitBranch
  },
  { 
    id: 'response_message', 
    name: 'Response Message', 
    description: 'Display conditional success/error messages',
    category: 'actions',
    icon: AlertCircle
  },
  
  // Data Nodes
  {
    id: 'transform',
    name: 'Transform',
    description: 'Transform data between nodes',
    category: 'data',
    icon: Repeat
  },
  { 
    id: 'data_transform', 
    name: 'Data Transform', 
    description: 'Transforms data structure',
    category: 'data',
    icon: Repeat
  },
  { 
    id: 'filter', 
    name: 'Filter', 
    description: 'Filters data based on conditions',
    category: 'data',
    icon: Filter
  },
  
  // Internal Nodes
  {
    id: 'internal_new_agent',
    name: 'New Agent Trigger',
    description: 'Triggers the creation of a new agent from UI interaction',
    category: 'internal',
    icon: 'plus-circle',
    configuration: {
      agent_id: 13,
      workflow_id: 16
    }
  },
  {
    id: 'internal_ai_chat_agent',
    name: 'AI Chat Agent Trigger',
    description: 'Triggers the creation of a new agent from chat instruction',
    category: 'internal',
    icon: 'message-circle',
    configuration: {
      agent_id: 13,
      workflow_id: 16
    }
  },
  {
    id: 'internal',
    name: 'Internal Action',
    description: 'Performs internal system actions',
    category: 'internal',
    icon: 'cog',
    configuration: {
      action_type: 'create_agent'
    }
  },
  // Additional internal nodes can be added here
];

const NodesPanel = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  
  const { data: nodes, isLoading } = useQuery({
    queryKey: ['/api/nodes'],
    queryFn: async () => {
      const res = await fetch('/api/nodes');
      if (!res.ok) throw new Error('Failed to fetch nodes');
      return res.json() as Promise<Node[]>;
    }
  });
  
  // Create nodes from NODE_TYPES if nodes aren't loaded yet
  const nodeItems = isLoading ? [] : NODE_TYPES.map((type, index) => ({
    id: index,
    name: type.name,
    type: type.id,
    description: type.description,
    icon: type.icon, // Use the icon component directly
    createdAt: new Date(),
    updatedAt: new Date(),
    userId: null,
    category: type.category,
    configuration: type.configuration || {}
  } as Node));
  
  const filteredNodes = nodeItems.filter(node => {
    // First apply category filter if not "all"
    if (activeTab !== 'all' && node.category !== activeTab) {
      return false;
    }
    
    // Then apply search filter if there's a query
    if (searchQuery) {
      return (
        node.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (node.description && node.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    return true;
  });

  // Group nodes by category
  const groupedNodes = filteredNodes.reduce((acc, node) => {
    const category = node.category || 'custom';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(node);
    return acc;
  }, {} as Record<string, Node[]>);

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-lg font-semibold mb-4">Nodes</h2>
      
      <div className="relative mb-4">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search nodes..."
          className="pl-8"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      
      <Tabs defaultValue="ai" className="mb-4" onValueChange={setActiveTab}>
        <div className="overflow-auto scrollbar-none">
          <TabsList className="w-auto inline-flex">
            <TabsTrigger value="all" className="px-4">All</TabsTrigger>
            <TabsTrigger value="ai" className="px-4">AI</TabsTrigger>
            <TabsTrigger value="data" className="px-4">Data</TabsTrigger>
            <TabsTrigger value="triggers" className="px-4">Triggers</TabsTrigger>
            <TabsTrigger value="actions" className="px-4">Actions</TabsTrigger>
            <TabsTrigger value="internal" className="px-4">Internal</TabsTrigger>
          </TabsList>
        </div>
      </Tabs>

      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Loading nodes...
          </div>
        ) : (
          <>
            {NODE_CATEGORIES.map((category) => {
              // Get nodes for this category
              const categoryNodes = groupedNodes?.[category.id] || [];
              
              // Skip if we're filtering by category and this isn't the selected one
              if (activeTab !== 'all' && activeTab !== category.id) {
                return null;
              }
              
              // Skip empty categories when showing all
              if (categoryNodes.length === 0 && activeTab === 'all') {
                return null;
              }
              
              return (
                <Accordion
                  key={category.id}
                  type="single"
                  collapsible
                  defaultValue={category.id}
                  className="mb-4"
                >
                  <AccordionItem value={category.id} className="border-0">
                    <AccordionTrigger className="py-2 text-sm font-medium">
                      {category.name} ({categoryNodes.length})
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2">
                        {categoryNodes.map((node) => (
                          <NodeItem 
                            key={node.id} 
                            node={{
                              ...node,
                              data: {
                                label: node.name,
                                description: node.description || '',
                                icon: node.icon || 'circle',
                                configuration: node.configuration || {},
                                category: node.category
                              }
                            }} 
                          />
                        ))}
                        
                        {categoryNodes.length === 0 && (
                          <div className="p-2 text-center text-sm text-muted-foreground">
                            No {category.name.toLowerCase()} nodes found
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              );
            })}
            
            {filteredNodes?.length === 0 && (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No nodes found for "{searchQuery}"
              </div>
            )}
          </>
        )}
      </ScrollArea>
    </div>
  );
};

export default NodesPanel;
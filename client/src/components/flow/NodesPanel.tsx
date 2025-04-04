import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Node } from '@shared/schema';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import NodeItem from './NodeItem';

// Node categories based on the documentation
const NODE_CATEGORIES = [
  { id: 'ai', name: 'AI', description: 'AI model interactions, prompt engineering, and text generation' },
  { id: 'data', name: 'Data', description: 'Data visualization, transformation, and filtering' },
  { id: 'triggers', name: 'Triggers', description: 'Nodes that initiate workflows based on events or schedules' },
  { id: 'actions', name: 'Actions', description: 'Nodes that perform operations such as API requests or database queries' }
];

// Specialized AI node types based on the documentation
const NODE_TYPES = [
  // AI Nodes
  { id: 'text_input', name: 'Text Input', description: 'Provides static text input to the workflow', category: 'ai' },
  { id: 'generate_text', name: 'Generate Text', description: 'Creates AI-generated text using various models', category: 'ai' },
  { id: 'prompt_crafter', name: 'Prompt Crafter', description: 'Designs templated prompts with variables', category: 'ai' },
  { id: 'visualize_text', name: 'Visualize Text', description: 'Displays text output in the workflow', category: 'data' },
  
  // Trigger Nodes
  { id: 'webhook', name: 'Webhook Trigger', description: 'Triggers a workflow from an HTTP request', category: 'triggers' },
  { id: 'scheduler', name: 'Scheduler', description: 'Runs a workflow on a schedule', category: 'triggers' },
  { id: 'email_trigger', name: 'Email Trigger', description: 'Triggers from email events', category: 'triggers' },
  
  // Action Nodes
  { id: 'http_request', name: 'HTTP Request', description: 'Makes API requests to external services', category: 'actions' },
  { id: 'email_send', name: 'Email Send', description: 'Sends email messages', category: 'actions' },
  { id: 'database_query', name: 'Database Query', description: 'Performs database operations', category: 'actions' },
  
  // Data Nodes
  { id: 'data_transform', name: 'Data Transform', description: 'Transforms data structure', category: 'data' },
  { id: 'filter', name: 'Filter', description: 'Filters data based on conditions', category: 'data' }
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
    icon: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    userId: null,
    category: type.category,
    configuration: {}
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
        <TabsList className="w-full">
          <TabsTrigger value="all" className="flex-1">All</TabsTrigger>
          <TabsTrigger value="ai" className="flex-1">AI</TabsTrigger>
          <TabsTrigger value="data" className="flex-1">Data</TabsTrigger>
          <TabsTrigger value="triggers" className="flex-1">Triggers</TabsTrigger>
          <TabsTrigger value="actions" className="flex-1">Actions</TabsTrigger>
        </TabsList>
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
                                icon: node.icon || 'circle'
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
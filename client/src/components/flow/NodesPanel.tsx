import { useState, useEffect } from 'react';
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
  Search as SearchIcon,
  Hash,
  ToggleLeft,
  CheckSquare,
  Table,
  FileText
} from 'lucide-react';
import NodeItem from './NodeItem';
import { FOLDER_BASED_NODE_TYPES, SYSTEM_NODE_TYPES, CUSTOM_NODE_TYPES } from '@/lib/nodeValidator';

// Node categories based on the documentation
const NODE_CATEGORIES = [
  { id: 'ai', name: 'AI', description: 'AI model interactions, prompt engineering, and text generation' },
  { id: 'data', name: 'Data', description: 'Data visualization, transformation, and filtering' },
  { id: 'input', name: 'Input', description: 'Basic input nodes for data entry and user interactions' },
  { id: 'content', name: 'Content', description: 'Content creation, formatting, and rendering' },
  { id: 'code', name: 'Code', description: 'Custom code and function execution' },
  { id: 'triggers', name: 'Triggers', description: 'Nodes that initiate workflows based on events or schedules' },
  { id: 'actions', name: 'Actions', description: 'Nodes that perform operations such as API requests or database queries' },
  { id: 'internal', name: 'Internal', description: 'Internal system nodes that trigger system operations' }
];

// Node types from nodeValidator for a single source of truth
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
    id: 'claude', 
    name: 'Claude API', 
    description: 'Generate content with Claude AI',
    category: 'ai',
    icon: Sparkles
  },
  { 
    id: 'http_request', 
    name: 'HTTP Request', 
    description: 'Makes API requests to external services',
    category: 'actions',
    icon: Globe
  },
  { 
    id: 'data_transform', 
    name: 'Data Transform', 
    description: 'Transforms data structure',
    category: 'data',
    icon: Repeat
  },
  { 
    id: 'text_formatter', 
    name: 'Text Formatter', 
    description: 'Formats text with various transformations',
    category: 'data',
    icon: Type
  },
  { 
    id: 'json_schema_validator', 
    name: 'JSON Schema Validator', 
    description: 'Validates JSON data against a schema',
    category: 'data',
    icon: CheckSquare
  },
  { 
    id: 'csv_processor', 
    name: 'CSV Processor', 
    description: 'Processes CSV data with column mapping and filtering',
    category: 'data',
    icon: Table
  },
  { 
    id: 'number_input', 
    name: 'Number Input', 
    description: 'Provides numeric input with slider visualization',
    category: 'input',
    icon: Hash
  },
  { 
    id: 'toggle_switch', 
    name: 'Toggle Switch', 
    description: 'A simple boolean toggle switch',
    category: 'input',
    icon: ToggleLeft
  },
  { 
    id: 'markdown_renderer', 
    name: 'Markdown Renderer', 
    description: 'Renders markdown text with live preview',
    category: 'content',
    icon: FileText
  }
  // Additional nodes will be loaded dynamically from the System and Custom directories
];

const NodesPanel = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  
  // Load both legacy nodes from the API and our new folder-based nodes
  const { data: dbNodes, isLoading: isLoadingDb } = useQuery({
    queryKey: ['/api/nodes'],
    queryFn: async () => {
      const res = await fetch('/api/nodes');
      if (!res.ok) throw new Error('Failed to fetch nodes');
      return res.json() as Promise<Node[]>;
    }
  });
  
  // Use the static node type definitions for our folder-based system
  const [folderBasedNodes, setFolderBasedNodes] = useState<Node[]>([]);
  
  useEffect(() => {
    // Create nodes from our static NODE_TYPES array
    // These match the folder-based nodes we have implemented
    const typesToUse = NODE_TYPES.filter(nodeType => {
      // Only include node types that we know are implemented in the folder-based system
      // First wave of implementations
      const implementedNodeTypes = [
        'text_input', 'claude', 'http_request', 'text_template', 
        'data_transform', 'decision', 'function', 'json_path',
        // New custom nodes
        'text_formatter', 'number_input', 'toggle_switch',
        'json_schema_validator', 'csv_processor', 'markdown_renderer'
      ];
      return implementedNodeTypes.includes(nodeType.id);
    });
    
    const nodes = typesToUse.map((nodeType, index) => {
      return {
        id: 1000 + index, // Use a different ID range to avoid conflicts
        name: nodeType.name,
        type: nodeType.id,
        description: nodeType.description,
        icon: nodeType.icon,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: null,
        category: nodeType.category,
        configuration: {}
      } as Node;
    });
    
    setFolderBasedNodes(nodes);
  }, []);
  
  // Debug: Log folder-based nodes
  useEffect(() => {
    if (folderBasedNodes.length > 0) {
      console.log("Folder-based nodes:", folderBasedNodes.map((node: Node) => `${node.name} (${node.type})`));
    }
  }, [folderBasedNodes]);
  
  // Use only folder-based nodes
  const nodeItems = folderBasedNodes;
  
  const filteredNodes = nodeItems.filter((node: Node) => {
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
  const groupedNodes = filteredNodes.reduce<Record<string, Node[]>>((acc, node) => {
    const category = node.category || 'custom';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(node);
    return acc;
  }, {});
  
  // Debug: Log all nodes in each category
  useEffect(() => {
    if (Object.keys(groupedNodes).length > 0) {
      console.log("Grouped nodes by category:", 
        Object.fromEntries(
          Object.entries(groupedNodes).map(
            ([category, nodesArray]) => [category, nodesArray.map((node: Node) => `${node.name} (${node.type})`)]
          )
        )
      );
    }
  }, [groupedNodes]);

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
      
      <Tabs defaultValue="all" className="mb-4" onValueChange={setActiveTab}>
        <div className="overflow-auto scrollbar-none">
          <TabsList className="w-auto inline-flex">
            <TabsTrigger value="all" className="px-4">All</TabsTrigger>
            <TabsTrigger value="ai" className="px-4">AI</TabsTrigger>
            <TabsTrigger value="input" className="px-4">Input</TabsTrigger>
            <TabsTrigger value="data" className="px-4">Data</TabsTrigger>
            <TabsTrigger value="content" className="px-4">Content</TabsTrigger>
            <TabsTrigger value="code" className="px-4">Code</TabsTrigger>
            <TabsTrigger value="triggers" className="px-4">Triggers</TabsTrigger>
            <TabsTrigger value="actions" className="px-4">Actions</TabsTrigger>
            <TabsTrigger value="internal" className="px-4">Internal</TabsTrigger>
          </TabsList>
        </div>
      </Tabs>

      <ScrollArea className="flex-1">
        {isLoadingDb ? (
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
                              type: node.type,
                              name: node.name,
                              description: node.description === undefined ? null : node.description,
                              icon: node.icon || 'circle',
                              category: node.category,
                              data: {
                                label: node.name,
                                description: node.description || '',
                                icon: node.icon || 'circle',
                                configuration: node.configuration || {},
                                category: node.category,
                                defaultData: {}
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
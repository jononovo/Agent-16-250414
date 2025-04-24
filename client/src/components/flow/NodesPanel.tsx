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
  FileText,
  Code,
  Box
} from 'lucide-react';
import NodeItem from './NodeItem';
import { getAllNodeTypes } from '@/lib/nodeRegistry';

// Node categories based on the documentation
const NODE_CATEGORIES = [
  { id: 'ai', name: 'AI', description: 'AI model interactions, prompt engineering, and text generation' },
  { id: 'data', name: 'Data', description: 'Data visualization, transformation, and filtering' },
  { id: 'input', name: 'Input', description: 'Basic input nodes for data entry and user interactions' },
  { id: 'content', name: 'Content', description: 'Content creation, formatting, and rendering' },
  { id: 'code', name: 'Code', description: 'Custom code and function execution' },
  { id: 'actions', name: 'Actions', description: 'Nodes that perform operations and trigger workflows based on events' },
  { id: 'internal', name: 'Internal', description: 'Internal system nodes that trigger system operations' }
];

// Map of icon names to Lucide components for dynamic node icons
// This helps resolve node icons that come from the filesystem
const ICON_MAP: Record<string, any> = {
  'Type': Type,
  'Sparkles': Sparkles,
  'Globe': Globe,
  'Repeat': Repeat,
  'Hash': Hash,
  'ToggleLeft': ToggleLeft,
  'CheckSquare': CheckSquare,
  'Table': Table,
  'FileText': FileText,
  'Code': Code,
  'Webhook': Webhook,
  'Send': Send,
  'Database': Database,
  'MessageSquare': MessageSquare,
  'BarChart': BarChart,
  'Clock': Clock,
  'Mail': Mail,
  'FileJson': FileJson,
  'CheckCheck': CheckCheck,
  'Filter': Filter,
  'GitBranch': GitBranch,
  'AlertCircle': AlertCircle,
  'Box': Box
};

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
  
  // Use nodes from the central registry
  const [folderBasedNodes, setFolderBasedNodes] = useState<Node[]>([]);
  
  useEffect(() => {
    // Get all node types from the central registry
    const registryNodes = getAllNodeTypes().map((nodeInfo, index) => {
      // Resolve icon: either use the component directly if it's already a component,
      // or try to find it in the icon map if it's a string
      let resolvedIcon = nodeInfo.icon;
      if (typeof nodeInfo.icon === 'string' && ICON_MAP[nodeInfo.icon]) {
        resolvedIcon = ICON_MAP[nodeInfo.icon];
      } else if (!nodeInfo.icon) {
        // Default icon if none specified
        resolvedIcon = Box;
      }
      
      return {
        id: 1000 + index, // Use a different ID range to avoid conflicts
        name: nodeInfo.name,
        type: nodeInfo.id,
        description: nodeInfo.description,
        icon: resolvedIcon,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: null,
        category: nodeInfo.category,
        configuration: {}
      } as Node;
    });
    
    setFolderBasedNodes(registryNodes);
    console.log(`Loaded ${registryNodes.length} nodes from registry`);
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
    <div className="flex flex-col w-full">
      <h2 className="text-lg font-semibold mb-3">Nodes</h2>
      
      <div className="relative mb-3 w-full">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search nodes..."
          className="pl-8 w-full"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      
      <Tabs defaultValue="all" className="mb-3" onValueChange={setActiveTab}>
        <div className="overflow-auto scrollbar-none w-full">
          <TabsList className="w-auto inline-flex">
            <TabsTrigger value="all" className="px-4">All</TabsTrigger>
            <TabsTrigger value="ai" className="px-4">AI</TabsTrigger>
            <TabsTrigger value="input" className="px-4">Input</TabsTrigger>
            <TabsTrigger value="data" className="px-4">Data</TabsTrigger>
            <TabsTrigger value="content" className="px-4">Content</TabsTrigger>
            <TabsTrigger value="code" className="px-4">Code</TabsTrigger>
            <TabsTrigger value="actions" className="px-4">Actions</TabsTrigger>
            <TabsTrigger value="internal" className="px-4">Internal</TabsTrigger>
          </TabsList>
        </div>
      </Tabs>

      <div className="h-[calc(100vh-220px)] overflow-auto w-full pr-0 nodes-scroll-container">
        {isLoadingDb ? (
          <div className="p-2 text-center text-sm text-muted-foreground">
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
                  className="mb-3 w-full"
                >
                  <AccordionItem value={category.id} className="border-0">
                    <AccordionTrigger className="py-2 text-sm font-medium w-full">
                      {category.name} ({categoryNodes.length})
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2 w-full">
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
            
            {filteredNodes?.length === 0 && searchQuery && (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No nodes found for "{searchQuery}"
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default NodesPanel;
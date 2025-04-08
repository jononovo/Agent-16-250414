import { Link, useLocation } from "wouter";
import { User, Settings, HelpCircle, Bot, Home, GitBranch, Puzzle, Link2, Braces, TestTube, Code, Library, Wand2 } from "lucide-react";

export interface SidebarProps {
  collapsed?: boolean;
}

const Sidebar = ({ collapsed = false }: SidebarProps) => {
  const [location] = useLocation();

  // Define navigation items
  const workspaceItems = [
    { path: "/", icon: <Home className="h-4 w-4" />, label: "Builder" },
    { path: "/playground", icon: <Settings className="h-4 w-4" />, label: "Playground" },
    { path: "/settings", icon: <Settings className="h-4 w-4" />, label: "Settings" }
  ];

  const libraryItems = [
    { path: "/library", icon: <Library className="h-4 w-4" />, label: "All Resources" },
    { path: "/agents", icon: <Bot className="h-4 w-4" />, label: "Agents" },
    { path: "/workflows", icon: <GitBranch className="h-4 w-4" />, label: "Workflows" },
    { path: "/nodes", icon: <Puzzle className="h-4 w-4" />, label: "Nodes" }
  ];
  
  const advancedItems = [
    { path: "/workflow-generator", icon: <Wand2 className="h-4 w-4" />, label: "Generate Workflow" },
    { path: "/workflow-test", icon: <TestTube className="h-4 w-4" />, label: "Test Bench" },
    { path: "/api-registry", icon: <Code className="h-4 w-4" />, label: "API Registry" }
  ];

  // Helper function to render navigation items
  const renderNavItems = (items: Array<{ path: string; icon: JSX.Element; label: string }>) => {
    return items.map((item, index) => (
      <Link key={index} href={item.path}>
        <div className={`flex items-center space-x-3 px-3 py-2 rounded-md cursor-pointer ${location === item.path ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}>
          {item.icon}
          {!collapsed && <span>{item.label}</span>}
        </div>
      </Link>
    ));
  };

  return (
    <div className={`${collapsed ? 'w-16' : 'w-64'} flex-shrink-0 bg-slate-900 text-white transition-all duration-300`}>
      <div className="p-4 flex flex-col h-full">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
              <Bot className="h-5 w-5 text-white" />
            </div>
            {!collapsed && <h1 className="font-bold text-xl">Agent Builder</h1>}
          </div>
        </div>
        
        <nav className="space-y-6 flex-grow">
          <div>
            <div className={`flex items-center text-sm text-slate-400 font-medium mb-2 px-3 ${collapsed ? 'hidden' : 'flex'}`}>
              <span>WORKSPACE</span>
            </div>
            <div className="space-y-1">
              {renderNavItems(workspaceItems)}
            </div>
          </div>
          
          <div>
            <div className={`flex items-center text-sm text-slate-400 font-medium mb-2 px-3 ${collapsed ? 'hidden' : 'flex'}`}>
              <span>LIBRARY</span>
            </div>
            <div className="space-y-1">
              {renderNavItems(libraryItems)}
            </div>
          </div>
          
          <div>
            <div className={`flex items-center text-sm text-slate-400 font-medium mb-2 px-3 ${collapsed ? 'hidden' : 'flex'}`}>
              <span>ADVANCED</span>
            </div>
            <div className="space-y-1">
              {renderNavItems(advancedItems)}
            </div>
          </div>
        </nav>
        
        <div className="mt-auto">
          <Link href="/help">
            <div className={`flex items-center space-x-3 px-3 py-2 rounded-md cursor-pointer ${location === '/help' ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}>
              <HelpCircle className="h-4 w-4" />
              {!collapsed && <span>Help & Resources</span>}
            </div>
          </Link>
          <div className="flex items-center space-x-3 px-3 py-2 mt-2">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-white">
              <User className="h-4 w-4" />
            </div>
            {!collapsed && (
              <div className="text-sm">
                <div className="font-medium">John Smith</div>
                <div className="text-slate-400 text-xs">john@example.com</div>
              </div>
            )}
          </div>
          {/* User profile section */}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
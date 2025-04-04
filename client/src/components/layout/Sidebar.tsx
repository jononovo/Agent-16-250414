import { Link, useLocation } from "wouter";
import { ModeToggle } from "../ui/mode-toggle";
import { User, Settings, HelpCircle, Bot, Home, GitBranch, Puzzle } from "lucide-react";

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
    { path: "/agents", icon: <Bot className="h-4 w-4" />, label: "Agents" },
    { path: "/workflows", icon: <GitBranch className="h-4 w-4" />, label: "Workflows" },
    { path: "/nodes", icon: <Puzzle className="h-4 w-4" />, label: "Nodes" }
  ];

  // Helper function to render navigation items
  const renderNavItems = (items: Array<{ path: string; icon: JSX.Element; label: string }>) => {
    return items.map((item, index) => (
      <Link key={index} href={item.path}>
        <a className={`flex items-center space-x-3 px-3 py-2 rounded-md cursor-pointer ${location === item.path ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}>
          {item.icon}
          {!collapsed && <span>{item.label}</span>}
        </a>
      </Link>
    ));
  };

  return (
    <div className={`${collapsed ? 'w-16' : 'w-64'} flex-shrink-0 bg-slate-900 text-white transition-all duration-300 dark:bg-slate-950`}>
      <div className="p-4 flex flex-col h-full">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
              <Bot className="h-5 w-5 text-white" />
            </div>
            {!collapsed && <h1 className="font-bold text-xl">Agent Builder</h1>}
          </div>
          {!collapsed && <ModeToggle />}
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
        </nav>
        
        <div className="mt-auto">
          <Link href="/help">
            <a className={`flex items-center space-x-3 px-3 py-2 rounded-md cursor-pointer ${location === '/help' ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}>
              <HelpCircle className="h-4 w-4" />
              {!collapsed && <span>Help & Resources</span>}
            </a>
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
          {collapsed && (
            <div className="mt-3 flex justify-center">
              <ModeToggle />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
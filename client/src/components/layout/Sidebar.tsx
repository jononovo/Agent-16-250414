import { Link, useLocation } from "wouter";

export interface SidebarProps {
  collapsed?: boolean;
}

const Sidebar = ({ collapsed = false }: SidebarProps) => {
  const [location] = useLocation();

  return (
    <div className={`${collapsed ? 'w-16' : 'w-64'} flex-shrink-0 bg-slate-900 text-white transition-all duration-300`}>
      <div className="p-4 flex flex-col h-full">
        <div className="flex items-center justify-center md:justify-start space-x-3 mb-8">
          <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
            <i className="fas fa-robot text-white"></i>
          </div>
          {!collapsed && <h1 className="font-bold text-xl">Agent Builder</h1>}
        </div>
        
        <nav className="space-y-6 flex-grow">
          <div>
            <div className={`flex items-center text-sm text-slate-400 font-medium mb-2 px-3 ${collapsed ? 'hidden' : 'flex'}`}>
              <span>WORKSPACE</span>
            </div>
            <div className="space-y-1">
              <Link href="/">
                <a className={`flex items-center space-x-3 px-3 py-2 rounded-md ${location === '/' ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}>
                  <i className="fas fa-cube"></i>
                  {!collapsed && <span>Builder</span>}
                </a>
              </Link>
              <Link href="/playground">
                <a className={`flex items-center space-x-3 px-3 py-2 rounded-md ${location === '/playground' ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}>
                  <i className="fas fa-play"></i>
                  {!collapsed && <span>Playground</span>}
                </a>
              </Link>
              <Link href="/settings">
                <a className={`flex items-center space-x-3 px-3 py-2 rounded-md ${location === '/settings' ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}>
                  <i className="fas fa-cog"></i>
                  {!collapsed && <span>Settings</span>}
                </a>
              </Link>
            </div>
          </div>
          
          <div>
            <div className={`flex items-center text-sm text-slate-400 font-medium mb-2 px-3 ${collapsed ? 'hidden' : 'flex'}`}>
              <span>LIBRARY</span>
            </div>
            <div className="space-y-1">
              <Link href="/agents">
                <a className={`flex items-center space-x-3 px-3 py-2 rounded-md ${location === '/agents' ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}>
                  <i className="fas fa-robot"></i>
                  {!collapsed && <span>Agents</span>}
                </a>
              </Link>
              <Link href="/workflows">
                <a className={`flex items-center space-x-3 px-3 py-2 rounded-md ${location === '/workflows' ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}>
                  <i className="fas fa-sitemap"></i>
                  {!collapsed && <span>Workflows</span>}
                </a>
              </Link>
              <Link href="/nodes">
                <a className={`flex items-center space-x-3 px-3 py-2 rounded-md ${location === '/nodes' ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}>
                  <i className="fas fa-puzzle-piece"></i>
                  {!collapsed && <span>Nodes</span>}
                </a>
              </Link>
            </div>
          </div>
        </nav>
        
        <div className="mt-auto">
          <div className="flex items-center space-x-3 px-3 py-2 rounded-md text-slate-300 hover:bg-slate-800 hover:text-white">
            <i className="fas fa-question-circle"></i>
            {!collapsed && <span>Help & Resources</span>}
          </div>
          <div className="flex items-center space-x-3 px-3 py-2 mt-2">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-white">
              <span className="text-xs">JS</span>
            </div>
            {!collapsed && (
              <div className="text-sm">
                <div className="font-medium">John Smith</div>
                <div className="text-slate-400 text-xs">john@example.com</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;

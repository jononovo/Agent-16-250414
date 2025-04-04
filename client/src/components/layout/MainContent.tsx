import { ReactNode } from 'react';
import { useBuilderContext } from '@/contexts/BuilderContext';

interface MainContentProps {
  children: ReactNode;
}

const MainContent = ({ children }: MainContentProps) => {
  const { activeTab } = useBuilderContext();
  
  const getPageTitle = () => {
    switch (activeTab) {
      case 'agents':
        return 'Build a New Agent';
      case 'workflows':
        return 'Build a New Workflow';
      case 'nodes':
        return 'Build a New Node';
      default:
        return 'Build a New Component';
    }
  };

  return (
    <div className="flex-grow overflow-y-auto">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">{getPageTitle()}</h1>
          <div className="flex items-center space-x-4">
            <button className="px-4 py-2 bg-white text-slate-600 border border-slate-200 rounded-md hover:bg-slate-50 flex items-center space-x-2 text-sm">
              <i className="fas fa-save"></i>
              <span>Save</span>
            </button>
            <button className="px-4 py-2 bg-primary text-white rounded-md hover:bg-indigo-700 flex items-center space-x-2 text-sm">
              <i className="fas fa-play"></i>
              <span>Deploy</span>
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
};

export default MainContent;

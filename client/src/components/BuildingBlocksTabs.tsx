import { useBuilderContext } from '@/contexts/BuilderContext';

const BuildingBlocksTabs = () => {
  const { activeTab, setActiveTab } = useBuilderContext();

  return (
    <div className="mb-6">
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button 
            className={`font-medium py-4 px-1 border-b-2 whitespace-nowrap ${
              activeTab === 'agents' 
                ? 'border-primary text-primary' 
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
            onClick={() => setActiveTab('agents')}
            aria-current={activeTab === 'agents' ? 'page' : undefined}
          >
            Agents
          </button>
          <button 
            className={`font-medium py-4 px-1 border-b-2 whitespace-nowrap ${
              activeTab === 'workflows' 
                ? 'border-primary text-primary' 
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
            onClick={() => setActiveTab('workflows')}
            aria-current={activeTab === 'workflows' ? 'page' : undefined}
          >
            Workflows
          </button>
          <button 
            className={`font-medium py-4 px-1 border-b-2 whitespace-nowrap ${
              activeTab === 'nodes' 
                ? 'border-primary text-primary' 
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
            onClick={() => setActiveTab('nodes')}
            aria-current={activeTab === 'nodes' ? 'page' : undefined}
          >
            Nodes
          </button>
        </nav>
      </div>
    </div>
  );
};

export default BuildingBlocksTabs;

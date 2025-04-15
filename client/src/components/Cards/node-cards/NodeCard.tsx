import { Node } from '@shared/schema';
import { NodeCategory } from '@/lib/types';

interface NodeCardProps {
  node: Node | NodeCategory;
  isCategory?: boolean;
}

const NodeCard = ({ node, isCategory = false }: NodeCardProps) => {
  // Determine the background color based on node type
  const getBgColor = () => {
    if (node.name.includes('Filter') || node.name.includes('Data')) return 'bg-blue-100 text-blue-600';
    if (node.name.includes('Text') || node.name.includes('Translator')) return 'bg-green-100 text-green-600';
    if (node.name.includes('Merger')) return 'bg-purple-100 text-purple-600';
    if (node.name.includes('CSV') || node.name.includes('Parser')) return 'bg-red-100 text-red-600';
    if (node.name.includes('Interface')) return 'bg-indigo-100 text-indigo-600';
    if (node.name.includes('Workflow')) return 'bg-cyan-100 text-cyan-600';
    if (node.name.includes('Integration')) return 'bg-emerald-100 text-emerald-600';
    return 'bg-slate-100 text-slate-600';
  };

  if (isCategory) {
    // This represents a node category like Interface Nodes, Workflow Nodes, etc.
    const category = node as NodeCategory;
    return (
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden">
        <div className="p-4">
          <div className="flex items-center mb-3">
            <div className={`w-8 h-8 rounded-full ${getBgColor()} flex items-center justify-center`}>
              <i className={`fas fa-${node.icon || 'code'}`}></i>
            </div>
            <h3 className="ml-2 font-medium">{node.name}</h3>
          </div>
          <p className="text-sm text-slate-600 mb-3">
            {node.description}
          </p>
          <div className="flex flex-wrap gap-2">
            {node.name.includes('Interface') && (
              <>
                <span className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded-md">API</span>
                <span className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded-md">Form</span>
                <span className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded-md">Webhook</span>
                <span className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded-md">+5 more</span>
              </>
            )}
            {node.name.includes('Workflow') && (
              <>
                <span className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded-md">If/Else</span>
                <span className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded-md">Switch</span>
                <span className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded-md">Loop</span>
                <span className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded-md">+7 more</span>
              </>
            )}
            {node.name.includes('Integration') && (
              <>
                <span className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded-md">Google</span>
                <span className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded-md">Slack</span>
                <span className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded-md">Stripe</span>
                <span className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded-md">+20 more</span>
              </>
            )}
          </div>
        </div>
        <div className="bg-slate-50 px-4 py-3 flex justify-between border-t border-slate-200">
          <span className="text-xs text-slate-500">{category.nodeCount} nodes</span>
          <button className="text-xs text-primary hover:text-indigo-700">Browse All</button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden">
      <div className="p-4">
        <div className="flex items-center mb-3">
          <div className={`w-8 h-8 rounded-full ${getBgColor()} flex items-center justify-center`}>
            <i className={`fas fa-${node.icon || 'puzzle-piece'}`}></i>
          </div>
          <h3 className="ml-2 font-medium">{node.name}</h3>
        </div>
        <p className="text-xs text-slate-600 mb-3">
          {node.description}
        </p>
        <div className="flex items-center text-xs text-slate-500">
          <span className="flex items-center">
            <i className="fas fa-cube mr-1"></i> 
            {isCategory ? 'Category' : 'type' in node ? node.type : 'Custom'}
          </span>
        </div>
      </div>
      <div className="bg-slate-50 px-4 py-2 flex justify-between border-t border-slate-200">
        <button className="text-xs text-primary hover:text-indigo-700">Edit</button>
      </div>
    </div>
  );
};

export default NodeCard;
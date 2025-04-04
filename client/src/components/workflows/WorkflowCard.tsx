import { Workflow } from '@shared/schema';

interface WorkflowCardProps {
  workflow: Workflow;
  isPlaceholder?: boolean;
  onClick?: () => void;
}

const WorkflowCard = ({ workflow, isPlaceholder = false, onClick }: WorkflowCardProps) => {
  if (isPlaceholder) {
    return (
      <div 
        onClick={onClick}
        className="bg-slate-50 rounded-lg border border-dashed border-slate-300 hover:border-primary hover:bg-slate-100 transition-all overflow-hidden flex flex-col items-center justify-center p-6 h-[194px] cursor-pointer"
      >
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
          <i className="fas fa-plus"></i>
        </div>
        <p className="text-sm text-slate-600 text-center mb-2">Create a new workflow from scratch</p>
        <button className="text-xs text-primary hover:text-indigo-700">Get Started</button>
      </div>
    );
  }

  // Determine the background color based on workflow type
  const getBgColor = () => {
    if (workflow.name.includes('Data')) return 'bg-cyan-100 text-cyan-600';
    if (workflow.name.includes('Content')) return 'bg-orange-100 text-orange-600';
    if (workflow.name.includes('Lead')) return 'bg-blue-100 text-blue-600';
    if (workflow.name.includes('Alert')) return 'bg-pink-100 text-pink-600';
    if (workflow.name.includes('Translation')) return 'bg-amber-100 text-amber-600';
    return 'bg-slate-100 text-slate-600';
  };

  // Format the date for display
  const formatDate = (date: Date | null | undefined) => {
    if (!date) return '';
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return new Date(date).toLocaleDateString();
  };

  // Get appropriate status icon
  const getStatusIcon = () => {
    switch (workflow.status) {
      case 'active':
        return <i className="fas fa-check-circle mr-1 text-success"></i>;
      case 'draft':
        return <i className="fas fa-edit mr-1 text-slate-400"></i>;
      default:
        return <i className="fas fa-circle mr-1 text-slate-400"></i>;
    }
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden">
      <div className="p-4">
        <div className="flex items-center mb-3">
          <div className={`w-8 h-8 rounded-full ${getBgColor()} flex items-center justify-center`}>
            <i className={`fas fa-${workflow.icon || 'sitemap'}`}></i>
          </div>
          <h3 className="ml-2 font-medium">{workflow.name}</h3>
        </div>
        <p className="text-sm text-slate-600 mb-3">
          {workflow.description}
        </p>
        <div className="flex items-center text-xs text-slate-500">
          {workflow.type === 'template' ? (
            <>
              <span className="flex items-center">
                <i className="fas fa-user mr-1"></i> {workflow.userId === 0 ? 'Official' : 'Community'}
              </span>
              <span className="mx-2">•</span>
              <span className="flex items-center">
                <i className="fas fa-download mr-1"></i> {Math.floor(Math.random() * 900) + 100} uses
              </span>
            </>
          ) : (
            <>
              <span className="flex items-center">
                <i className="fas fa-calendar-alt mr-1"></i> Updated {formatDate(workflow.updatedAt)}
              </span>
              <span className="mx-2">•</span>
              <span className="flex items-center">
                {getStatusIcon()} {workflow.status === 'active' ? 'Active' : 'Draft'}
              </span>
            </>
          )}
        </div>
      </div>
      <div className="bg-slate-50 px-4 py-3 flex justify-between border-t border-slate-200">
        <button className="text-xs text-slate-600 hover:text-primary">View Details</button>
        {workflow.type === 'template' ? (
          <button className="text-xs text-primary hover:text-indigo-700">Use Template</button>
        ) : (
          <button className="text-xs text-primary hover:text-indigo-700">Edit</button>
        )}
      </div>
    </div>
  );
};

export default WorkflowCard;

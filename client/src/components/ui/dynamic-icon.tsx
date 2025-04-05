import React from 'react';
import * as LucideIcons from 'lucide-react';
import { Bot, Code, FileText, Database, Settings, Cpu, Workflow, Zap } from 'lucide-react';

interface DynamicIconProps {
  icon: string;
  size?: number;
  className?: string;
  strokeWidth?: number;
}

// Map of icon names to Lucide components
const iconMap: Record<string, React.ComponentType<any>> = {
  'Bot': Bot,
  'Code': Code,
  'FileText': FileText,
  'Database': Database,
  'Settings': Settings,
  'Cpu': Cpu,
  'Workflow': Workflow,
  'Zap': Zap,
  'bot': Bot,
  'code': Code,
  'file-text': FileText,
  'database': Database,
  'settings': Settings,
  'cpu': Cpu,
  'workflow': Workflow,
  'zap': Zap
};

/**
 * A component that dynamically renders a Lucide icon based on the provided icon name.
 */
const DynamicIcon: React.FC<DynamicIconProps> = ({ 
  icon, 
  size = 16, 
  className = '', 
  strokeWidth = 2 
}) => {
  // Format the icon name to match Lucide's naming convention
  // This handles both kebab-case and PascalCase icons
  const formattedIconName = formatIconName(icon);
  
  // Get the icon component from our map or use a default if not found
  const IconComponent = iconMap[formattedIconName] || 
                       iconMap[icon] || 
                       iconMap[icon.toLowerCase()] || 
                       LucideIcons.HelpCircle;
  
  return (
    <IconComponent 
      size={size} 
      className={className} 
      strokeWidth={strokeWidth} 
    />
  );
};

/**
 * Format icon name to match Lucide's capitalization pattern
 */
function formatIconName(iconName: string): string {
  // Handle icon names in kebab-case (e.g., 'check-circle')
  if (iconName.includes('-')) {
    return iconName.split('-')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join('');
  }
  
  // Handle icon names in camelCase or just a single word
  return iconName.charAt(0).toUpperCase() + iconName.slice(1);
}

export default DynamicIcon;
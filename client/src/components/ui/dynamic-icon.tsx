import React from 'react';
import * as LucideIcons from 'lucide-react';
import { 
  Bot, 
  Code, 
  FileText, 
  Database, 
  Settings, 
  Cpu, 
  Workflow, 
  Zap, 
  Globe, 
  Send,
  Webhook
} from 'lucide-react';

interface DynamicIconProps {
  icon: string | React.ComponentType<any> | object | null | undefined;
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
  'Globe': Globe,
  'Send': Send,
  'Webhook': Webhook,
  'bot': Bot,
  'code': Code,
  'file-text': FileText,
  'database': Database,
  'settings': Settings,
  'cpu': Cpu,
  'workflow': Workflow,
  'zap': Zap,
  'globe': Globe,
  'send': Send,
  'webhook': Webhook
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
  // If icon is not provided or is null/undefined, render default
  if (!icon) {
    return <LucideIcons.HelpCircle size={size} className={className} strokeWidth={strokeWidth} />;
  }
  
  // If icon is a React component
  if (typeof icon === 'function') {
    const IconComponent = icon as React.ComponentType<any>;
    return <IconComponent size={size} className={className} strokeWidth={strokeWidth} />;
  }
  
  // Handle empty objects or any non-standard object
  if (typeof icon === 'object') {
    return <LucideIcons.Box size={size} className={className} strokeWidth={strokeWidth} />;
  }
  
  // If icon is a string, render the appropriate Lucide icon
  if (typeof icon === 'string') {
    try {
      // Format the icon name to match Lucide's naming convention
      const formattedIconName = formatIconName(icon);
      
      // Get the icon component from our map or use a default if not found
      const IconComponent = iconMap[formattedIconName] || 
                          iconMap[icon] || 
                          (icon.toLowerCase ? iconMap[icon.toLowerCase()] : null) || 
                          LucideIcons.HelpCircle;
      
      return (
        <IconComponent 
          size={size} 
          className={className} 
          strokeWidth={strokeWidth} 
        />
      );
    } catch (error) {
      console.error("Error rendering icon:", error);
      return <LucideIcons.HelpCircle size={size} className={className} strokeWidth={strokeWidth} />;
    }
  }
  
  // Default fallback for any other type
  return <LucideIcons.HelpCircle size={size} className={className} strokeWidth={strokeWidth} />;
};

/**
 * Format icon name to match Lucide's capitalization pattern
 */
function formatIconName(iconName: string | React.ComponentType<any> | object | null | undefined): string {
  // Only process if iconName is a string
  if (typeof iconName !== 'string') {
    return 'HelpCircle'; // default fallback
  }
  
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
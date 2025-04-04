import { createContext, useContext, useState, ReactNode } from 'react';

type TabType = 'agents' | 'workflows' | 'nodes';

interface BuilderContextType {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

const BuilderContext = createContext<BuilderContextType | undefined>(undefined);

interface BuilderProviderProps {
  children: ReactNode;
}

export const BuilderProvider = ({ children }: BuilderProviderProps) => {
  const [activeTab, setActiveTab] = useState<TabType>('agents');

  return (
    <BuilderContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </BuilderContext.Provider>
  );
};

export const useBuilderContext = () => {
  const context = useContext(BuilderContext);
  if (context === undefined) {
    throw new Error('useBuilderContext must be used within a BuilderProvider');
  }
  return context;
};

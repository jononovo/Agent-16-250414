import Sidebar from '@/components/layout/Sidebar';
import MainContent from '@/components/layout/MainContent';
import PromptInput from '@/components/PromptInput';
import BuildingBlocksTabs from '@/components/BuildingBlocksTabs';
import TabContent from '@/components/TabContent';
import { useIsMobile } from '@/hooks/use-mobile';
import { ChatSidebar, ChatToggle } from '@/components/chat';

const Builder = () => {
  const isMobile = useIsMobile();

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar collapsed={isMobile} />
      <MainContent>
        <PromptInput />
        <BuildingBlocksTabs />
        <TabContent />
      </MainContent>
      
      {/* Chat components */}
      <ChatSidebar />
      <ChatToggle />
    </div>
  );
};

export default Builder;

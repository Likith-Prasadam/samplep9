import { Header } from '@/components/layouts/header';
import { Main } from '@/components/layouts/main';
import { SearchField } from '@/components/search';
import { ThemeSwitch } from '@/components/theme-switch';
import { ConfigDrawer } from '@/components/config-drawer';
import { TimezoneDropdown } from '@/components/layouts/timezone-dropdown';
import { ProfileDropdown } from '@/components/profile-dropdown';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ArrowLeft, MessageSquareText } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ConnectedIntelligenceSidebar } from './components/connected-intelligence-sidebar';
import { ConnectedIntelligenceConversationSidebar } from './components/connected-intelligence-conversation-sidebar';
import { ConnectedIntelligenceChatPanel } from './components/connected-intelligence-chat-panel';
import { useConnectedIntelligenceComposer } from './hooks/use-connected-intelligence';
import { useUser } from '@/context/user-context';

export default function ConnectedIntelligencePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [conversationSheetOpen, setConversationSheetOpen] = useState(false);
  const [desktopConversationsCollapsed, setDesktopConversationsCollapsed] =
    useState(false);
  const [filtersSheetOpen, setFiltersSheetOpen] = useState(false);
  const cohortHash = searchParams.get('cohort');
  const { user } = useUser();

  const displayName =
    [user?.first_name, user?.last_name].filter(Boolean).join(' ').trim() ||
    user?.username ||
    'there';

  const {
    message,
    setMessage,
    filters,
    filterOptions,
    updateMultiFilter,
    setSingleFilter,
    activeCameraCount,
    cameraNamesInScope,
    conversation,
    conversationThreads,
    deletingConversationIds,
    activeConversationId,
    selectConversation,
    sendMessage,
    startNewConversation,
    deleteConversation,
    chatError,
    isStreaming,
    isHistoryLoading,
    isConversationThreadsLoading,
    models,
    selectedModel,
    onModelChange,
    modelsLoading,
  } = useConnectedIntelligenceComposer({ cohortHashOverride: cohortHash });

  return (
    <div className="flex h-[100dvh] min-h-0 flex-col overflow-hidden">
      <Header fixed>
        <SearchField />
        <div className="ms-auto flex items-center space-x-4">
          <ThemeSwitch />
          <TimezoneDropdown />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main fixed className="flex-1 min-h-0 overflow-hidden !p-0">
        <div className="flex h-full min-h-0 flex-col p-3 sm:p-4">
          <div className="mb-2 flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-fit -ms-2 px-2 text-muted-foreground hover:text-foreground"
              onClick={() => {
                const target = cohortHash
                  ? `/live?cohort=${encodeURIComponent(cohortHash)}`
                  : '/live';
                navigate(target);
              }}
            >
              <ArrowLeft className="me-1 h-4 w-4" />
              Back to live cameras
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 xl:hidden"
              onClick={() => setConversationSheetOpen(true)}
            >
              <MessageSquareText className="me-1 h-4 w-4" />
              Conversations
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 xl:hidden"
              onClick={() => setFiltersSheetOpen(true)}
            >
              Filters
            </Button>
          </div>

          <div
            className={cn(
              'grid min-h-0 flex-1 grid-cols-1 gap-0',
              desktopConversationsCollapsed
                ? 'xl:grid-cols-[3rem_minmax(0,1fr)_320px]'
                : 'xl:grid-cols-[280px_minmax(0,1fr)_320px]'
            )}
          >
            <div className="hidden h-full min-h-0 xl:block xl:border-e xl:border-border/60 xl:pe-3">
              <ConnectedIntelligenceConversationSidebar
                conversationThreads={conversationThreads}
                activeConversationId={activeConversationId}
                deletingConversationIds={deletingConversationIds}
                onSelectConversation={selectConversation}
                onNewChat={startNewConversation}
                onDeleteConversation={deleteConversation}
                isConversationThreadsLoading={isConversationThreadsLoading}
                isStreaming={isStreaming}
                collapsed={desktopConversationsCollapsed}
                onToggleCollapsed={() =>
                  setDesktopConversationsCollapsed((value) => !value)
                }
              />
            </div>

            <div className="min-h-0 xl:px-3">
              <ConnectedIntelligenceChatPanel
                userName={displayName}
                message={message}
                onMessageChange={setMessage}
                messages={conversation}
                onSend={sendMessage}
                chatError={chatError}
                isStreaming={isStreaming}
                isHistoryLoading={isHistoryLoading}
                models={models}
                selectedModel={selectedModel}
                onModelChange={onModelChange}
                modelsLoading={modelsLoading}
              />
            </div>

            <div className="hidden h-full min-h-0 xl:block xl:border-s xl:border-border/60 xl:ps-3">
              <ConnectedIntelligenceSidebar
                filters={filters}
                filterOptions={filterOptions}
                activeCameraCount={activeCameraCount}
                cameraNamesInScope={cameraNamesInScope}
                onToggleMultiFilter={updateMultiFilter}
                onSetSingleFilter={setSingleFilter}
              />
            </div>
          </div>
        </div>
      </Main>

      <Sheet
        open={conversationSheetOpen}
        onOpenChange={setConversationSheetOpen}
      >
        <SheetContent side="left" className="w-[min(92vw,24rem)] p-0">
          <SheetHeader className="border-b border-border/70 px-4 py-4">
            <SheetTitle>Conversations</SheetTitle>
          </SheetHeader>
          <div className="h-full min-h-0 p-2">
            <ConnectedIntelligenceConversationSidebar
              conversationThreads={conversationThreads}
              activeConversationId={activeConversationId}
              deletingConversationIds={deletingConversationIds}
              onSelectConversation={(threadId) => {
                selectConversation(threadId);
                setConversationSheetOpen(false);
              }}
              onNewChat={() => {
                startNewConversation();
                setConversationSheetOpen(false);
              }}
              onDeleteConversation={deleteConversation}
              isConversationThreadsLoading={isConversationThreadsLoading}
              isStreaming={isStreaming}
              collapsed={false}
            />
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={filtersSheetOpen} onOpenChange={setFiltersSheetOpen}>
        <SheetContent side="right" className="w-[min(92vw,24rem)] p-0">
          <SheetHeader className="border-b border-border/70 px-4 py-4">
            <SheetTitle>Filters</SheetTitle>
          </SheetHeader>
          <div className="h-full min-h-0 p-2">
            <ConnectedIntelligenceSidebar
              filters={filters}
              filterOptions={filterOptions}
              activeCameraCount={activeCameraCount}
              cameraNamesInScope={cameraNamesInScope}
              onToggleMultiFilter={updateMultiFilter}
              onSetSingleFilter={setSingleFilter}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

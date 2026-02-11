import React from 'react';
import { Plus, Clock, Loader2, MessageCircle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

interface ProjectChat {
  id: bigint;
  title: string;
  projectId: string;
  messages: any[];
  createdAt: Date;
  updatedAt: Date;
}

interface ChatHeaderProps {
  onNewChat: () => void;
  isCreatingChat: boolean;
  isChatLoading: boolean;
  isArchitectureGenerating: boolean;
  hasMessages: boolean;
  chats: ProjectChat[];
  activeChatId: string | null;
  onSelectChat: (chatId: string) => void;
}

function getDateGroup(date: Date): string {
  const now = new Date();
  const d = new Date(date);

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday.getTime() - 86400000);

  if (d >= startOfToday) return 'Today';
  if (d >= startOfYesterday) return 'Yesterday';

  const diffDays = Math.floor((startOfToday.getTime() - d.getTime()) / 86400000);
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

function formatTime(date: Date): string {
  const now = new Date();
  const d = new Date(date);
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);

  if (diffMins < 1) return 'now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  return '';
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  onNewChat,
  isCreatingChat,
  isChatLoading,
  isArchitectureGenerating,
  hasMessages,
  chats,
  activeChatId,
  onSelectChat,
}) => {
  const isNewChatDisabled = isChatLoading || isArchitectureGenerating || !hasMessages;

  // Group chats by date
  const grouped: { label: string; chats: ProjectChat[] }[] = [];
  const groupMap = new Map<string, ProjectChat[]>();

  for (const chat of chats) {
    const label = getDateGroup(chat.createdAt);
    if (!groupMap.has(label)) {
      groupMap.set(label, []);
    }
    groupMap.get(label)!.push(chat);
  }

  for (const [label, groupChats] of groupMap) {
    grouped.push({ label, chats: groupChats });
  }

  return (
    <div className="flex items-center gap-1">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            disabled={chats.length === 0}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700/60 rounded-lg transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed outline-none"
            title="Chat history"
          >
            <Clock className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-72 max-h-[60vh] overflow-y-auto bg-gray-950 border-gray-800"
        >
          {grouped.map((group, groupIdx) => (
            <React.Fragment key={group.label}>
              {groupIdx > 0 && <DropdownMenuSeparator className="bg-gray-800" />}
              <DropdownMenuLabel className="text-xs text-gray-500 font-medium px-3 py-1.5">
                {group.label}
              </DropdownMenuLabel>
              <DropdownMenuGroup>
                {group.chats.map((chat) => {
                  const isActive = activeChatId === chat.id.toString();
                  const timeStr = formatTime(chat.createdAt);
                  return (
                    <DropdownMenuItem
                      key={chat.id.toString()}
                      disabled={isChatLoading}
                      onClick={() => onSelectChat(chat.id.toString())}
                      className={`px-3 py-2 cursor-pointer gap-2.5 ${
                        isActive
                          ? 'bg-red-500/10 text-white'
                          : 'text-gray-300 focus:text-white'
                      }`}
                    >
                      <MessageCircle className={`h-3.5 w-3.5 shrink-0 ${
                        isActive ? 'text-red-400' : 'text-gray-500'
                      }`} />
                      <span className="truncate flex-1 text-sm">{chat.title}</span>
                      {timeStr && (
                        <span className="text-xs text-gray-500 shrink-0">{timeStr}</span>
                      )}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuGroup>
            </React.Fragment>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <button
        onClick={onNewChat}
        disabled={isNewChatDisabled}
        className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700/60 rounded-lg transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed"
        title="New chat"
      >
        {isCreatingChat ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Plus className="h-4 w-4" />
        )}
      </button>
    </div>
  );
};

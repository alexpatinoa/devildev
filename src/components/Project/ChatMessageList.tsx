import React from 'react';
import Image from 'next/image';
import { ChatMessage } from './ChatMessage';
import { ProjectMessage } from '../../../actions/project';
import { Bug, ListTodo, Sparkles } from 'lucide-react';

interface ChatMessageListProps {
  messages: ProjectMessage[];
  isChatLoading: boolean;
  isPromptGenerating: boolean;
  isDocsGenerating: boolean;
  userImageUrl?: string;
  userInitial?: string;
  copiedPrompts: Record<string, boolean>;
  onCopyPrompt: (messageId: string, prompt: string) => void;
  onViewDocs?: (projectDocsId: string, docsName?: string) => void;
  onOpenTab?: (tabType: 'bug' | 'tasks' | 'features') => void;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
}

export const ChatMessageList: React.FC<ChatMessageListProps> = ({
  messages,
  isChatLoading,
  isPromptGenerating,
  isDocsGenerating,
  userImageUrl,
  userInitial,
  copiedPrompts,
  onCopyPrompt,
  onViewDocs,
  onOpenTab,
  messagesEndRef,
}) => {
  const showEmptyState = messages.length === 0 && !isChatLoading && !isPromptGenerating && !isDocsGenerating;

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-600 hover:scrollbar-thumb-gray-500">
      {/* Empty State - Show 3 Buttons */}
      {showEmptyState && (
        <div className="flex items-center justify-center h-full">
          <div className="w-80 aspect-square">
            {/* Top Row - Bug and Tasks buttons (square) */}
            <div className="flex gap-4 mb-4">
              <button
                onClick={() => onOpenTab?.('bug')}
                className="flex-1 aspect-square cursor-pointer bg-gradient-to-br from-red-500/10 to-red-600/5 border border-red-500/30 rounded-2xl hover:border-red-400/50 hover:bg-gradient-to-br hover:from-red-500/20 hover:to-red-600/10 transition-all duration-300 group flex flex-col items-center justify-center gap-3"
              >
                <div className="p-4 bg-red-500/10 rounded-xl group-hover:bg-red-500/20 transition-colors duration-300">
                  <Bug className="w-8 h-8 text-red-400" />
                </div>
                <span className="text-white font-semibold text-lg">Bug</span>
              </button>

              <button
                onClick={() => onOpenTab?.('tasks')}
                className="flex-1 aspect-square cursor-pointer bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/30 rounded-2xl hover:border-blue-400/50 hover:bg-gradient-to-br hover:from-blue-500/20 hover:to-blue-600/10 transition-all duration-300 group flex flex-col items-center justify-center gap-3"
              >
                <div className="p-4 bg-blue-500/10 rounded-xl group-hover:bg-blue-500/20 transition-colors duration-300">
                  <ListTodo className="w-8 h-8 text-blue-400" />
                </div>
                <span className="text-white font-semibold text-lg">Tasks</span>
              </button>
            </div>

            {/* Bottom Row - Features button (rectangle) */}
            <button
              onClick={() => onOpenTab?.('features')}
              className="w-full h-[calc(50%-0.5rem)] cursor-pointer bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/30 rounded-2xl hover:border-purple-400/50 hover:bg-gradient-to-br hover:from-purple-500/20 hover:to-purple-600/10 transition-all duration-300 group flex items-center justify-center gap-4"
            >
              <div className="p-4 bg-purple-500/10 rounded-xl group-hover:bg-purple-500/20 transition-colors duration-300">
                <Sparkles className="w-8 h-8 text-purple-400" />
              </div>
              <span className="text-white font-semibold text-lg">Features</span>
            </button>
          </div>
        </div>
      )}

      {/* Messages */}
      {messages.map((message, index) => (
        <ChatMessage
          key={message.id || `fallback-${index}`}
          message={message}
          index={index}
          userImageUrl={userImageUrl}
          userInitial={userInitial}
          copiedPrompts={copiedPrompts}
          onCopyPrompt={onCopyPrompt}
          onViewDocs={onViewDocs}
        />
      ))}

      {/* Loading indicator */}
      {isChatLoading && (
        <div className="flex justify-start items-center space-x-3 animate-pulse">
          <Image
            src="/favicon.jpg"
            alt="Assistant"
            width={32}
            height={32}
            className="w-8 h-8 rounded-full"
          />
          <div className="text-white/69 text-sm flex items-center">
            <span>thinking</span>
            <span className="ml-1">...</span>
          </div>
        </div>
      )}

      {isPromptGenerating && (
        <div className="flex justify-start items-center space-x-3 animate-pulse">
          <Image
            src="/favicon.jpg"
            alt="Assistant"
            width={32}
            height={32}
            className="w-8 h-8 rounded-full"
          />
          <div className="text-white/69 text-sm flex items-center">
            <span>generating prompt</span>
            <span className="ml-1">...</span>
          </div>
        </div>
      )}

      {isDocsGenerating && (
        <div className="flex justify-start items-center space-x-3 animate-pulse">
          <Image
            src="/favicon.jpg"
            alt="Assistant"
            width={32}
            height={32}
            className="w-8 h-8 rounded-full"
          />
          <div className="text-white/69 text-sm flex items-center">
            <span>generating docs</span>
            <span className="ml-1">...</span>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
};

import React from 'react';
import Image from 'next/image';
import { ChatMessage } from './ChatMessage';
import { ProjectMessage } from '../../../actions/project';
import { Bug, ListTodo, Sparkles } from 'lucide-react';

interface ChatMessageListProps {
  messages: ProjectMessage[];
  isChatLoading: boolean;
  userImageUrl?: string;
  userInitial?: string;
  copiedPrompts: Record<string, boolean>;
  onCopyPrompt: (messageId: string, prompt: string) => void;
  onOpenTab?: (tabType: 'bug' | 'tasks' | 'features') => void;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
}

export const ChatMessageList: React.FC<ChatMessageListProps> = ({
  messages,
  isChatLoading,
  userImageUrl,
  userInitial,
  copiedPrompts,
  onCopyPrompt,
  onOpenTab,
  messagesEndRef,
}) => {
  const showEmptyState = messages.length === 0 && !isChatLoading;

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-600 hover:scrollbar-thumb-gray-500">
      {/* Empty State - Show 3 Buttons */}
      {showEmptyState && (
        <div className="flex items-center justify-center h-full ">
          <div className="w-80 aspect-square">
            {/* Top Row - Bug and Tasks buttons (square) */}
            <div className="flex gap-4 mb-4">
              <button
                onClick={() => onOpenTab?.('bug')}
                className="flex-1 aspect-square gap-2.5 cursor-pointer bg-gradient-to-br from-slate-800/40 to-slate-900/40 border border-slate-700/50 rounded-2xl hover:border-slate-600/70 hover:bg-gradient-to-br hover:from-slate-800/60 hover:to-slate-900/60 transition-all duration-300 group flex flex-col justify-start p-5"
              >
                <div className="flex items-start gap-1.5">
                  <div className="p-1 bg-slate-700/50 rounded-sm group-hover:bg-slate-700/70 transition-colors duration-300 flex-shrink-0">
                    <Bug className="w-3 h-3 text-slate-300" />
                  </div>
                  <span className="text-white font-semibold text-sm">Bug</span>
                </div>
                <p className="text-slate-400 text-xs text-left leading-relaxed">Report and track bugs with detailed context and reproduction steps.</p>
              </button>

              <button
                onClick={() => onOpenTab?.('tasks')}
                className="flex-1 aspect-square gap-2 cursor-pointer bg-gradient-to-br from-slate-800/40 to-slate-900/40 border border-slate-700/50 rounded-2xl hover:border-slate-600/70 hover:bg-gradient-to-br hover:from-slate-800/60 hover:to-slate-900/60 transition-all duration-300 group flex flex-col justify-start p-5"
              >
                <div className="flex items-start gap-1.5">
                  <div className="p-1 bg-slate-700/50 rounded-sm group-hover:bg-slate-700/70 transition-colors duration-300 flex-shrink-0">
                    <ListTodo className="w-3 h-3 text-slate-300" />
                  </div>
                  <span className="text-white font-semibold text-sm">Tasks</span>
                </div>
                <p className="text-slate-400 text-xs text-left leading-relaxed">Create and manage development tasks with clear priorities and progress tracking.</p>
              </button>
            </div>

            {/* Bottom Row - Features button (rectangle) */}
            <button
              onClick={() => onOpenTab?.('features')}
              className="w-full h-[calc(50%-0.5rem)] gap-2.5 cursor-pointer bg-gradient-to-br from-slate-800/40 to-slate-900/40 border border-slate-700/50 rounded-2xl hover:border-slate-600/70 hover:bg-gradient-to-br hover:from-slate-800/60 hover:to-slate-900/60 transition-all duration-300 group flex flex-col justify-start p-5"
            >
              <div className="flex items-start gap-1.5">
                <div className="p-1 bg-slate-700/50 rounded-sm group-hover:bg-slate-700/70 transition-colors duration-300 flex-shrink-0">
                  <Sparkles className="w-3 h-3 text-slate-300" />
                </div>
                <span className="text-white font-semibold text-sm">Features</span>
              </div>
              <p className="text-slate-400 text-xs text-left leading-relaxed">Plan and implement new features with comprehensive specifications, clear functional requirements, and well-defined acceptance criteria for consistent execution.</p>
            </button>

            {/* Info message */}
            <p className="text-slate-500 text-xs text-center mt-6 leading-relaxed">
              Soon Any Pact (Bug/Task/Feature) created will be automatically updated as you commit to GitHub
            </p>
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
      
      <div ref={messagesEndRef} />
    </div>
  );
};

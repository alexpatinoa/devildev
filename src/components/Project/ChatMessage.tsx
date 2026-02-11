import React from 'react';
import Image from 'next/image';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Copy, Check } from 'lucide-react';
import { ProjectMessage } from '../../../actions/project';

interface ChatMessageProps {
  message: ProjectMessage;
  index: number;
  userImageUrl?: string;
  userInitial?: string;
  copiedPrompts: Record<string, boolean>;
  onCopyPrompt: (messageId: string, prompt: string) => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  index,
  userImageUrl,
  userInitial = 'U',
  copiedPrompts,
  onCopyPrompt,
}) => {
  return (
    <div key={message.id || `fallback-${index}`} className="flex flex-col items-start">
      <div className="flex w-full">
        {message.type === 'assistant' && (
          <div className="mr-3 flex-shrink-0">
            <Image
              src="/favicon.jpg"
              alt="Assistant"
              width={32}
              height={32}
              className="rounded-full"
            />
          </div>
        )}
        {message.type === 'user' && (
          <div className="mr-1 flex-shrink-0">
            <Avatar className="size-8">
              <AvatarImage src={userImageUrl} alt="User" />
              <AvatarFallback>{userInitial}</AvatarFallback>
            </Avatar>
          </div>
        )}
        <div className="max-w-[80%] rounded-2xl px-2 py-1 text-white">
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        </div>
      </div>

      {/* Prompt box - only show for assistant messages with prompt */}
      {message.type === 'assistant' && message.prompt && (
        <div className="w-full mt-3">
          <div className="border border-gray-600 rounded-lg bg-gray-900/30 relative">
            {/* Copy button */}
            <button
              onClick={() => onCopyPrompt(message.id, message.prompt!)}
              className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-md transition-all duration-200 z-10"
              title="Copy prompt"
            >
              {copiedPrompts[message.id] ? (
                <Check className="h-4 w-4 text-green-400" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
            <div className="p-3 pr-12 max-h-60 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-600 hover:scrollbar-thumb-gray-500">
              <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono break-words">
                {message.prompt}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

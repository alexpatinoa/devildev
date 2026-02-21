import React from 'react';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ChatMessage as ChatMessageType } from '../../../actions/chat';


interface ChatMessageProps {
  message: ChatMessageType;
  index: number;
  userImageUrl?: string;
  userInitial?: string;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  index,
  userImageUrl,
  userInitial = 'U',
}) => {
  return (
    <div key={message.id || `fallback-${index}`} className={`flex ${message.type === 'user' ? 'justify-start' : 'justify-start'}`}>
      {message.type === 'assistant' && (
        <div className="mr-3 flex-shrink-0">
          <Image
            src="/favicon.jpg"
            alt="DevilDev AI assistant"
            width={32}
            height={32}
            className="rounded-full"
          />
        </div>
      )}
      {message.type === 'user' && (
        <div className="mr-1 flex-shrink-0">
          <Avatar className="size-8">
            <AvatarImage src={userImageUrl} alt="User avatar" />
            <AvatarFallback>{userInitial}</AvatarFallback>
          </Avatar>
        </div>
      )}
      <div className={`max-w-[80%] rounded-2xl px-2 py-1 ${
        message.type === 'user' 
          ? 'text-white' 
          : 'text-white'
      }`}>
        {message.type === 'assistant' ? (
          <div className="prose prose-invert prose-sm max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
              components={{
                h1: ({ children }) => <h1 className="text-lg font-bold mb-2 text-red-400">{children}</h1>,
                h2: ({ children }) => <h2 className="text-base font-semibold mb-2 text-red-300">{children}</h2>,
                h3: ({ children }) => <h3 className="text-sm font-medium mb-1 text-red-200">{children}</h3>,
                p: ({ children }) => <p className="mb-2 text-gray-200">{children}</p>,
                ul: ({ children }) => <ul className="list-disc ml-4 mb-2 text-gray-200">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal ml-4 mb-2 text-gray-200">{children}</ol>,
                li: ({ children }) => <li className="mb-1">{children}</li>,
                code: ({ children, className, ...props }: any) => {
                  const match = /language-(\w+)/.exec(className || '');
                  const inline = props.inline;
                  return !inline ? (
                    <pre className="bg-gray-900 rounded-lg p-3 mb-2 overflow-x-auto">
                      <code className={className}>{children}</code>
                    </pre>
                  ) : (
                    <code className="bg-gray-700 px-1 py-0.5 rounded text-sm">{children}</code>
                  );
                },
                blockquote: ({ children }) => <blockquote className="border-l-4 border-red-500 pl-4 italic text-gray-300">{children}</blockquote>,
                strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        ) : (
          <p className="text-sm md:text-base whitespace-pre-wrap">{message.content}</p>
        )}
      </div>
    </div>
  );
};

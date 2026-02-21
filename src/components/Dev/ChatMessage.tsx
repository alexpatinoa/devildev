import React from 'react';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ChatMessage as ChatMessageType } from '../../../actions/chat';
import { InterviewBlock } from './InterviewBlock';
import type { InterviewAnswer } from '../../../types/pToA/tools';

interface ChatMessageProps {
  message: ChatMessageType;
  index: number;
  userImageUrl?: string;
  userInitial?: string;
  onInterviewComplete?: (messageId: string, answers: InterviewAnswer[]) => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  index,
  userImageUrl,
  userInitial = 'U',
  onInterviewComplete,
}) => {
  const isInterviewComplete =
    message.interviewPayload &&
    message.interviewAnswers &&
    message.interviewAnswers.length === message.interviewPayload.questions.length;

  const renderAssistantContent = () => {
    if (message.type !== 'assistant') return null;
    if (message.interviewPayload) {
      if (isInterviewComplete && message.interviewAnswers) {
        return (
          <div className="rounded-2xl border border-gray-700/60 bg-gray-900/50 p-4 max-w-lg">
            <p className="text-xs font-medium text-red-400/90 mb-3">Interview completed</p>
            <ul className="space-y-2 text-sm text-gray-300">
              {message.interviewPayload.questions.map((q, i) => {
                const ans = message.interviewAnswers?.find((a) => a.questionIndex === i);
                return (
                  <li key={i}>
                    <span className="text-gray-500">{q.title}:</span>{' '}
                    {ans?.selected?.join(', ') ?? '—'}
                  </li>
                );
              })}
            </ul>
          </div>
        );
      }
      return (
        <InterviewBlock
          messageId={message.id}
          payload={message.interviewPayload}
          initialAnswers={message.interviewAnswers}
          onComplete={(answers) => onInterviewComplete?.(message.id, answers)}
        />
      );
    }
    return (
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
    );
  };

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
      <div className={`max-w-[80%] rounded-2xl px-2 py-1 ${message.type === 'user' ? 'text-white' : 'text-white'}`}>
        {message.type === 'assistant' ? renderAssistantContent() : (
          <p className="text-sm md:text-base whitespace-pre-wrap">{message.content}</p>
        )}
      </div>
    </div>
  );
};

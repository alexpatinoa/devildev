import React from 'react';
import Image from 'next/image';
import { ChatMessage as ChatMessageType } from '../../../actions/chat';
import { ChatMessage } from './ChatMessage';
import type { InterviewAnswer } from '../../../types/pToA/tools';

interface ChatMessageListProps {
  messages: ChatMessageType[];
  isLoading: boolean;
  isGeneratingDocs: boolean;
  isArchitectureLoading: boolean;
  architectureData: any;
  docsGenerated: boolean;
  isStreamingDocs: boolean;
  isMobile: boolean;
  showOptionsButton?: boolean;
  isOptionsLoading?: boolean;
  userImageUrl?: string;
  userInitial?: string;
  onGenerateDocs: () => void;
  onViewOptions?: () => void;
  docsButtonRef: React.RefObject<HTMLButtonElement | null>;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  onInterviewComplete?: (messageId: string, answers: InterviewAnswer[]) => void;
}

export const ChatMessageList: React.FC<ChatMessageListProps> = ({
  messages,
  isLoading,
  isGeneratingDocs,
  isArchitectureLoading,
  architectureData,
  docsGenerated,
  isStreamingDocs,
  isMobile,
  showOptionsButton,
  isOptionsLoading,
  userImageUrl,
  userInitial,
  onGenerateDocs,
  onViewOptions,
  docsButtonRef,
  messagesEndRef,
  onInterviewComplete,
}) => {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-600 hover:scrollbar-thumb-gray-500">
      {messages.map((message) => (
        <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-start' : 'justify-start'}`}>
          <ChatMessage
            message={message}
            index={messages.indexOf(message)}
            userImageUrl={userImageUrl}
            userInitial={userInitial}
            onInterviewComplete={onInterviewComplete}
          />
        </div>
      ))} 
      
      {/* Loading indicator */}
      {isLoading && (
        <div className="flex justify-start items-center space-x-3 animate-pulse">
          <Image
            src="/favicon.jpg"
            alt="DevilDev AI assistant"
            width={32}
            height={32}
            className="w-8 h-8 rounded-full "
          />
          <div className="text-white/69 text-sm flex items-center">
            <span>is thinking</span>
            <span className="">
              <span 
                style={{
                  animation: 'typing 2s infinite',
                  animationName: 'typing'
                }}
              >.</span>
              <span 
                style={{
                  animation: 'typing 2s infinite 0.3s',
                  animationName: 'typing'
                }}
              >.</span>
              <span 
                style={{
                  animation: 'typing 2s infinite 0.6s',
                  animationName: 'typing'
                }}
              >.</span>
            </span>
          </div>
        </div>
      )}
      {isGeneratingDocs && (
        <div className="flex justify-start items-center space-x-3 animate-pulse">
          <Image
            src="/favicon.jpg"
            alt="DevilDev AI assistant"
            width={32}
            height={32}
            className="w-8 h-8 rounded-full "
          />
          <div className="text-white/69 text-sm flex items-center">
            <span>generating docs </span>
            <span className="">
              <span 
                style={{
                  animation: 'typing 2s infinite',
                  animationName: 'typing'
                }}
              >.</span>
              <span 
                style={{
                  animation: 'typing 2s infinite 0.3s',
                  animationName: 'typing'
                }}
              >.</span>
              <span 
                style={{
                  animation: 'typing 2s infinite 0.6s',
                  animationName: 'typing'
                }}
              >.</span>
            </span>
          </div>
        </div>
      )}
      {isArchitectureLoading && (
        <div className="flex justify-start items-center space-x-3 animate-pulse">
          <Image
            src="/favicon.jpg"
            alt="DevilDev AI assistant"
            width={32}
            height={32}
            className="w-8 h-8 rounded-full "
          />
          <div className="text-white/69 text-sm flex items-center">
            <span>{architectureData ? "updating" : "generating"} architecture</span>
            <span className="">
              <span 
                style={{
                  animation: 'typing 2s infinite',
                  animationName: 'typing'
                }}
              >.</span>
              <span 
                style={{
                  animation: 'typing 2s infinite 0.3s',
                  animationName: 'typing'
                }}
              >.</span>
              <span 
                style={{
                  animation: 'typing 2s infinite 0.6s',
                  animationName: 'typing'
                }}
              >.</span>
            </span>
          </div>
        </div>
      )}
      { !isLoading && !isArchitectureLoading && !isGeneratingDocs && architectureData && (
        <div className={`flex h-12 ml-10 relative ${!docsGenerated && !isMobile && "z-[115]"} `}>
          <button 
            ref={docsButtonRef}
            onClick={onGenerateDocs} 
            className={`px-6 py-2 border rounded-lg font-bold cursor-pointer transition-colors duration-200 relative ${!docsGenerated && !isMobile && "z-[115]"} ${
              isStreamingDocs 
                ? "bg-yellow-600 border-yellow-600 text-white cursor-not-allowed" 
                : docsGenerated
                  ? "bg-green-600 border-green-600 text-white cursor-not-allowed"
                  : "hover:bg-transparent border-white hover:text-white bg-white text-black"
            }`}
            disabled={isStreamingDocs || docsGenerated}
          >
            {docsGenerated ? "Docs Generated ✓" : "Generate Docs→"}
          </button>
        </div> 
      )}
      {showOptionsButton && !isLoading && !isGeneratingDocs && (
        <div className="flex h-12 ml-10 relative">
          <button
            onClick={onViewOptions}
            className={`px-6 py-2 border rounded-lg font-bold cursor-pointer transition-colors duration-200 ${
              isOptionsLoading
                ? "bg-yellow-600 border-yellow-600 text-white cursor-not-allowed"
                : "hover:bg-transparent border-white hover:text-white bg-white text-black"
            }`}
            disabled={isOptionsLoading}
          >
            {isOptionsLoading ? "Preparing Options..." : "View Options→"}
          </button>
        </div>
      )}
      
      {/* Auto-scroll target */}
      <div ref={messagesEndRef} />
    </div>
  );
};

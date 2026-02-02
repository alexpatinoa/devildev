import React from 'react';
import { Send } from 'lucide-react';

interface ChatInputProps {
  inputMessage: string;
  textareaHeight: string;
  isChatLoading: boolean;
  isCreatingChat: boolean;
  onInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  placeholder?: string;
  maxLength?: number;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  inputMessage,
  textareaHeight,
  isChatLoading,
  isCreatingChat,
  onInputChange,
  onSubmit,
  placeholder = 'Ask about your project...',
  maxLength = 5000,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit(e as any);
    }
  };

  return (
    <div className="p-4 flex-shrink-0">
      <form onSubmit={onSubmit} className="relative">
        <div className="bg-black border-t border-x border-gray-500 backdrop-blur-sm overflow-hidden rounded-t-2xl">
          <textarea
            placeholder={placeholder}
            value={inputMessage}
            onChange={onInputChange}
            onKeyDown={handleKeyDown}
            className="w-full bg-transparent text-white placeholder-gray-400 px-4 py-3 text-sm focus:outline-none resize-none overflow-y-auto min-h-[60px] max-h-[180px]"
            rows={2}
            style={{ height: textareaHeight }}
            maxLength={maxLength}
            disabled={isChatLoading || isCreatingChat}
          />
        </div>
        <div className="bg-black border-l border-r border-b border-gray-500 backdrop-blur-sm rounded-b-2xl px-3 py-2 flex justify-end">
          <button
            type="submit"
            className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
            disabled={!inputMessage.trim() || isChatLoading || isCreatingChat}
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );
};

import React from 'react';
import { SendHorizontal } from 'lucide-react';

interface ChatInputProps {
  inputMessage: string;
  textareaHeight: string;
  isLoading: boolean;
  isArchitectureLoading: boolean;
  maxLength?: number;
  onInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  inputMessage,
  textareaHeight,
  isLoading,
  isArchitectureLoading,
  maxLength,
  onInputChange,
  onSubmit,
}) => {
  return (
    <div className="p-4 flex-shrink-0">
      <form onSubmit={onSubmit} className="relative">
        <div className="bg-black border-t border-x border-gray-500 backdrop-blur-sm overflow-hidden rounded-t-2xl">
          <textarea
            placeholder="Continue the conversation..."
            value={inputMessage}
            onChange={onInputChange}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                onSubmit(e);
              }
            }}
            className="w-full bg-transparent text-white placeholder-gray-400 px-4 py-3 text-sm md:text-base focus:outline-none resize-none overflow-y-auto min-h-[60px] max-h-[180px]"
            rows={2}
            style={{ height: textareaHeight }}
            maxLength={maxLength}
            disabled={isLoading || isArchitectureLoading}
          />
        </div>
        
        {/* Button section */}
        <div className="bg-black border-l border-r border-b border-gray-500 backdrop-blur-sm rounded-b-2xl px-3 py-2 flex justify-end">
          <button 
            type="submit" 
            className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
            disabled={!inputMessage.trim() || isLoading || isArchitectureLoading}
          >
            <SendHorizontal className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );
};

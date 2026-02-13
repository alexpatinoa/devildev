import React, { useEffect, useRef, useState } from 'react';
import { Send, Bug, ListTodo, Sparkles, X } from 'lucide-react';

interface ChatInputProps {
  inputMessage: string;
  textareaHeight: string;
  isChatLoading: boolean;
  isCreatingChat: boolean;
  onInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onOpenTab?: (tabType: 'bug' | 'tasks' | 'features') => void;
  showQuickActions?: boolean;
  placeholder?: string;
  maxLength?: number;
  selectedPactType?: 'bug' | 'task' | 'feature' | null;
  onPactSelect?: (tabType: 'bug' | 'tasks' | 'features') => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  inputMessage,
  textareaHeight,
  isChatLoading,
  isCreatingChat,
  onInputChange,
  onSubmit,
  onOpenTab,
  showQuickActions = false,
  placeholder = 'Ask about your project...',
  maxLength = 5000,
  selectedPactType,
  onPactSelect,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const capsuleRef = useRef<HTMLDivElement>(null);
  const [firstLineIndent, setFirstLineIndent] = useState(0);
  const GAP_PX = 5;

  // Get pact label based on selected type
  const getPactLabel = () => {
    if (!selectedPactType) return '';
    const labelMap = {
      bug: '@bug',
      task: '@task',
      feature: '@feature'
    };
    return labelMap[selectedPactType];
  };

  const pactLabel = getPactLabel();

  // Measure capsule width to set first-line-only indent (only line 1 indented; line 2+ full width)
  useEffect(() => {
    if (!pactLabel) {
      setFirstLineIndent(0);
      return;
    }
    const measure = () => {
      if (capsuleRef.current) {
        setFirstLineIndent(capsuleRef.current.offsetWidth + GAP_PX);
      }
    };
    measure();
    requestAnimationFrame(measure);
  }, [pactLabel, selectedPactType]);

  // Handle removing the pact tag
  const handleRemovePact = () => {
    // Find the corresponding tab type
    const tabTypeMap: Record<string, 'bug' | 'tasks' | 'features'> = {
      bug: 'bug',
      task: 'tasks',
      feature: 'features'
    };
    if (selectedPactType && onPactSelect) {
      onPactSelect(tabTypeMap[selectedPactType]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit(e as any);
    }
  };

  // Get pact color based on type
  const getPactColor = () => {
    if (!selectedPactType) return '';
    const colorMap = {
      bug: 'bg-red-500/20 border-red-500 text-red-300',
      task: 'bg-blue-500/20 border-blue-500 text-blue-300',
      feature: 'bg-purple-500/20 border-purple-500 text-purple-300'
    };
    return colorMap[selectedPactType];
  };

  return (
    <div className="p-4 flex-shrink-0">
      <form onSubmit={onSubmit} className="relative">
        <div className="bg-black border-t border-x border-gray-500 backdrop-blur-sm overflow-hidden rounded-t-2xl relative">
          {/* Pact capsule: only on first line; positioned over the indent area */}
          {pactLabel && (
            <div
              ref={capsuleRef}
              className={`absolute top-3 left-4 z-10 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border w-fit  ${getPactColor()}`}
            >
              <span>{pactLabel}</span>
              <button
                type="button"
                onClick={handleRemovePact}
                className="hover:bg-white/10 rounded-full p-0.5 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          <textarea
            ref={textareaRef}
            placeholder={placeholder}
            value={inputMessage}
            onChange={onInputChange}
            onKeyDown={handleKeyDown}
            className="w-full bg-transparent text-white placeholder-gray-400 px-4 py-3 text-sm focus:outline-none resize-none overflow-y-auto min-h-[60px] max-h-[180px]"
            style={{
              height: textareaHeight,
              textIndent: firstLineIndent,
            }}
            rows={2}
            maxLength={maxLength}
            disabled={isChatLoading || isCreatingChat}
          />
        </div>
        <div className="bg-black border-l border-r border-b border-gray-500 backdrop-blur-sm rounded-b-2xl px-3 py-2 flex justify-between items-center">
          <div className="flex gap-1">
            {showQuickActions && (
              <>
                <button
                  type="button"
                  onClick={() => onPactSelect?.('bug')}
                  className={`p-2 rounded-lg hover:bg-gray-800 cursor-pointer transition-colors relative ${
                    selectedPactType === 'bug'
                      ? 'border-2 border-red-500 text-white bg-red-500/10'
                      : 'border border-slate-200/20 text-gray-400 hover:text-white'
                  }`}
                >
                  <Bug className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onPactSelect?.('tasks')}
                  className={`p-2 rounded-lg hover:bg-gray-800 cursor-pointer transition-colors relative ${
                    selectedPactType === 'task'
                      ? 'border-2 border-blue-500 text-white bg-blue-500/10'
                      : 'border border-slate-200/20 text-gray-400 hover:text-white'
                  }`}
                >
                  <ListTodo className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onPactSelect?.('features')}
                  className={`p-2 rounded-lg hover:bg-gray-800 cursor-pointer transition-colors relative ${
                    selectedPactType === 'feature'
                      ? 'border-2 border-purple-500 text-white bg-purple-500/10'
                      : 'border border-slate-200/20 text-gray-400 hover:text-white'
                  }`}
                >
                  <Sparkles className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
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

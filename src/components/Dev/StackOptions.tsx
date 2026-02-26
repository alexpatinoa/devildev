import React from 'react';
import { ChevronLeft, ArrowRight, Info, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';

interface StackOption {
  id: string;
  name: string;
  description: string;
  technology: string;
  pros: string[];
  cons: string[];
}

interface StackOptionSet {
  id: string;
  requirement: string | null;
  createdAt: string | Date;
  stacks: StackOption[];
}

interface StackOptionsProps {
  optionSets: StackOptionSet[];
  selectedOptionSetId?: string | null;
  onSelectOptionSet: (optionSetId: string | null) => void;
  selectedStackId?: string | null;
  onSelect: (stackId: string) => void;
  isLoading?: boolean;
  isGenerating?: boolean;
  onGenerate?: (stackOption: StackOption) => void;
  generatedStackIds?: string[];
}

export const StackOptions: React.FC<StackOptionsProps> = ({
  optionSets,
  selectedOptionSetId,
  onSelectOptionSet,
  selectedStackId,
  onSelect,
  isLoading,
  isGenerating = false,
  onGenerate,
  generatedStackIds = [],
}) => {
  if (isLoading) {
    return (
      <div className="h-full w-full flex flex-col overflow-hidden pr-2">
        <div className="mb-4 flex-none">
          <div className="h-6 w-48 bg-gray-800 rounded animate-pulse" />
          <div className="mt-2 h-3 w-96 bg-gray-900 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="rounded-2xl border border-gray-800 bg-gray-900/40 p-6 flex flex-col min-h-[220px]">
              <div className="flex items-center gap-3">
                <div className="h-6 w-32 bg-gray-800 rounded animate-pulse" />
                <div className="h-5 w-16 bg-gray-800 rounded-full animate-pulse" />
              </div>
              <div className="mt-4 flex-1 space-y-3">
                <div className="h-3 w-full bg-gray-900 rounded animate-pulse" />
                <div className="h-3 w-5/6 bg-gray-900 rounded animate-pulse" />
                <div className="h-3 w-4/6 bg-gray-900 rounded animate-pulse" />
              </div>
              <div className="mt-auto pt-6 h-4 w-24 bg-gray-800 rounded animate-pulse shrink-0" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (optionSets.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center rounded-xl border border-gray-800 bg-gray-900/30">
        <div className="max-w-lg text-center px-6">
          <h3 className="text-lg font-semibold text-white">No stack options yet</h3>
          <p className="mt-2 text-sm text-gray-400">
            Continue the chat until the agent generates stack options from tier-2 analysis.
          </p>
        </div>
      </div>
    );
  }

  const selectedOptionSet =
    selectedOptionSetId
      ? optionSets.find((optionSet) => optionSet.id === selectedOptionSetId) ?? null
      : null;

  if (!selectedOptionSet) {
    return (
      <div className="h-full w-full min-h-0 overflow-y-auto pr-2">
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-white">Stack Options</h3>
          <p className="mt-2 text-sm text-gray-400">Select an option set to view full stack details.</p>
        </div>
        <div className="space-y-3">
          {optionSets.map((optionSet, idx) => {
            const createdAt = new Date(optionSet.createdAt);
            return (
              <div
                key={optionSet.id}
                role="button"
                tabIndex={0}
                onClick={() => onSelectOptionSet(optionSet.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectOptionSet(optionSet.id);
                  }
                }}
                className="w-full flex items-center gap-4 rounded-xl border border-gray-800 bg-gray-900/50 hover:border-red-500/50 transition-all duration-200 px-4 py-3 cursor-pointer group"
              >
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-xs uppercase tracking-wide text-gray-400">Option Set {optionSets.length - idx}</p>
                  <p className="mt-1 text-base text-white line-clamp-2">
                    {optionSet.requirement?.trim() || 'Generated stack options'}
                  </p>
                  <p className="mt-2 text-xs text-gray-500">
                    {createdAt.toLocaleDateString()}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectOptionSet(optionSet.id);
                  }}
                  className="shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium cursor-pointer text-black bg-white border border-white/80 hover:bg-gray-100 transition-colors"
                >
                  Open
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col min-h-0 overflow-hidden pr-2">
      <div className="mb-6 flex-none">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onSelectOptionSet(null)}
            className="p-1 rounded-md text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
            aria-label="Back to stack option sets"
            title="Back"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h3 className="text-xl font-semibold text-white tracking-wide">Stack Options</h3>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5 flex-1 min-h-0 overflow-y-auto lg:overflow-hidden pb-4">
        {selectedOptionSet.stacks.map((option) => {
          const isGenerated = generatedStackIds.includes(option.id);
          return (
            <div
              key={option.id}
              className="flex flex-col rounded-2xl border transition-all duration-300 p-6 group relative overflow-hidden min-h-[220px] border-gray-800/60 bg-[#1c1f26]/80 hover:border-gray-700 hover:bg-[#232730]"
            >
              {/* Card click target to select */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(option.id);
                }}
                className="absolute inset-0 z-0 focus:outline-none "
                aria-label={`Select ${option.name}`}
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
              </button>

              <div className="relative z-10 flex flex-col h-full pointer-events-none">
                <div className="flex flex-col items-start gap-2 w-full overflow-hidden">
                  <h4 className="text-[17px] font-semibold text-gray-100 tracking-wide truncate w-full">{option.name}</h4>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#2a2e39] text-gray-300 border border-[#3a3f4e] shrink-0 shadow-sm">
                    {option.technology}
                  </span>
                </div>

                <div className="mt-4 flex-1 min-h-0 flex flex-col">
                  <p className="text-[14px] text-gray-400/90 leading-relaxed font-light line-clamp-4">
                    {option.description}
                  </p>
                </div>

                <div className="mt-auto pt-6 flex-none pointer-events-auto flex items-center justify-between gap-3">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="flex-1 bg-transparent hover:bg-white/5 text-white border cursor-pointer border-white text-[13px] shadow-none font-semibold transition-colors">
                        <Info className="mr-2 h-4 w-4" />
                        More info
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl bg-[#181a20] border-gray-800/80 shadow-2xl">
                      <DialogHeader>
                        <DialogTitle className="text-xl flex items-center flex-wrap gap-2 text-gray-100 tracking-wide">
                          {option.name}
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#2a2e39] text-gray-300 border border-[#3a3f4e]">
                            {option.technology}
                          </span>
                        </DialogTitle>
                        <DialogDescription className="text-[14.5px] text-gray-400 pt-3 leading-relaxed font-light">
                          {option.description}
                        </DialogDescription>
                      </DialogHeader>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
                        <div className="rounded-xl border border-emerald-900/20 bg-[#1c1f26] p-5">
                          <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-4">Pros</p>
                          <ul className="space-y-3">
                            {option.pros.map((pro, proIdx) => (
                              <li key={proIdx} className="text-[14px] text-gray-300 flex items-start gap-2.5">
                                <span className="text-emerald-500 mt-0.5 font-bold text-sm">•</span>
                                <span className="leading-snug font-light text-gray-300/90">{pro}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="rounded-xl border border-rose-900/20 bg-[#1c1f26] p-5">
                          <p className="text-xs font-semibold text-rose-400 uppercase tracking-wider mb-4">Cons</p>
                          <ul className="space-y-3">
                            {option.cons.map((con, conIdx) => (
                              <li key={conIdx} className="text-[14px] text-gray-300 flex items-start gap-2.5">
                                <span className="text-rose-500 mt-0.5 font-bold text-sm">•</span>
                                <span className="leading-snug font-light text-gray-300/90">{con}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Button
                    variant="outline"
                    className={`flex-1 bg-transparent hover:bg-rose-500/10 text-rose-500 border border-rose-500 text-[13px] shadow-none font-semibold transition-colors ${isGenerating || isGenerated ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    disabled={isGenerating || isGenerated}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isGenerated) return;
                      onSelect(option.id);
                      if (onGenerate) {
                        onGenerate(option);
                      }
                    }}
                  >
                    {isGenerating && selectedStackId === option.id ? (
                      <>
                        Generating...
                        <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                      </>
                    ) : isGenerated ? (
                      <>
                        Already Generated
                      </>
                    ) : (
                      <>
                        Generate
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

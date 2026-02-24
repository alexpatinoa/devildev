import React from 'react';

interface StackOption {
  id: string;
  name: string;
  description: string;
  technology: string;
  pros: string[];
  cons: string[];
}

interface StackOptionsProps {
  options: StackOption[];
  selectedStackId?: string | null;
  onSelect: (stackId: string) => void;
  isLoading?: boolean;
  requirement?: string | null;
}

export const StackOptions: React.FC<StackOptionsProps> = ({
  options,
  selectedStackId,
  onSelect,
  isLoading,
  requirement,
}) => {
  if (isLoading) {
    return (
      <div className="h-full w-full overflow-y-auto pr-2">
        <div className="mb-4">
          <div className="h-6 w-48 bg-gray-800 rounded animate-pulse" />
          <div className="mt-2 h-3 w-96 bg-gray-900 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="rounded-xl border border-gray-800 bg-gray-900/40 p-4">
              <div className="h-5 w-40 bg-gray-800 rounded animate-pulse" />
              <div className="mt-3 h-3 w-full bg-gray-900 rounded animate-pulse" />
              <div className="mt-2 h-3 w-4/5 bg-gray-900 rounded animate-pulse" />
              <div className="mt-4 h-3 w-24 bg-gray-800 rounded animate-pulse" />
              <div className="mt-2 h-3 w-3/4 bg-gray-900 rounded animate-pulse" />
              <div className="mt-2 h-3 w-2/3 bg-gray-900 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-y-auto pr-2">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-white">Stack Options</h3>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {options.map((option) => {
          const isSelected = selectedStackId === option.id;
          return (
            <button
              key={option.id}
              onClick={() => onSelect(option.id)}
              className={`text-left rounded-2xl border transition-all duration-200 p-4 group relative overflow-hidden ${
                isSelected
                  ? 'border-red-500/80 bg-gradient-to-br from-red-900/40 via-gray-900/70 to-black'
                  : 'border-gray-800 bg-gray-900/50 hover:border-red-500/60 hover:bg-gray-900/70'
              }`}
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-gradient-to-br from-red-500/5 to-transparent" />
              <div className="relative">
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-semibold text-white">{option.name}</h4>
                  {isSelected && (
                    <span className="text-[10px] uppercase tracking-wide text-red-300 border border-red-500/60 px-2 py-0.5 rounded-full">
                      Selected
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-red-200/80 uppercase tracking-wide">{option.technology}</p>
                <p className="mt-2 text-sm text-gray-300">{option.description}</p>
                <div className="mt-4">
                  <p className="text-xs font-semibold text-emerald-300 uppercase tracking-wide">Pros</p>
                  <ul className="mt-2 space-y-1 text-sm text-gray-200 list-disc ml-5">
                    {option.pros.map((pro, idx) => (
                      <li key={idx}>{pro}</li>
                    ))}
                  </ul>
                </div>
                <div className="mt-4">
                  <p className="text-xs font-semibold text-rose-300 uppercase tracking-wide">Cons</p>
                  <ul className="mt-2 space-y-1 text-sm text-gray-200 list-disc ml-5">
                    {option.cons.map((con, idx) => (
                      <li key={idx}>{con}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

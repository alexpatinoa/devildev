"use client";

import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight, Bug, ListTodo, Sparkles } from 'lucide-react';
import { Pact, PactType } from '../../../actions/project/pacts';

interface PactListProps {
  pacts: Pact[];
  pactType: PactType;
}

const pactConfig = {
  BUG: {
    label: 'Bug',
    icon: Bug,
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
    textColor: 'text-red-400',
    iconColor: 'text-red-400',
    hoverBg: 'hover:bg-red-500/20'
  },
  TASK: {
    label: 'Task',
    icon: ListTodo,
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    textColor: 'text-blue-400',
    iconColor: 'text-blue-400',
    hoverBg: 'hover:bg-blue-500/20'
  },
  FEATURE: {
    label: 'Feature',
    icon: Sparkles,
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
    textColor: 'text-purple-400',
    iconColor: 'text-purple-400',
    hoverBg: 'hover:bg-purple-500/20'
  }
};

const statusConfig = {
  PENDING: {
    label: 'Pending',
    color: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
  },
  IN_PROGRESS: {
    label: 'In Progress',
    color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
  },
  COMPLETED: {
    label: 'Completed',
    color: 'bg-green-500/20 text-green-400 border-green-500/30'
  }
};

export default function PactList({ pacts, pactType }: PactListProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const config = pactConfig[pactType as keyof typeof pactConfig];
  const Icon = config.icon;

  // Filter pacts to only show the correct type
  const filteredPacts = pacts.filter(pact => pact.type === pactType);

  const toggleExpand = (pactId: string) => {
    setExpandedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(pactId)) {
        newSet.delete(pactId);
      } else {
        newSet.add(pactId);
      }
      return newSet;
    });
  };

  if (filteredPacts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <div className={`p-6 ${config.bgColor} rounded-2xl inline-block mb-4`}>
          <Icon className={`w-12 h-12 ${config.iconColor}`} />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">
          No {config.label}s Yet
        </h3>
        <p className="text-gray-400 text-center max-w-md">
          Click the + button above to create your first {config.label.toLowerCase()}.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6 space-y-3">
      {filteredPacts.map((pact) => {
        const isExpanded = expandedIds.has(pact.id);
        const hasBody = pact.body && pact.body.trim().length > 0;

        return (
          <div
            key={pact.id}
            className={`border ${config.borderColor} ${config.bgColor} rounded-lg overflow-hidden transition-all`}
          >
            <div
              className={`p-4 cursor-pointer ${hasBody ? config.hoverBg : ''} transition-colors`}
              onClick={() => hasBody && toggleExpand(pact.id)}
            >
              <div className="flex items-start gap-3">
                {hasBody && (
                  <div className="pt-1">
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                )}
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h4 className="text-white font-medium text-base leading-tight">
                      {pact.head}
                    </h4>
                    <Badge className={statusConfig[pact.status as keyof typeof statusConfig].color}>
                      {statusConfig[pact.status as keyof typeof statusConfig].label}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Icon className="w-3 h-3" />
                    <span>{config.label}</span>
                    <span>•</span>
                    <span>{new Date(pact.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {isExpanded && hasBody && (
                <div className="mt-4 pt-4 border-t border-gray-700/50">
                  <div className="prose prose-invert prose-sm max-w-none">
                    <div className="text-gray-300 whitespace-pre-wrap break-words">
                      {pact.body}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

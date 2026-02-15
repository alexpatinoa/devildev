"use client";

import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Bug, ListTodo, Sparkles } from 'lucide-react';
import { Pact, PactType } from '../../../actions/project/pacts';
import { CreateIssueDialog } from './CreateIssueDialog';

interface PactListProps {
  pacts: Pact[];
  pactType: PactType;
  onSelectPact?: (pact: Pact) => void;
  onRefresh?: () => void;
}

const pactConfig = {
  BUG: {
    label: 'Bug',
    icon: Bug,
    bgColor: 'bg-gray-500/10',
    borderColor: 'border-gray-500/30',
    textColor: 'text-gray-300',
    iconColor: 'text-gray-400',
    hoverBg: 'hover:bg-gray-500/20'
  },
  TASK: {
    label: 'Task',
    icon: ListTodo,
    bgColor: 'bg-gray-500/10',
    borderColor: 'border-gray-500/30',
    textColor: 'text-gray-300',
    iconColor: 'text-gray-400',
    hoverBg: 'hover:bg-gray-500/20'
  },
  FEATURE: {
    label: 'Feature',
    icon: Sparkles,
    bgColor: 'bg-gray-500/10',
    borderColor: 'border-gray-500/30',
    textColor: 'text-gray-300',
    iconColor: 'text-gray-400',
    hoverBg: 'hover:bg-gray-500/20'
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

export default function PactList({ pacts, pactType, onSelectPact, onRefresh }: PactListProps) {
  const [createIssueOpen, setCreateIssueOpen] = useState(false);
  const [pactForIssue, setPactForIssue] = useState<Pact | null>(null);
  const config = pactConfig[pactType as keyof typeof pactConfig];
  const Icon = config.icon;

  if (pacts.length === 0) {
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
    <div className="h-full overflow-y-auto p-4 space-y-2 scrollbar-thin">
      {pacts.map((pact) => (
        <div
          key={pact.id}
          onClick={() => onSelectPact?.(pact)}
          className={`border ${config.borderColor} ${config.bgColor} rounded-lg p-4 cursor-pointer ${config.hoverBg} transition-all duration-200 group`}
        >
          <div className="flex items-start justify-between gap-3">
            {/* Left: Icon and Title */}
            <div className="flex-1 min-w-0 flex items-start gap-3">
              <Icon className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
              <h4 className="text-white font-medium text-sm leading-tight truncate flex-1">
                {pact.head}
              </h4>
            </div>

            {/* Right: Badge and Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <Badge className={statusConfig[pact.status as keyof typeof statusConfig].color}>
                {statusConfig[pact.status as keyof typeof statusConfig].label}
              </Badge>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setPactForIssue(pact);
                  setCreateIssueOpen(true);
                }}
                className="px-2 py-1 text-xs text-gray-400 hover:text-white hover:bg-gray-800/50 border border-gray-600 hover:border-gray-500 rounded transition-colors cursor-pointer"
                title="Create Issue"
              >
                Create Issue
              </button>
            </div>
          </div>
        </div>
      ))}
      <CreateIssueDialog 
        open={createIssueOpen} 
        onOpenChange={(open) => {
          setCreateIssueOpen(open);
          if (!open) {
            setPactForIssue(null);
          }
        }} 
        pact={pactForIssue}
        onSuccess={onRefresh}
      />
    </div>
  );
}

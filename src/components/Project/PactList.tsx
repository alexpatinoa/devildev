"use client";

import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight, Bug, ListTodo, Sparkles } from 'lucide-react';
import { Pact, PactType } from '../../../actions/project/pacts';
import { EditorContent, useEditor, EditorContext } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import { TaskList, TaskItem } from "@tiptap/extension-list";
import { Color, TextStyle } from "@tiptap/extension-text-style";
import { Placeholder, Selection } from "@tiptap/extensions";
import { Typography } from "@tiptap/extension-typography";
import { Highlight } from "@tiptap/extension-highlight";
import { Superscript } from "@tiptap/extension-superscript";
import { Subscript } from "@tiptap/extension-subscript";
import { TextAlign } from "@tiptap/extension-text-align";
import { Mathematics } from "@tiptap/extension-mathematics";
import { UniqueID } from "@tiptap/extension-unique-id";
import { UiState } from "@/components/tiptap/tiptap-extension/ui-state-extension";
import { Image } from "@/components/tiptap/tiptap-node/image-node/image-node-extension";
import { NodeBackground } from "@/components/tiptap/tiptap-extension/node-background-extension";
import { NodeAlignment } from "@/components/tiptap/tiptap-extension/node-alignment-extension";

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

function PactBodyRenderer({ body }: { body: any }) {
  const editor = useEditor({
    immediatelyRender: false,
    editable: false,
    content: body || '',
    editorProps: {
      attributes: {
        class: "prose prose-stone dark:prose-invert prose-sm max-w-none focus:outline-none text-gray-300",
      },
    },
    extensions: [
      StarterKit.configure({
        horizontalRule: false,
        dropcursor: false,
        link: { openOnClick: false },
      }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      NodeBackground,
      NodeAlignment,
      TextStyle,
      Mathematics,
      Superscript,
      Subscript,
      Color,
      TaskList,
      TaskItem.configure({ nested: true }),
      Highlight.configure({ multicolor: true }),
      Selection,
      Image,
      UniqueID.configure({
        types: [
          "paragraph",
          "bulletList",
          "orderedList",
          "taskList",
          "heading",
          "blockquote",
          "codeBlock",
        ],
      }),
      Typography,
      UiState,
    ],
  });

  if (!body || !editor) {
    return null;
  }

  return (
    <EditorContext.Provider value={{ editor }}>
      <EditorContent editor={editor} className="text-gray-300" />
    </EditorContext.Provider>
  );
}

export default function PactList({ pacts, pactType }: PactListProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const config = pactConfig[pactType as keyof typeof pactConfig];
  const Icon = config.icon;

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

  const hasBody = (body: any) => {
    if (!body) return false;
    
    // Check if there's actual content in the JSON
    const hasContent = body.content && body.content.length > 0;
    if (!hasContent) return false;
    
    // Check if all content is empty
    const allEmpty = body.content.every((node: any) => {
      if (!node.content || node.content.length === 0) return true;
      return node.content.every((textNode: any) => !textNode.text || textNode.text.trim() === '');
    });
    
    return !allEmpty;
  };

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
    <div className="h-full overflow-y-auto p-6 space-y-3">
      {pacts.map((pact) => {
        const isExpanded = expandedIds.has(pact.id);
        const pactHasBody = hasBody(pact.body);

        return (
          <div
            key={pact.id}
            className={`border ${config.borderColor} ${config.bgColor} rounded-lg overflow-hidden transition-all`}
          >
            <div
              className={`p-4 cursor-pointer ${pactHasBody ? config.hoverBg : ''} transition-colors`}
              onClick={() => pactHasBody && toggleExpand(pact.id)}
            >
              <div className="flex items-start gap-3">
                {pactHasBody && (
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

              {isExpanded && pactHasBody && (
                <div className="mt-4 pt-4 border-t border-gray-700/50">
                  <PactBodyRenderer body={pact.body} />
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

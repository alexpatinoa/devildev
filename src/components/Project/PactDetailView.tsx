"use client";

import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronLeft, MoreHorizontal, Bug, ListTodo, Sparkles, Trash2, Edit } from 'lucide-react';
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

interface PactDetailViewProps {
  pact: Pact;
  pactType: PactType;
  onBack: () => void;
}

const pactConfig = {
  BUG: {
    label: 'Bug',
    icon: Bug,
    bgColor: 'bg-gray-500/10',
    borderColor: 'border-gray-500/30',
    textColor: 'text-gray-300',
    iconColor: 'text-gray-400',
  },
  TASK: {
    label: 'Task',
    icon: ListTodo,
    bgColor: 'bg-gray-500/10',
    borderColor: 'border-gray-500/30',
    textColor: 'text-gray-300',
    iconColor: 'text-gray-400',
  },
  FEATURE: {
    label: 'Feature',
    icon: Sparkles,
    bgColor: 'bg-gray-500/10',
    borderColor: 'border-gray-500/30',
    textColor: 'text-gray-300',
    iconColor: 'text-gray-400',
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

export default function PactDetailView({ pact, pactType, onBack }: PactDetailViewProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const config = pactConfig[pactType as keyof typeof pactConfig];
  const Icon = config.icon;

  const hasBody = (body: any) => {
    if (!body) return false;
    
    // Recursively check if a node or its descendants contain any non-empty text
    const hasTextContent = (node: any): boolean => {
      // Base case: if this node has text content, check if it's non-empty
      if (node.text) {
        return node.text.trim() !== '';
      }
      
      // Recursive case: check if any child nodes have text content
      if (node.content && Array.isArray(node.content)) {
        return node.content.some((child: any) => hasTextContent(child));
      }
      
      // No text and no children means empty
      return false;
    };
    
    return hasTextContent(body);
  };

  return (
    <div className="h-full flex flex-col bg-black border-l border-gray-800">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-800 flex-shrink-0">
        <div className="flex items-start justify-between mb-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            title="Back to list"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Back</span>
          </button>
          
          <div className="relative">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-lg transition-colors"
              title="More actions"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>
            
            {isMenuOpen && (
              <>
                <div 
                  className="fixed inset-0 z-30"
                  onClick={() => setIsMenuOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-48 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-40 overflow-hidden">
                  <button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors">
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                  <button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors">
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Title */}
        <div className="flex items-start gap-3">
          <Icon className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" />
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-semibold text-white break-words">{pact.head}</h2>
          </div>
        </div>

        {/* Status Badge */}
        <div className="mt-4 flex items-center gap-2">
          <span className="text-xs text-gray-500">Status:</span>
          <Badge className={statusConfig[pact.status as keyof typeof statusConfig].color}>
            {statusConfig[pact.status as keyof typeof statusConfig].label}
          </Badge>
          <span className="text-xs text-gray-500 ml-auto">{new Date(pact.createdAt).toLocaleDateString()}</span>
        </div>
      </div>

      {/* Body Content */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {hasBody(pact.body) ? (
          <PactBodyRenderer body={pact.body} />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p className="text-sm">No description provided</p>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="px-6 py-4 border-t border-gray-800 flex-shrink-0 flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="text-gray-300 hover:text-white"
        >
          Update Status
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="text-gray-300 hover:text-white"
        >
          Edit
        </Button>
      </div>
    </div>
  );
}

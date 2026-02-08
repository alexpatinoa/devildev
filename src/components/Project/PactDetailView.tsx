"use client";

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { ChevronLeft, Bug, ListTodo, Sparkles, Trash2, Edit, ChevronDown, Maximize, Minimize, Loader2, Save, X } from 'lucide-react';
import { Pact, PactType, updatePact, updatePactStatus, deletePact, PactStatus } from '../../../actions/project/pacts';
import { Editor, EditorContent, useEditor, EditorContext } from "@tiptap/react";
import { RichTextEditor } from '@/components/tiptap/rich-text-editor';
import { StarterKit } from "@tiptap/starter-kit";
import { TaskList, TaskItem } from "@tiptap/extension-list";
import { Color, TextStyle } from "@tiptap/extension-text-style";
import { Selection } from "@tiptap/extensions";
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
  onUpdate?: () => void;
  onDelete?: () => void;
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

export default function PactDetailView({ pact, pactType, onBack, onUpdate, onDelete }: PactDetailViewProps) {
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedHead, setEditedHead] = useState(pact.head);
  const [currentHead, setCurrentHead] = useState(pact.head);
  const [currentBody, setCurrentBody] = useState(pact.body);
  const [currentStatus, setCurrentStatus] = useState<PactStatus>(pact.status);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [error, setError] = useState('');
  const config = pactConfig[pactType as keyof typeof pactConfig];
  const Icon = config.icon;

  // Sync local state when pact prop changes (from parent refetch)
  useEffect(() => {
    setCurrentHead(pact.head);
    setCurrentBody(pact.body);
    setCurrentStatus(pact.status);
  }, [pact.head, pact.body, pact.status]);

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

  const handleEditClick = () => {
    setIsEditing(true);
    setEditedHead(currentHead);
    setError('');
  };

  const handleSave = async () => {
    if (!editedHead.trim()) {
      setError('Title is required');
      return;
    }

    if (!editor) {
      setError('Editor not initialized');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      const bodyJson = editor.getJSON();
      const serializedBody = JSON.parse(JSON.stringify(bodyJson));
      
      // Update local display state BEFORE making the API call
      // This ensures the new values are ready when we exit edit mode
      setCurrentHead(editedHead.trim());
      setCurrentBody(serializedBody);
      
      const result = await updatePact(pact.id, editedHead.trim(), serializedBody);
      
      if (result.error) {
        setError(result.error);
        setIsSaving(false);
        // Revert on error
        setCurrentHead(pact.head);
        setCurrentBody(pact.body);
        return;
      }

      // Success - exit edit mode
      setIsSaving(false);
      setIsEditing(false);
      
      // Trigger parent refresh if callback provided
      if (onUpdate) {
        onUpdate();
      }
    } catch (err) {
      setError('An unexpected error occurred');
      setIsSaving(false);
      // Revert on error
      setCurrentHead(pact.head);
      setCurrentBody(pact.body);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedHead(currentHead);
    setError('');
    if (editor) {
      editor.commands.setContent(currentBody || '');
    }
  };

  const handleStatusChange = async (newStatus: PactStatus) => {
    setIsStatusDropdownOpen(false);
    
    if (newStatus === currentStatus) {
      return; // No change
    }

    setIsUpdatingStatus(true);

    try {
      const result = await updatePactStatus(pact.id, newStatus);
      
      if (result.error) {
        setError(result.error);
        setIsUpdatingStatus(false);
        return;
      }

      // Update local status immediately
      setCurrentStatus(newStatus);
      setIsUpdatingStatus(false);
      
      // Trigger parent refresh if callback provided
      if (onUpdate) {
        onUpdate();
      }
    } catch (err) {
      setError('Failed to update status');
      setIsUpdatingStatus(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }

    setIsDeleting(true);
    setError('');

    try {
      const result = await deletePact(pact.id);

      if (result.error) {
        setError(result.error);
        setIsDeleting(false);
        setConfirmDelete(false);
        return;
      }

      if (onDelete) {
        onDelete();
      }
    } catch (err) {
      setError('Failed to delete pact');
      setIsDeleting(false);
      setConfirmDelete(false);
    }
  };

  return (
    <div className={`flex flex-col bg-black ${isFullscreen ? 'fixed inset-0 z-50' : 'h-full border-l border-gray-800'}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-800 shrink-0">
        <div className="flex items-center gap-4">
          {/* Back Button */}
          <button
            onClick={onBack}
            disabled={isSaving}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Back to list"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Title with Icon */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Icon className="w-5 h-5 text-gray-400 shrink-0" />
            {isEditing ? (
              <Input
                value={editedHead}
                onChange={(e) => setEditedHead(e.target.value)}
                disabled={isSaving}
                className="flex-1 bg-gray-900/50 text-white text-lg font-semibold border-gray-700 focus:border-gray-600 transition-colors"
                placeholder="Enter title..."
                autoFocus
              />
            ) : (
              <h2 className="text-lg font-semibold text-white truncate">{currentHead}</h2>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1">
            {isEditing ? (
              <>
                {/* Cancel Button */}
                <button
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Cancel"
                >
                  <X className="w-4 h-4" />
                  <span className="text-sm">Cancel</span>
                </button>

                {/* Save Button */}
                <button
                  onClick={handleSave}
                  disabled={isSaving || !editedHead.trim()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-black hover:bg-gray-200 rounded-lg transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed disabled:text-gray-400"
                  title="Save"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span className="text-sm">Save</span>
                    </>
                  )}
                </button>
              </>
            ) : (
              <>
                {/* Status Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                    disabled={isUpdatingStatus}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${statusConfig[currentStatus as keyof typeof statusConfig].color} disabled:opacity-50 disabled:cursor-not-allowed`}
                    title="Change status"
                  >
                    {isUpdatingStatus ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Updating...</span>
                      </>
                    ) : (
                      <>
                        {statusConfig[currentStatus as keyof typeof statusConfig].label}
                        <ChevronDown className="w-3 h-3 opacity-60" />
                      </>
                    )}
                  </button>

                  {isStatusDropdownOpen && (
                    <>
                      <div 
                        className="fixed inset-0 z-30"
                        onClick={() => setIsStatusDropdownOpen(false)}
                      />
                      <div className="absolute right-0 mt-1.5 min-w-[140px] bg-zinc-900 border border-gray-700 rounded-md shadow-2xl z-40 overflow-hidden py-1">
                        {Object.entries(statusConfig).map(([key, config]) => (
                          <button
                            key={key}
                            onClick={() => handleStatusChange(key as PactStatus)}
                            className={`w-full px-3 py-1.5 text-xs font-medium text-left transition-colors ${
                              currentStatus === key 
                                ? config.color
                                : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
                            }`}
                          >
                            {config.label}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Vertical Divider */}
                <div className="w-px h-6 bg-gray-700 mx-1" />

                {/* Edit Button */}
                <button
                  onClick={handleEditClick}
                  className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-lg transition-colors"
                  title="Edit"
                >
                  <Edit className="w-5 h-5" />
                </button>

                {/* Fullscreen Button */}
                <button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-lg transition-colors"
                  title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
                >
                  {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                </button>

                {/* Delete Button */}
                {confirmDelete ? (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setConfirmDelete(false)}
                      disabled={isDeleting}
                      className="px-2 py-1 text-xs text-gray-400 hover:text-white hover:bg-gray-800/50 rounded transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="flex items-center gap-1 px-2 py-1 text-xs text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded transition-colors disabled:opacity-50"
                    >
                      {isDeleting ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Trash2 className="w-3 h-3" />
                      )}
                      {isDeleting ? 'Deleting...' : 'Confirm'}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleDelete}
                    className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </>
            )}
          </div>
        </div>
        
        {/* Error Message */}
        {error && (
          <div className="mt-3 text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
            {error}
          </div>
        )}
      </div>

      {/* Body Content */}
      {isEditing ? (
        <div className="flex-1 overflow-hidden px-6 py-4">
          <RichTextEditor
            placeholder="Add detailed description..."
            editorClassName="prose prose-stone dark:prose-invert max-w-none focus:outline-none w-full flex-1 text-gray-300"
            containerClassName="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent hover:scrollbar-thumb-gray-600"
            onEditorReady={(ed) => {
              setEditor(ed);
              if (ed && currentBody) {
                ed.commands.setContent(currentBody);
              }
            }}
          />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-6 py-4 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent hover:scrollbar-thumb-gray-600">
          {hasBody(currentBody) ? (
            <PactBodyRenderer body={currentBody} />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <p className="text-sm">No description provided</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

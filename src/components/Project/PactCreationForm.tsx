"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Bug, ListTodo, Sparkles } from 'lucide-react';
import { createPact, PactType } from '../../../actions/project/pacts';
import { Editor } from "@tiptap/react";
import { RichTextEditor } from '@/components/tiptap/rich-text-editor';

interface PactCreationFormProps {
  pactType: PactType;
  projectId: string;
  onSuccess: (pactType: PactType) => void;
  onCancel: () => void;
}

const pactConfig = {
  BUG: {
    label: 'Bug',
    icon: Bug,
    color: 'gray',
    bgColor: 'bg-gray-500/10',
    borderColor: 'border-gray-500/30',
    textColor: 'text-gray-300',
    iconColor: 'text-gray-400'
  },
  TASK: {
    label: 'Task',
    icon: ListTodo,
    color: 'gray',
    bgColor: 'bg-gray-500/10',
    borderColor: 'border-gray-500/30',
    textColor: 'text-gray-300',
    iconColor: 'text-gray-400'
  },
  FEATURE: {
    label: 'Feature',
    icon: Sparkles,
    color: 'gray',
    bgColor: 'bg-gray-500/10',
    borderColor: 'border-gray-500/30',
    textColor: 'text-gray-300',
    iconColor: 'text-gray-400'
  }
};

export default function PactCreationForm({ pactType, projectId, onSuccess, onCancel }: PactCreationFormProps) {
  const [head, setHead] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [editor, setEditor] = useState<Editor | null>(null);

  const config = pactConfig[pactType as keyof typeof pactConfig];
  const Icon = config.icon;

  useEffect(() => {
    if (editor) {
      // Clear editor content when component mounts
      editor.commands.setContent('');
    }
  }, [editor]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!head.trim()) {
      setError('Title is required');
      return;
    }

    if (!editor) {
      setError('Editor not initialized');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const bodyJson = editor.getJSON();
      // Serialize to plain JSON to avoid client reference errors
      const serializedBody = JSON.parse(JSON.stringify(bodyJson));
      const result = await createPact(projectId, pactType, head.trim(), serializedBody);
      
      if (result.error) {
        setError(result.error);
        setIsLoading(false);
        return;
      }

      // Success
      setHead('');
      editor.commands.setContent('');
      setIsLoading(false);
      onSuccess(pactType);
    } catch (err) {
      setError('An unexpected error occurred');
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (!isLoading) {
      setHead('');
      if (editor) {
        editor.commands.setContent('');
      }
      setError('');
      onCancel();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 pt-6 pb-5 border-b border-gray-800">
        <div className="flex items-center gap-3 mb-3">
          <div className={`p-2.5 ${config.bgColor} rounded-lg`}>
            <Icon className={`w-5 h-5 ${config.iconColor}`} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">
              Create New {config.label}
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              Add a new {config.label.toLowerCase()} to track in your project.
            </p>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="flex-1 flex flex-col overflow-hidden px-6 py-5 space-y-4">
        <div className="space-y-2">
          <label htmlFor="title" className="text-sm font-medium text-gray-300">
            Title <span className="text-red-400">*</span>
          </label>
          <Input
            id="title"
            placeholder={`Enter ${config.label.toLowerCase()} title...`}
            value={head}
            onChange={(e) => setHead(e.target.value)}
            disabled={isLoading}
            className="bg-gray-900/50 text-white text-base font-medium border-gray-700 focus:border-gray-600 transition-colors"
            autoFocus
          />
        </div>

        <div className="flex-1 flex flex-col overflow-hidden space-y-2">
          <label className="text-sm font-medium text-gray-300">
            Description
          </label>
          <div className="flex-1 bg-gray-900/50 rounded-lg border border-gray-700 overflow-hidden hover:border-gray-600 transition-colors focus-within:border-gray-500">
            <RichTextEditor
              placeholder="Add detailed description..."
              editorClassName="prose prose-stone dark:prose-invert max-w-none focus:outline-none px-5 py-4 w-full flex-1 min-h-[180px] text-gray-300"
              containerClassName="h-full overflow-y-auto scrollbar-thin"
              onEditorReady={setEditor}
            />
          </div>
        </div>

        {error && (
          <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
            {error}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-800 flex justify-end gap-2 flex-shrink-0">
        <Button
          type="button"
          variant="outline"
          onClick={handleCancel}
          disabled={isLoading}
          className="text-gray-300 border-gray-700 hover:bg-gray-900"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isLoading || !head.trim()}
          className="bg-white text-black hover:bg-gray-200 disabled:bg-gray-600 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            `Create ${config.label}`
          )}
        </Button>
      </div>
    </form>
  );
}

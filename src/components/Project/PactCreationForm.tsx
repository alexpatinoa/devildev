"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Bug, ListTodo, Sparkles, X, Maximize, Minimize } from 'lucide-react';
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
  const [isFullscreen, setIsFullscreen] = useState(false);

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
    <form onSubmit={handleSubmit} className={`flex flex-col bg-black ${isFullscreen ? 'fixed inset-0 z-50' : 'h-full'}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-800 shrink-0">
        <div className="flex items-center gap-4">
          {/* Icon */}
          <Icon className="w-5 h-5 text-gray-400 shrink-0" />
          
          {/* Title */}
          <h2 className="text-lg font-semibold text-white flex-1">
            Create New {config.label}
          </h2>

          {/* Action Buttons */}
          <div className="flex items-center gap-1">
            {/* Cancel Button */}
            <button
              type="button"
              onClick={handleCancel}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Cancel"
            >
              <X className="w-4 h-4" />
              <span className="text-sm">Cancel</span>
            </button>


            {/* Create Button */}
            <button
              type="submit"
              disabled={isLoading || !head.trim()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-black hover:bg-gray-200 rounded-lg transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed disabled:text-gray-400"
              title={`Create ${config.label}`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Creating...</span>
                </>
              ) : (
                <>
                  <span className="text-sm">Create {config.label}</span>
                </>
              )}
            </button>

            {/* Fullscreen Button */}
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-lg transition-colors"
              title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
            </button>
          </div>
        </div>
        
        {/* Error Message */}
        {error && (
          <div className="mt-3 text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
            {error}
          </div>
        )}
      </div>

      {/* Form Content */}
      <div className="flex-1 flex flex-col overflow-hidden px-6 py-4 space-y-4">
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
          <div className="flex-1 bg-gray-900/50 rounded-lg border border-gray-700 overflow-clip hover:border-gray-600 transition-colors focus-within:border-gray-500">
            <RichTextEditor
              placeholder="Add detailed description..."
              editorClassName="prose prose-stone dark:prose-invert max-w-none focus:outline-none pl-14 pr-5 py-4 w-full flex-1 min-h-[180px] text-gray-300"
              containerClassName="h-full overflow-y-auto scrollbar-thin"
              onEditorReady={setEditor}
            />
          </div>
        </div>
      </div>
    </form>
  );
}

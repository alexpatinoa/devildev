"use client";

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Bug, ListTodo, Sparkles } from 'lucide-react';
import { createPact, PactType } from '../../../actions/project/pacts';
import { Editor } from "@tiptap/react";
import { RichTextEditor } from '@/components/tiptap/rich-text-editor';
import { AppProvider } from "@/contexts/app-context";
import { UserProvider } from "@/contexts/user-context";

interface PactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pactType: PactType;
  projectId: string;
  onSuccess: (pactType: PactType) => void;
}

const pactConfig = {
  BUG: {
    label: 'Bug',
    icon: Bug,
    color: 'red',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
    textColor: 'text-red-400',
    iconColor: 'text-red-400'
  },
  TASK: {
    label: 'Task',
    icon: ListTodo,
    color: 'blue',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    textColor: 'text-blue-400',
    iconColor: 'text-blue-400'
  },
  FEATURE: {
    label: 'Feature',
    icon: Sparkles,
    color: 'purple',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
    textColor: 'text-purple-400',
    iconColor: 'text-purple-400'
  }
};

function PactDialogInner({ open, onOpenChange, pactType, projectId, onSuccess }: PactDialogProps) {
  const [head, setHead] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [editor, setEditor] = useState<Editor | null>(null);

  const config = pactConfig[pactType as keyof typeof pactConfig];
  const Icon = config.icon;

  useEffect(() => {
    if (editor && !open) {
      // Clear editor content when dialog closes
      editor.commands.setContent('');
    }
  }, [open, editor]);

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
      onOpenChange(false);
      onSuccess(pactType);
    } catch (err) {
      setError('An unexpected error occurred');
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setHead('');
      if (editor) {
        editor.commands.setContent('');
      }
      setError('');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className={`sm:max-w-[900px] h-[85vh] flex flex-col ${config.borderColor} p-0 gap-0`}>
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-700/50">
            <div className="flex items-center gap-3 mb-2">
              <div className={`p-3 ${config.bgColor} rounded-lg`}>
                <Icon className={`w-6 h-6 ${config.iconColor}`} />
              </div>
              <DialogTitle className="text-xl">
                Create New {config.label}
              </DialogTitle>
            </div>
            <DialogDescription>
              Add a new {config.label.toLowerCase()} to track in your project.
            </DialogDescription>
          </DialogHeader>

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
                className="bg-black/40 text-white text-lg font-medium"
                autoFocus
              />
            </div>

            <div className="flex-1 flex flex-col overflow-hidden space-y-2">
              <label className="text-sm font-medium text-gray-300">
                Description
              </label>
              <div className="flex-1 dark bg-black/40 rounded-md border border-gray-700/50 overflow-hidden">
                <RichTextEditor
                  placeholder="Add detailed description..."
                  editorClassName="prose prose-stone dark:prose-invert max-w-none focus:outline-none px-6 py-4 w-full flex-1 min-h-[200px]"
                  containerClassName="h-full overflow-auto"
                  onEditorReady={setEditor}
                />
              </div>
            </div>

            {error && (
              <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-md p-3">
                {error}
              </div>
            )}
          </div>

          <DialogFooter className="px-6 py-4 border-t border-gray-700/50">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !head.trim()}
              className={config.bgColor}
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
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function PactDialog(props: PactDialogProps) {
  return (
    <UserProvider>
      <AppProvider>
        <PactDialogInner {...props} />
      </AppProvider>
    </UserProvider>
  );
}

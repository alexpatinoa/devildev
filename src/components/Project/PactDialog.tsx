"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Bug, ListTodo, Sparkles } from 'lucide-react';
import { createPact, PactType } from '../../../actions/project/pacts';

interface PactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pactType: PactType;
  projectId: string;
  onSuccess: () => void;
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

export default function PactDialog({ open, onOpenChange, pactType, projectId, onSuccess }: PactDialogProps) {
  const [head, setHead] = useState('');
  const [body, setBody] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const config = pactConfig[pactType as keyof typeof pactConfig];
  const Icon = config.icon;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!head.trim()) {
      setError('Title is required');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await createPact(projectId, pactType, head.trim(), body.trim() || undefined);
      
      if (result.error) {
        setError(result.error);
        setIsLoading(false);
        return;
      }

      // Success
      setHead('');
      setBody('');
      setIsLoading(false);
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      setError('An unexpected error occurred');
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setHead('');
      setBody('');
      setError('');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className={`sm:max-w-[500px] ${config.borderColor}`}>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
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

          <div className="space-y-4 py-4">
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
                className="bg-black/40 text-white"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="body" className="text-sm font-medium text-gray-300">
                Description (optional)
              </label>
              <Textarea
                id="body"
                placeholder={`Add detailed description (supports markdown)...`}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                disabled={isLoading}
                className="bg-black/40 text-white min-h-[120px] resize-none"
              />
            </div>

            {error && (
              <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-md p-3">
                {error}
              </div>
            )}
          </div>

          <DialogFooter>
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

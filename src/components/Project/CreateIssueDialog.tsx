"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { Pact, createGithubIssueForPact } from "../../../actions/project/pacts";
import { convertTiptapJsonToMarkdown } from "@/lib/markdown-to-tiptap";

interface CreateIssueDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pact: Pact | null;
  onSuccess?: () => void;
}

// Pact type to label mapping
const pactTypeLabels: Record<string, string> = {
  BUG: 'Bug',
  TASK: 'Task',
  FEATURE: 'Feature',
};

export function CreateIssueDialog({ open, onOpenChange, pact, onSuccess }: CreateIssueDialogProps) {
  const [title, setTitle] = useState('');
  const [label, setLabel] = useState('');
  const [body, setBody] = useState('');
  const [activeTab, setActiveTab] = useState('write');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');

  // Initialize form when dialog opens with a pact
  useEffect(() => {
    if (open && pact) {
      setTitle(pact.head || '');
      setLabel(pactTypeLabels[pact.type] || '');
      setBody(pact.body ? convertTiptapJsonToMarkdown(pact.body) : '');
    }
  }, [open, pact]);

  const handleClose = () => {
    onOpenChange(false);
    // Reset form
    setTitle('');
    setLabel('');
    setBody('');
    setError('');
    setActiveTab('write');
  };

  const handleCreateIssue = async () => {
    if (!pact) return;
    
    setIsCreating(true);
    setError('');

    // Parse labels (comma-separated)
    const labelsArray = label
      .split(',')
      .map(l => l.trim())
      .filter(l => l.length > 0);

    // Default to pact type if no labels
    if (labelsArray.length === 0) {
      labelsArray.push(pactTypeLabels[pact.type].toLowerCase());
    }

    const result = await createGithubIssueForPact(pact.id, {
      title,
      body,
      labels: labelsArray,
    });

    setIsCreating(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    // Success - close dialog and trigger parent refresh
    handleClose();
    onSuccess?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] w-full max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Create Issue</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto space-y-4 py-4 px-1">
          {/* Title Field */}
          <div className="space-y-2">
            <label htmlFor="issue-title" className="text-sm font-medium text-gray-300">
              Title
            </label>
            <Input
              id="issue-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter issue title..."
              disabled={isCreating}
              className="bg-gray-900/50 text-white border-gray-700 focus:border-gray-600 focus-visible:ring-0"
            />
          </div>

          {/* Label Field */}
          <div className="space-y-2">
            <label htmlFor="issue-label" className="text-sm font-medium text-gray-300">
              Label
            </label>
            <Input
              id="issue-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="bug, enhancement, high-priority"
              disabled={isCreating}
              className="bg-gray-900/50 text-white border-gray-700 focus:border-gray-600 focus-visible:ring-0"
            />
          </div>

          {/* Body Field with Tabs */}
          <div className="space-y-2 flex-1 flex flex-col">
            <label className="text-sm font-medium text-gray-300">Body</label>
            <div className="flex flex-col flex-1">
              {/* Custom Tab Buttons matching devildev theme */}
              <div className="flex items-center space-x-2 mb-2">
                <button
                  onClick={() => setActiveTab('write')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 border cursor-pointer ${
                    activeTab === 'write'
                      ? 'text-white bg-gray-700/50 border-gray-600'
                      : 'text-gray-400 hover:text-white border-gray-700 hover:border-gray-600'
                  }`}
                >
                  Write
                </button>
                <div className="h-6 w-px bg-gray-700" />
                <button
                  onClick={() => setActiveTab('preview')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 border cursor-pointer ${
                    activeTab === 'preview'
                      ? 'text-white bg-gray-700/50 border-gray-600'
                      : 'text-gray-400 hover:text-white border-gray-700 hover:border-gray-600'
                  }`}
                >
                  Preview
                </button>
              </div>

              {/* Tab Content */}
              <div className="flex-1">
                {activeTab === 'write' ? (
                  <Textarea
                    id="issue-body"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Enter issue description in markdown..."
                    disabled={isCreating}
                    className="bg-gray-900/50 text-white border-gray-700 focus:border-gray-600 focus-visible:ring-0 min-h-[500px] font-mono text-sm w-full"
                  />
                ) : (
                  <div className="bg-gray-900/50 border border-gray-700 rounded-md p-4 min-h-[500px] overflow-y-auto">
                    {body ? (
                      <div className="prose prose-invert prose-sm max-w-none">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          rehypePlugins={[rehypeHighlight]}
                          components={{
                            h1: ({ children }) => <h1 className="text-2xl font-bold mb-3 text-white border-b border-gray-700 pb-2">{children}</h1>,
                            h2: ({ children }) => <h2 className="text-xl font-semibold mb-3 text-white">{children}</h2>,
                            h3: ({ children }) => <h3 className="text-lg font-medium mb-2 text-white">{children}</h3>,
                            h4: ({ children }) => <h4 className="text-base font-medium mb-2 text-gray-200">{children}</h4>,
                            h5: ({ children }) => <h5 className="text-sm font-medium mb-1 text-gray-200">{children}</h5>,
                            h6: ({ children }) => <h6 className="text-sm font-medium mb-1 text-gray-300">{children}</h6>,
                            p: ({ children }) => <p className="mb-3 text-gray-300 leading-relaxed">{children}</p>,
                            ul: ({ children }) => <ul className="list-disc ml-6 mb-3 text-gray-300 space-y-1">{children}</ul>,
                            ol: ({ children }) => <ol className="list-decimal ml-6 mb-3 text-gray-300 space-y-1">{children}</ol>,
                            li: ({ children }) => <li className="text-gray-300">{children}</li>,
                            code: ({ children, className, ...props }: any) => {
                              const match = /language-(\w+)/.exec(className || '');
                              const inline = !match;
                              return inline ? (
                                <code className="bg-gray-800 px-1.5 py-0.5 rounded text-sm text-red-300 font-mono">{children}</code>
                              ) : (
                                <code className={`${className} text-sm`}>{children}</code>
                              );
                            },
                            pre: ({ children }) => <pre className="bg-gray-800 rounded-lg p-4 mb-3 overflow-x-auto border border-gray-700">{children}</pre>,
                            blockquote: ({ children }) => <blockquote className="border-l-4 border-gray-600 pl-4 italic text-gray-400 my-3">{children}</blockquote>,
                            strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
                            em: ({ children }) => <em className="italic text-gray-300">{children}</em>,
                            a: ({ children, href }) => <a href={href} className="text-blue-400 hover:text-blue-300 underline" target="_blank" rel="noopener noreferrer">{children}</a>,
                            hr: () => <hr className="border-gray-700 my-4" />,
                            table: ({ children }) => <div className="overflow-x-auto mb-3"><table className="min-w-full border border-gray-700">{children}</table></div>,
                            thead: ({ children }) => <thead className="bg-gray-800">{children}</thead>,
                            tbody: ({ children }) => <tbody className="divide-y divide-gray-700">{children}</tbody>,
                            tr: ({ children }) => <tr className="border-b border-gray-700">{children}</tr>,
                            th: ({ children }) => <th className="px-4 py-2 text-left text-sm font-semibold text-white border border-gray-700">{children}</th>,
                            td: ({ children }) => <td className="px-4 py-2 text-sm text-gray-300 border border-gray-700">{children}</td>,
                            input: ({ checked, type, ...props }) => {
                              if (type === 'checkbox') {
                                return <input type="checkbox" checked={checked} disabled className="mr-2 cursor-default" {...props} />;
                              }
                              return <input type={type} {...props} />;
                            },
                          }}
                        >
                          {body}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">Nothing to preview</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="px-1 pb-2">
            <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
              {error}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
          <button
            onClick={handleClose}
            disabled={isCreating}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateIssue}
            disabled={isCreating || !title.trim()}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-white text-black hover:bg-gray-200 rounded-lg transition-colors font-medium disabled:bg-gray-600 disabled:cursor-not-allowed disabled:text-gray-400"
          >
            {isCreating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Issue'
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

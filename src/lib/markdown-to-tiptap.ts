import { Markdown } from '@tiptap/markdown';
import { Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TaskList, TaskItem } from '@tiptap/extension-list';
import { TextAlign } from '@tiptap/extension-text-align';
import { Highlight } from '@tiptap/extension-highlight';
import { Mathematics } from '@tiptap/extension-mathematics';
import { Superscript } from '@tiptap/extension-superscript';
import { Subscript } from '@tiptap/extension-subscript';
import { Color, TextStyle } from '@tiptap/extension-text-style';
import { Typography } from '@tiptap/extension-typography';
import { UniqueID } from '@tiptap/extension-unique-id';
import { NodeBackground } from '@/components/tiptap/tiptap-extension/node-background-extension';
import { NodeAlignment } from '@/components/tiptap/tiptap-extension/node-alignment-extension';
import { UiState } from '@/components/tiptap/tiptap-extension/ui-state-extension';
import { Image } from '@/components/tiptap/tiptap-node/image-node/image-node-extension';

/**
 * Converts markdown string to Tiptap JSON format
 * 
 * This utility creates a temporary Tiptap editor with Markdown extension,
 * parses the markdown content, extracts the JSON representation, and
 * destroys the temporary editor to prevent memory leaks.
 * 
 * @param markdown - The markdown string to convert
 * @returns Tiptap JSON document object
 */
export function convertMarkdownToTiptapJson(markdown: string) {
  // Create temporary editor with Markdown extension and common extensions
  // Match the extensions used in RichTextEditor for consistency
  const tempEditor = new Editor({
    extensions: [
      StarterKit.configure({
        horizontalRule: false,
        dropcursor: false,
      }),
      Markdown,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
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
      Image,
      UniqueID.configure({
        types: [
          'paragraph',
          'bulletList',
          'orderedList',
          'taskList',
          'heading',
          'blockquote',
          'codeBlock',
        ],
      }),
      Typography,
      UiState,
    ],
    content: markdown,
    contentType: 'markdown',
  });
  
  // Extract JSON representation
  const json = tempEditor.getJSON();
  
  // Clean up: destroy the temporary editor to prevent memory leaks
  tempEditor.destroy();
  
  return json;
}

/**
 * Converts Tiptap JSON format to markdown string
 * 
 * This utility creates a temporary Tiptap editor with Markdown extension,
 * sets the content from the JSON representation, extracts the markdown,
 * and destroys the temporary editor to prevent memory leaks.
 * 
 * @param json - The Tiptap JSON document object to convert
 * @returns Markdown string
 */
export function convertTiptapJsonToMarkdown(json: any): string {
  // Handle null/undefined or empty document
  if (!json || (json.type === 'doc' && (!json.content || json.content.length === 0))) {
    return '';
  }

  // Create temporary editor with Markdown extension and common extensions
  // Match the extensions used in RichTextEditor for consistency
  const tempEditor = new Editor({
    extensions: [
      StarterKit.configure({
        horizontalRule: false,
        dropcursor: false,
      }),
      Markdown,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
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
      Image,
      UniqueID.configure({
        types: [
          'paragraph',
          'bulletList',
          'orderedList',
          'taskList',
          'heading',
          'blockquote',
          'codeBlock',
        ],
      }),
      Typography,
      UiState,
    ],
    content: json,
  });
  
  // Extract markdown representation
  const markdown = tempEditor.getMarkdown();
  
  // Clean up: destroy the temporary editor to prevent memory leaks
  tempEditor.destroy();
  
  // Clean up &nbsp; entities and trim whitespace
  const cleaned = markdown
    .replace(/&nbsp;/g, '')  // Remove all &nbsp; entities
    .replace(/^\s+|\s+$/g, '')  // Trim leading/trailing whitespace
    .replace(/\n\s*\n\s*\n/g, '\n\n');  // Normalize multiple blank lines to double newline
  
  // Return empty string if only whitespace remains
  return cleaned || '';
}

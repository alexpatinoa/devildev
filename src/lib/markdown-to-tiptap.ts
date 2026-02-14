import { Markdown } from '@tiptap/markdown';
import { Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TaskList, TaskItem } from '@tiptap/extension-list';
import { TextAlign } from '@tiptap/extension-text-align';
import { Highlight } from '@tiptap/extension-highlight';
import { Mathematics } from '@tiptap/extension-mathematics';
import { Superscript } from '@tiptap/extension-superscript';
import { Subscript } from '@tiptap/extension-subscript';

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
      TaskList,
      TaskItem.configure({ nested: true }),
      Highlight,
      Mathematics,
      Superscript,
      Subscript,
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

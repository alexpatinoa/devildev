"use client";

import React, { useEffect } from 'react';
import { EditorContent, useEditor, EditorContext, Editor } from "@tiptap/react";
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
import { SlashDropdownMenu } from "@/components/tiptap/tiptap-ui/slash-dropdown-menu";
import { DragContextMenu } from "@/components/tiptap/tiptap-ui/drag-context-menu";
import { NotionToolbarFloating } from "@/components/tiptap/tiptap-templates/notion-like/notion-like-editor-toolbar-floating";

export interface RichTextEditorProps {
  placeholder?: string;
  editorClassName?: string;
  containerClassName?: string;
  onEditorReady?: (editor: Editor | null) => void;
}

function RichTextEditorContent() {
  const editor = React.useContext(EditorContext)?.editor;

  if (!editor) {
    return null;
  }

  return (
    <EditorContent
      editor={editor}
      className="notion-like-editor-content flex w-full flex-1 flex-col h-full overflow-auto"
    >
      <DragContextMenu />
      <SlashDropdownMenu />
      <NotionToolbarFloating />
    </EditorContent>
  );
}

export function RichTextEditor({
  placeholder = "Start writing...",
  editorClassName = "prose prose-stone dark:prose-invert max-w-none focus:outline-none pl-14 pr-5 py-4 w-full flex-1",
  containerClassName = "h-full overflow-auto",
  onEditorReady
}: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: editorClassName,
      },
    },
    extensions: [
      StarterKit.configure({
        horizontalRule: false,
        dropcursor: {
          width: 2,
        },
        link: { openOnClick: false },
      }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({
        placeholder,
        emptyNodeClass: "is-empty with-slash",
      }),
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

  useEffect(() => {
    if (editor && onEditorReady) {
      onEditorReady(editor);
    }
  }, [editor, onEditorReady]);

  if (!editor) {
    return null;
  }

  return (
    <div className={containerClassName}>
      <EditorContext.Provider value={{ editor }}>
        <RichTextEditorContent />
      </EditorContext.Provider>
    </div>
  );
}

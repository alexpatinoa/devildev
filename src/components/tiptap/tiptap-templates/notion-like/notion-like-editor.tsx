"use client"

import { useContext } from "react"
import { EditorContent, EditorContext, useEditor } from "@tiptap/react"
import { createPortal } from "react-dom"

// --- Tiptap Core Extensions ---
import { StarterKit } from "@tiptap/starter-kit"

import { TaskList, TaskItem } from "@tiptap/extension-list"
import { Color, TextStyle } from "@tiptap/extension-text-style"
import { Placeholder, Selection } from "@tiptap/extensions"
import { Typography } from "@tiptap/extension-typography"
import { Highlight } from "@tiptap/extension-highlight"
import { Superscript } from "@tiptap/extension-superscript"
import { Subscript } from "@tiptap/extension-subscript"
import { TextAlign } from "@tiptap/extension-text-align"
import { Mathematics } from "@tiptap/extension-mathematics"
import { UniqueID } from "@tiptap/extension-unique-id"


// --- Hooks ---
import { useUiEditorState } from "@/hooks/tiptap/use-ui-editor-state"
import { useScrollToHash } from "@/components/tiptap/tiptap-ui/copy-anchor-link-button/use-scroll-to-hash"

// --- Custom Extensions ---

import { UiState } from "@/components/tiptap/tiptap-extension/ui-state-extension"
import { Image } from "@/components/tiptap/tiptap-node/image-node/image-node-extension"
import { NodeBackground } from "@/components/tiptap/tiptap-extension/node-background-extension"
import { NodeAlignment } from "@/components/tiptap/tiptap-extension/node-alignment-extension"

// --- Tiptap Node ---




// --- Tiptap UI ---

import { SlashDropdownMenu } from "@/components/tiptap/tiptap-ui/slash-dropdown-menu"
import { DragContextMenu } from "@/components/tiptap/tiptap-ui/drag-context-menu"
import { AppProvider } from "@/contexts/app-context"
import { UserProvider } from "@/contexts/user-context"

// --- Lib ---


// --- Styles ---


// --- Content ---
import { NotionEditorHeader } from "@/components/tiptap/tiptap-templates/notion-like/notion-like-editor-header"
import { MobileToolbar } from "@/components/tiptap/tiptap-templates/notion-like/notion-like-editor-mobile-toolbar"
import { NotionToolbarFloating } from "@/components/tiptap/tiptap-templates/notion-like/notion-like-editor-toolbar-floating"

export interface NotionEditorProps {
  placeholder?: string
}

export interface EditorProviderProps {
  placeholder?: string
}

/**
 * Loading spinner component shown while connecting to the notion server
 */
export function LoadingSpinner({ text = "Connecting..." }: { text?: string }) {
  return (
    <div className="flex min-h-screen w-full flex-grow flex-col items-center justify-center">
      <div className="flex flex-col items-center justify-center gap-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          className="h-5 w-5 animate-spin text-gray-900/25 dark:text-gray-100/25"
        >
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <div className="text-center text-sm text-gray-500 dark:text-gray-400">{text}</div>
      </div>
    </div>
  )
}

/**
 * EditorContent component that renders the actual editor
 */
export function EditorContentArea() {
  const { editor } = useContext(EditorContext)!
  const {
    isDragging,
  } = useUiEditorState(editor)

  useScrollToHash()

  if (!editor) {
    return null
  }

  return (
    <EditorContent
      editor={editor}
      role="presentation"
      className="notion-like-editor-content flex w-full max-w-3xl flex-1 flex-col mx-auto h-full"
      style={{
        cursor: isDragging ? "grabbing" : "auto",
      }}
    >
      <DragContextMenu />
      <SlashDropdownMenu />
      <NotionToolbarFloating />

      {createPortal(<MobileToolbar />, document.body)}
    </EditorContent>
  )
}

/**
 * Component that creates and provides the editor instance
 */
export function EditorProvider(props: EditorProviderProps) {
  const { placeholder = "Start writing..." } = props

  const editor = useEditor({
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "prose prose-stone dark:prose-invert max-w-none focus:outline-none px-8 py-8 pb-[20vh] md:px-6 w-full flex-1",
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
  })

  if (!editor) {
    return <LoadingSpinner />
  }

  return (
    <div className="notion-like-editor-wrapper h-screen w-full overflow-auto md:w-auto md:h-auto md:overflow-visible">
      <EditorContext.Provider value={{ editor }}>
        <NotionEditorHeader />
        <EditorContentArea />
      </EditorContext.Provider>


    </div>
  )
}

/**
 * Full editor with all necessary providers, ready to use with just a room ID
 */
export function NotionEditor({
  placeholder = "Start writing...",
}: NotionEditorProps) {
  return (
    <UserProvider>
      <AppProvider>
        <NotionEditorContent placeholder={placeholder} />
      </AppProvider>
    </UserProvider>
  )
}

/**
 * Internal component that handles the editor loading state
 */
export function NotionEditorContent({ placeholder }: { placeholder?: string }) {
  return (
    <EditorProvider
      placeholder={placeholder}
    />
  )
}

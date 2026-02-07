

// --- Tiptap UI ---
import { UndoRedoButton } from "@/components/tiptap/tiptap-ui/undo-redo-button"

// --- UI Primitives ---
import { Spacer } from "@/components/tiptap/tiptap-ui-primitive/spacer"
import { Separator } from "@/components/tiptap/tiptap-ui-primitive/separator"
import { ButtonGroup } from "@/components/tiptap/tiptap-ui-primitive/button"

// --- Styles ---


export function NotionEditorHeader() {
  return (
    <header className="sticky top-0 z-50 flex h-12 w-full items-center justify-between border-b border-gray-200 bg-white px-3 py-2 dark:border-gray-800 dark:bg-black">
      <Spacer />
      <div className="flex flex-row items-center gap-2">
        <ButtonGroup orientation="horizontal">
          <UndoRedoButton action="undo" />
          <UndoRedoButton action="redo" />
        </ButtonGroup>

        <Separator />


      </div>
    </header>
  )
}

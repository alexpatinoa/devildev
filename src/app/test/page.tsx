import { NotionEditor } from "@/components/tiptap/tiptap-templates/notion-like/notion-like-editor"

export default function EditorPage() {
    return <div className="dark bg-black h-screen w-screen">
        <NotionEditor placeholder="Start writing..." />
    </div> 
    
}

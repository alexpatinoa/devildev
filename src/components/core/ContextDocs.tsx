"use client"

import * as React from "react"
import { Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"

interface StackData {
  id: string
  prd?: string | null
}

interface ArchOptionsData {
  id: string
  stacks: StackData[]
}

interface ArchitectureVersion {
  metadata: {
    id: string
    stackId?: string | null
  }
}

export default function ContextDocs({
  archOptionsHistory,
  selectedVersionIndex,
  allArchitectures,
}: {
  archOptionsHistory: ArchOptionsData[]
  selectedVersionIndex: number
  allArchitectures: ArchitectureVersion[]
}) {
  const [selectedFile, setSelectedFile] = React.useState<string | null>(null)
  const [isCopied, setIsCopied] = React.useState(false)

  const prdEntries = React.useMemo(() => {
    if (allArchitectures.length === 0 || archOptionsHistory.length === 0) return []
    const entries: { fileName: string; content: string; versionIndex: number }[] = []

    allArchitectures.forEach((arch, index) => {
      const stackId = arch.metadata?.stackId
      if (!stackId) return

      let stack: StackData | null = null
      for (const optionSet of archOptionsHistory) {
        const found = optionSet.stacks.find((s) => s.id === stackId)
        if (found) {
          stack = found
          break
        }
      }

      const prd = stack?.prd?.trim() || ""
      if (!prd) return

      entries.push({
        fileName: `PRDv${index + 1}.md`,
        content: prd,
        versionIndex: index,
      })
    })

    return entries.sort((a, b) => b.versionIndex - a.versionIndex)
  }, [allArchitectures, archOptionsHistory])

  const hasPrd = prdEntries.length > 0
  const selectedEntry = prdEntries.find((entry) => entry.fileName === selectedFile) ?? prdEntries[0]
  const prdContent = selectedEntry?.content ?? ""

  React.useEffect(() => {
    if (!hasPrd) {
      setSelectedFile(null)
      return
    }
    const defaultFile = prdEntries[0]?.fileName ?? null
    setSelectedFile((current) => (current ? current : defaultFile))
  }, [hasPrd, prdEntries])

  const handleCopy = async () => {
    if (!hasPrd) return
    try {
      await navigator.clipboard.writeText(prdContent)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 1500)
    } catch (error) {
      console.error("Failed to copy content:", error)
    }
  }

  return (
    <div className="h-full bg-black text-white flex border border-gray-800 rounded-lg overflow-hidden">
      <div className="w-56 bg-black border-r border-gray-800 flex flex-col">
        <div className="h-11 px-4 border-b border-gray-800 flex items-center">
          <p className="text-xs uppercase tracking-widest text-gray-400">Files</p>
        </div>
        <div className="flex-1 overflow-auto p-2">
          {hasPrd
            ? prdEntries.map((entry) => (
                <button
                  key={entry.fileName}
                  onClick={() => setSelectedFile(entry.fileName)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    selectedFile === entry.fileName
                      ? "bg-gray-800 text-white"
                      : "text-gray-300 hover:bg-gray-800/60 hover:text-white"
                  }`}
                >
                  {entry.fileName}
                </button>
              ))
            : null}
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="h-11 px-4 border-b border-gray-800 flex items-center justify-between">
          <p className="text-sm text-gray-300">
            Docs <span className="text-gray-500">/</span>{" "}
            <span className="text-white">{selectedEntry?.fileName || "PRD"}</span>
          </p>
          <Button
            variant="ghost"
            size="icon"
            className="w-8 h-8 text-white/60 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/30 transition-all duration-200"
            onClick={handleCopy}
            disabled={!hasPrd}
          >
            {isCopied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
          </Button>
        </div>
        <div className="flex-1 overflow-auto p-4">
          {hasPrd ? (
            <pre className="whitespace-pre-wrap text-sm leading-6 text-gray-100">{prdContent}</pre>
          ) : (
            <div className="h-full w-full flex items-center justify-center text-sm text-gray-400">
              No PRD generated. You can generate one by clicking Generate in Stack Options tab.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

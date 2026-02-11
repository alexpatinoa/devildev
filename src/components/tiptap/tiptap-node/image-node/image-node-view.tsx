import { useCallback, useEffect, useRef, useState } from "react"
import type { Editor, NodeViewProps } from "@tiptap/react"
import { NodeViewWrapper, NodeViewContent } from "@tiptap/react"
import { NodeSelection } from "@tiptap/pm/state"

import { isValidPosition, cn } from "@/lib/tiptap-utils"

export interface ResizeParams {
  handleUsed: "left" | "right"
  initialWidth: number
  initialClientX: number
}

export interface ResizableImageProps
  extends React.HTMLAttributes<HTMLDivElement> {
  src: string
  alt?: string
  editor?: Editor
  minWidth?: number
  maxWidth?: number
  align?: "left" | "center" | "right"
  initialWidth?: number
  showCaption?: boolean
  hasContent?: boolean
  onImageResize?: (width?: number) => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onUpdateAttributes?: (attrs: Record<string, any>) => void
  getPos: () => number | undefined
  nodeSize?: number
  selected?: boolean
}

export function ImageNodeView(props: NodeViewProps) {
  const { editor, node, updateAttributes, getPos, selected } = props
  const hasContent = node.content.size > 0

  return (
    <ResizableImage
      src={node.attrs.src}
      alt={node.attrs.alt || ""}
      editor={editor}
      align={node.attrs["data-align"]}
      initialWidth={node.attrs.width}
      showCaption={node.attrs.showCaption}
      hasContent={hasContent}
      nodeSize={node.nodeSize}
      onImageResize={(width) => updateAttributes({ width })}
      onUpdateAttributes={updateAttributes}
      getPos={getPos}
      selected={selected}
    />
  )
}

export const ResizableImage: React.FC<ResizableImageProps> = ({
  src,
  alt = "",
  editor,
  minWidth = 96,
  maxWidth = 800,
  align = "left",
  initialWidth,
  showCaption = false,
  hasContent = false,
  nodeSize,
  onImageResize,
  onUpdateAttributes,
  getPos,
  selected = false,
}) => {
  const [resizeParams, setResizeParams] = useState<ResizeParams | undefined>()
  const [width, setWidth] = useState<number | undefined>(initialWidth)
  const [showHandles, setShowHandles] = useState(false)
  const isResizingRef = useRef(false)

  const wrapperRef = useRef<HTMLDivElement>(null)
  const leftResizeHandleRef = useRef<HTMLDivElement>(null)
  const rightResizeHandleRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)

  // Listen to editor selection changes to detect when focus leaves the caption
  useEffect(() => {
    if (!editor || !showCaption) return

    const handleSelectionUpdate = () => {
      const pos = getPos()
      if (!isValidPosition(pos) || !nodeSize) return

      const { from, to } = editor.state.selection
      const nodeStart = pos
      const nodeEnd = pos + nodeSize

      // Check if selection is outside this image node
      const isOutsideNode = to < nodeStart || from > nodeEnd

      if (isOutsideNode && !hasContent && onUpdateAttributes) {
        onUpdateAttributes({ showCaption: false })
      }
    }

    editor.on("selectionUpdate", handleSelectionUpdate)
    return () => {
      editor.off("selectionUpdate", handleSelectionUpdate)
    }
  }, [editor, showCaption, hasContent, getPos, nodeSize, onUpdateAttributes])

  // Had to manually set the node selection on image click because
  // We treat the image-node-extension.ts as content: "inline*"
  const handleImageClick = useCallback(
    (event: React.MouseEvent) => {
      if (!editor || !getPos || resizeParams) return

      event.preventDefault()
      event.stopPropagation()

      const pos = getPos()
      if (isValidPosition(pos)) {
        editor.chain().focus().setNodeSelection(pos).run()
      }
    },
    [editor, getPos, resizeParams]
  )

  const windowMouseMoveHandler = useCallback(
    (event: MouseEvent | TouchEvent): void => {
      if (!resizeParams || !editor) return

      const clientX =
        "touches" in event ? (event.touches[0]?.clientX ?? 0) : event.clientX
      const isLeftHandle = resizeParams.handleUsed === "left"
      const multiplier = align === "center" ? 2 : 1

      const delta = isLeftHandle
        ? (resizeParams.initialClientX - clientX) * multiplier
        : (clientX - resizeParams.initialClientX) * multiplier

      const newWidth = resizeParams.initialWidth + delta
      const effectiveMaxWidth =
        editor.view.dom?.firstElementChild?.clientWidth || maxWidth
      const clampedWidth = Math.min(
        Math.max(newWidth, minWidth),
        effectiveMaxWidth
      )

      setWidth(clampedWidth)
      if (wrapperRef.current) {
        wrapperRef.current.style.width = `${clampedWidth}px`
      }
    },
    [editor, align, maxWidth, minWidth, resizeParams]
  )

  const windowMouseUpHandler = useCallback(
    (event: MouseEvent | TouchEvent): void => {
      if (!editor) return

      const target =
        "touches" in event
          ? document.elementFromPoint(
            event.changedTouches[0]?.clientX ?? 0,
            event.changedTouches[0]?.clientY ?? 0
          )
          : event.target

      const isInsideWrapper =
        target && wrapperRef.current?.contains(target as Node)

      if ((!isInsideWrapper || !editor.isEditable) && showHandles) {
        setShowHandles(false)
      }

      if (!resizeParams) return

      const wasNodeSelection =
        editor.state.selection instanceof NodeSelection &&
        editor.state.selection.node.type.name === "image"

      setResizeParams(undefined)
      onImageResize?.(width)

      // Restore the node selection after resizing
      // This because we treat the image-node-extension.ts as content: "inline*"
      const pos = getPos()

      // Had to use isResizingRef flag because during resizing,
      // the selection gets lost and cannot be detected here
      // Its because image-node-extension.ts contain content: "inline*"
      if (isValidPosition(pos) && wasNodeSelection) {
        editor.chain().focus().setNodeSelection(pos).run()
      }

      isResizingRef.current = false
    },
    [editor, getPos, onImageResize, resizeParams, showHandles, width]
  )

  const startResize = useCallback(
    (handleUsed: "left" | "right", clientX: number) => {
      setResizeParams({
        handleUsed,
        initialWidth: wrapperRef.current?.clientWidth ?? minWidth,
        initialClientX: clientX,
      })
      isResizingRef.current = true
    },
    [minWidth]
  )

  const leftResizeHandleMouseDownHandler = (
    event: React.MouseEvent<HTMLDivElement>
  ) => {
    event.preventDefault()
    event.stopPropagation()
    startResize("left", event.clientX)
  }

  const leftResizeHandleTouchStartHandler = (
    event: React.TouchEvent<HTMLDivElement>
  ) => {
    event.preventDefault()
    const touch = event.touches[0]
    if (touch) startResize("left", touch.clientX)
  }

  const rightResizeHandleMouseDownHandler = (
    event: React.MouseEvent<HTMLDivElement>
  ) => {
    event.preventDefault()
    event.stopPropagation()
    startResize("right", event.clientX)
  }

  const rightResizeHandleTouchStartHandler = (
    event: React.TouchEvent<HTMLDivElement>
  ) => {
    event.preventDefault()
    const touch = event.touches[0]
    if (touch) startResize("right", touch.clientX)
  }

  const wrapperMouseEnterHandler = () => {
    if (editor?.isEditable) setShowHandles(true)
  }

  const wrapperMouseLeaveHandler = (
    event: React.MouseEvent<HTMLDivElement>
  ) => {
    if (
      event.relatedTarget === leftResizeHandleRef.current ||
      event.relatedTarget === rightResizeHandleRef.current ||
      resizeParams
    )
      return

    if (editor?.isEditable) setShowHandles(false)
  }

  const wrapperTouchStartHandler = () => {
    if (editor?.isEditable) setShowHandles(true)
  }

  useEffect(() => {
    window.addEventListener("mousemove", windowMouseMoveHandler)
    window.addEventListener("mouseup", windowMouseUpHandler)
    window.addEventListener("touchmove", windowMouseMoveHandler, {
      passive: false,
    })
    window.addEventListener("touchend", windowMouseUpHandler)

    return () => {
      window.removeEventListener("mousemove", windowMouseMoveHandler)
      window.removeEventListener("mouseup", windowMouseUpHandler)
      window.removeEventListener("touchmove", windowMouseMoveHandler)
      window.removeEventListener("touchend", windowMouseUpHandler)
    }
  }, [windowMouseMoveHandler, windowMouseUpHandler])

  const shouldShowCaption = showCaption || hasContent

  return (
    <NodeViewWrapper
      onMouseEnter={wrapperMouseEnterHandler}
      onMouseLeave={wrapperMouseLeaveHandler}
      onTouchStart={wrapperTouchStartHandler}
      data-align={align}
      data-width={width}
      className={cn(
        "flex w-full my-6 select-none",
        /** Alignment */
        align === "left" && "justify-start",
        align === "center" && "justify-center",
        align === "right" && "justify-end"
      )}
    >
      <div
        ref={wrapperRef}
        className={cn(
          "flex flex-col select-none relative transition-[outline,width] duration-100 ease-in-out",
          selected && "outline-2 outline-blue-500 rounded-sm"
        )}
        style={{ width: width ? `${width}px` : "fit-content" }}
      >
        <div className="flex items-center relative max-w-full">
          <img
            ref={imageRef}
            src={src}
            alt={alt}
            className="w-full rounded-md object-cover"
            contentEditable={false}
            draggable={false}
            onClick={handleImageClick}
            style={{ cursor: editor?.isEditable ? "pointer" : "default" }}
          />

          {showHandles && editor?.isEditable && (
            <>
              <div
                ref={leftResizeHandleRef}
                className="absolute top-1/2 w-1.5 h-12 bg-blue-500 rounded-full cursor-col-resize -translate-y-1/2 z-10 transition-colors left-1 border border-white shadow-sm"
                onMouseDown={leftResizeHandleMouseDownHandler}
                onTouchStart={leftResizeHandleTouchStartHandler}
              />
              <div
                ref={rightResizeHandleRef}
                className="absolute top-1/2 w-1.5 h-12 bg-blue-500 rounded-full cursor-col-resize -translate-y-1/2 z-10 transition-colors right-1 border border-white shadow-sm"
                onMouseDown={rightResizeHandleMouseDownHandler}
                onTouchStart={rightResizeHandleTouchStartHandler}
              />
            </>
          )}
        </div>

        {editor?.isEditable && shouldShowCaption && (
          <NodeViewContent
            as="div"
            className="tiptap-image-caption"
            data-placeholder="Add a caption..."
          />
        )}
      </div>
    </NodeViewWrapper>
  )
}

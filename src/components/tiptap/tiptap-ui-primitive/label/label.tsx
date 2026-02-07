"use client"

import { cn } from "@/lib/tiptap-utils"
import { createElement, forwardRef } from "react"


export interface BaseProps extends React.HTMLAttributes<HTMLElement> {
  as?: "label" | "div"
  onMouseDown?: React.MouseEventHandler<HTMLElement>
}

export type LabelProps<T extends "label" | "div"> = T extends "label"
  ? BaseProps & { htmlFor?: string }
  : BaseProps

export const Label = forwardRef<
  HTMLElement,
  LabelProps<"label"> | LabelProps<"div">
>(({ as = "div", ...props }, ref) => {
  const renderProps = { ...props }

  if (as === "label") {
    renderProps.onMouseDown = (event: React.MouseEvent<HTMLElement>) => {
      // only prevent text selection if clicking inside the label itself
      const target = event.target as HTMLElement
      if (target.closest("button, input, select, textarea")) return
      props.onMouseDown?.(event)
      // prevent text selection when double clicking label
      if (!event.defaultPrevented && event.detail > 1) event.preventDefault()
    }
  }

  return createElement(as, {
    ...renderProps,
    ref,
    className: cn(
      "mt-3 ml-2 mr-2 mb-1 text-xs font-semibold capitalize leading-normal text-gray-800 dark:text-gray-200",
      props.className
    ),
  })
})

Label.displayName = "Label"

export default Label

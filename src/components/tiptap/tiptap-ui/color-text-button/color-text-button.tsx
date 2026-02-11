import { forwardRef, useCallback, useMemo } from "react"
import { cn } from "@/lib/tiptap-utils"

// --- Lib ---
import { parseShortcutKeys } from "@/lib/tiptap-utils"

// --- Hooks ---
import { useTiptapEditor } from "@/hooks/tiptap/use-tiptap-editor"

// --- Tiptap UI ---
import type { UseColorTextConfig } from "@/components/tiptap/tiptap-ui/color-text-button"
import {
  COLOR_TEXT_SHORTCUT_KEY,
  useColorText,
} from "@/components/tiptap/tiptap-ui/color-text-button"

// --- UI Primitives ---
import type { ButtonProps } from "@/components/tiptap/tiptap-ui-primitive/button"
import { Button } from "@/components/tiptap/tiptap-ui-primitive/button"
import { Badge } from "@/components/tiptap/tiptap-ui-primitive/badge"


export interface ColorTextButtonProps
  extends Omit<ButtonProps, "type">,
  UseColorTextConfig {
  /**
   * Optional text to display alongside the icon.
   */
  text?: string
  /**
   * Optional show shortcut keys in the button.
   * @default false
   */
  showShortcut?: boolean
}

export function ColorTextShortcutBadge({
  shortcutKeys = COLOR_TEXT_SHORTCUT_KEY,
}: {
  shortcutKeys?: string
}) {
  return <Badge>{parseShortcutKeys({ shortcutKeys })}</Badge>
}

/**
 * Button component for applying text colors in a Tiptap editor.
 *
 * For custom button implementations, use the `useColorText` hook instead.
 */
export const ColorTextButton = forwardRef<
  HTMLButtonElement,
  ColorTextButtonProps
>(
  (
    {
      editor: providedEditor,
      textColor,
      text,
      hideWhenUnavailable = false,
      onApplied,
      showShortcut = false,
      onClick,
      children,
      style,
      ...buttonProps
    },
    ref
  ) => {
    const { editor } = useTiptapEditor(providedEditor)
    const {
      isVisible,
      canColorText,
      isActive,
      handleColorText,
      label,
      shortcutKeys,
      Icon,
    } = useColorText({
      editor,
      textColor,
      label: text || `Color text to ${textColor}`,
      hideWhenUnavailable,
      onApplied,
    })

    const handleClick = useCallback(
      (event: React.MouseEvent<HTMLButtonElement>) => {
        onClick?.(event)
        if (event.defaultPrevented) return
        handleColorText()
      },
      [handleColorText, onClick]
    )

    const buttonStyle = useMemo(
      () =>
        ({
          ...style,
          "--color-text-button-color": textColor,
        }) as React.CSSProperties,
      [textColor, style]
    )

    if (!isVisible) {
      return null
    }

    return (
      <Button
        type="button"
        variant="ghost"
        data-active-state={isActive ? "on" : "off"}
        role="button"
        tabIndex={-1}
        disabled={!canColorText}
        data-disabled={!canColorText}
        aria-label={label}
        aria-pressed={isActive}
        tooltip={label}
        onClick={handleClick}
        style={buttonStyle}
        {...buttonProps}
        ref={ref}
      >
        {children ?? (
          <>
            <span
              className={cn(
                "relative flex items-center justify-center w-5 h-5 -mx-0.5 rounded-xl transition-transform ease-out duration-200",
                "after:content-[''] after:absolute after:w-full after:h-full after:left-0 after:top-0 after:rounded-[inherit] after:box-border after:border after:border-[var(--color-text-button-color)] after:opacity-50 after:mix-blend-multiply after:brightness-150 dark:after:mix-blend-lighten dark:after:brightness-140",
                isActive && "after:brightness-90 dark:after:brightness-150"
              )}
              style={{ color: textColor }}
            >
              <Icon
                className="w-4 h-4 flex-grow"
                style={{ color: textColor }}
              />
            </span>
            {text && <span className="text-sm font-medium">{text}</span>}
            {showShortcut && (
              <ColorTextShortcutBadge shortcutKeys={shortcutKeys} />
            )}
          </>
        )}
      </Button>
    )
  }
)

ColorTextButton.displayName = "ColorTextButton"

import { useEffect, useMemo, useRef } from "react"
import { cn } from "@/lib/tiptap-utils"

// --- Lib ---
import { getElementOverflowPosition } from "@/lib/tiptap-utils"

// --- Tiptap UI ---
import type {
  SuggestionMenuProps,
  SuggestionItem,
  SuggestionMenuRenderProps,
} from "@/components/tiptap/tiptap-ui-utils/suggestion-menu"
import { filterSuggestionItems } from "@/components/tiptap/tiptap-ui-utils/suggestion-menu"
import { SuggestionMenu } from "@/components/tiptap/tiptap-ui-utils/suggestion-menu"

// --- Hooks ---
import type { SlashMenuConfig } from "@/components/tiptap/tiptap-ui/slash-dropdown-menu/use-slash-dropdown-menu"
import { useSlashDropdownMenu } from "@/components/tiptap/tiptap-ui/slash-dropdown-menu/use-slash-dropdown-menu"

// --- UI Primitives ---
import { Button, ButtonGroup } from "@/components/tiptap/tiptap-ui-primitive/button"
import { Separator } from "@/components/tiptap/tiptap-ui-primitive/separator"
import {
  Card,
  CardBody,
  CardGroupLabel,
  CardItemGroup,
} from "@/components/tiptap/tiptap-ui-primitive/card"


type SlashDropdownMenuProps = Omit<
  SuggestionMenuProps,
  "items" | "children"
> & {
  config?: SlashMenuConfig
}

export const SlashDropdownMenu = (props: SlashDropdownMenuProps) => {
  const { config, ...restProps } = props
  const { getSlashMenuItems } = useSlashDropdownMenu(config)

  return (
    <SuggestionMenu
      char="/"
      pluginKey="slashDropdownMenu"
      decorationClass="inline-block bg-gray-100 dark:bg-gray-800 rounded-sm outline-[5.5px] outline-gray-100 dark:outline-gray-800 [&.is-empty]:after:content-[attr(data-decoration-content)] [&.is-empty]:after:text-gray-400 dark:[&.is-empty]:after:text-gray-500"
      decorationContent="Filter..."
      selector="tiptap-slash-dropdown-menu"
      items={({ query, editor }) =>
        filterSuggestionItems(getSlashMenuItems(editor), query)
      }
      {...restProps}
    >
      {(props) => <List {...props} config={config} />}
    </SuggestionMenu>
  )
}

const Item = (props: {
  item: SuggestionItem
  isSelected: boolean
  onSelect: () => void
}) => {
  const { item, isSelected, onSelect } = props
  const itemRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const selector = document.querySelector(
      '[data-selector="tiptap-slash-dropdown-menu"]'
    ) as HTMLElement
    if (!itemRef.current || !isSelected || !selector) return

    const overflow = getElementOverflowPosition(itemRef.current, selector)

    if (overflow === "top") {
      itemRef.current.scrollIntoView(true)
    } else if (overflow === "bottom") {
      itemRef.current.scrollIntoView(false)
    }
  }, [isSelected])

  const BadgeIcon = item.badge

  return (
    <Button
      ref={itemRef}
      variant="ghost"
      className={cn(
        "w-full justify-start text-left",
        isSelected && "bg-gray-100 dark:bg-gray-800"
      )}
      onClick={onSelect}
    >
      {BadgeIcon && <BadgeIcon className="h-4 w-4 mr-2" />}
      <div className="flex-1 truncate">{item.title}</div>
    </Button>
  )
}

const List = ({
  items,
  selectedIndex,
  onSelect,
  config,
}: SuggestionMenuRenderProps & { config?: SlashMenuConfig }) => {
  const renderedItems = useMemo(() => {
    const rendered: React.ReactElement[] = []
    const showGroups = config?.showGroups !== false

    if (!showGroups) {
      items.forEach((item, index) => {
        rendered.push(
          <Item
            key={`item-${index}-${item.title}`}
            item={item}
            isSelected={index === selectedIndex}
            onSelect={() => onSelect(item)}
          />
        )
      })
      return rendered
    }

    const groups: {
      [groupLabel: string]: { items: SuggestionItem[]; indices: number[] }
    } = {}

    items.forEach((item, index) => {
      const groupLabel = item.group || ""
      if (!groups[groupLabel]) {
        groups[groupLabel] = { items: [], indices: [] }
      }
      groups[groupLabel].items.push(item)
      groups[groupLabel].indices.push(index)
    })

    Object.entries(groups).forEach(([groupLabel, groupData], groupIndex) => {
      if (groupIndex > 0) {
        rendered.push(
          <Separator key={`separator-${groupIndex}`} orientation="horizontal" className="my-1" />
        )
      }

      const groupItems = groupData.items.map((item, itemIndex) => {
        const originalIndex = groupData.indices[itemIndex]
        return (
          <Item
            key={`item-${originalIndex}-${item.title}`}
            item={item}
            isSelected={originalIndex === selectedIndex}
            onSelect={() => onSelect(item)}
          />
        )
      })

      if (groupLabel) {
        rendered.push(
          <CardItemGroup key={`group-${groupIndex}-${groupLabel}`} className="w-full">
            <CardGroupLabel>{groupLabel}</CardGroupLabel>
            <ButtonGroup className="flex flex-col gap-0.5 w-full">{groupItems}</ButtonGroup>
          </CardItemGroup>
        )
      } else {
        rendered.push(...groupItems)
      }
    })

    return rendered
  }, [items, selectedIndex, onSelect, config?.showGroups])

  if (!renderedItems.length) {
    return null
  }

  return (
    <Card
      className="min-w-[15rem] overflow-hidden"
      style={{
        maxHeight: "var(--suggestion-menu-max-height)",
      }}
    >
      <CardBody className="w-full p-2">{renderedItems}</CardBody>
    </Card>
  )
}

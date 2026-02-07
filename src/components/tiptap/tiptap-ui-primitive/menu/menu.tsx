import { forwardRef, useCallback, useMemo, useRef, useState } from "react"
import * as Ariakit from "@ariakit/react"

// -- Hooks --
import { useOnClickOutside } from "@/hooks/tiptap/use-on-click-outside"
import { useComposedRef } from "@/hooks/tiptap/use-composed-ref"

// -- Utils --
import { cn } from "@/lib/tiptap-utils"

// -- UI Primitives --
import {
  ComboboxItem,
  ComboboxProvider,
} from "@/components/tiptap/tiptap-ui-primitive/combobox"
import { Label } from "@/components/tiptap/tiptap-ui-primitive/label"

// -- Local imports --
import type {
  MenuProps,
  MenuContentProps,
  MenuItemProps,
} from "@/components/tiptap/tiptap-ui-primitive/menu"
import {
  SearchableContext,
  MenuContext,
  useSearchableContext,
  useMenuContext,
} from "@/components/tiptap/tiptap-ui-primitive/menu"
import {
  useMenuPlacement,
  useMenuItemClick,
} from "@/components/tiptap/tiptap-ui-primitive/menu"

// -- Styles --


export function Menu({
  children,
  trigger,
  value,
  onOpenChange,
  onValueChange,
  onValuesChange,
  ...props
}: MenuProps) {
  const isRootMenu = !Ariakit.useMenuContext()
  const [open, setOpen] = useState<boolean>(false)
  const searchable = !!onValuesChange || isRootMenu

  const handleOpenChange = useCallback(
    (v: boolean) => {
      if (props.open === undefined) {
        setOpen(v)
      }
      onOpenChange?.(v)
    },
    [props.open, onOpenChange]
  )

  const menuContextValue = useMemo(
    () => ({
      isRootMenu,
      open: props.open ?? open,
    }),
    [isRootMenu, props.open, open]
  )

  const menuProvider = (
    <Ariakit.MenuProvider
      open={open}
      setOpen={handleOpenChange}
      setValues={onValuesChange}
      showTimeout={100}
      {...props}
    >
      {trigger}
      <MenuContext.Provider value={menuContextValue}>
        <SearchableContext.Provider value={searchable}>
          {children}
        </SearchableContext.Provider>
      </MenuContext.Provider>
    </Ariakit.MenuProvider>
  )

  if (searchable) {
    return (
      <ComboboxProvider value={value} setValue={onValueChange}>
        {menuProvider}
      </ComboboxProvider>
    )
  }

  return menuProvider
}

export function MenuContent({
  children,
  className,
  ref,
  onClickOutside,
  ...props
}: MenuContentProps) {
  const menuRef = useRef<HTMLDivElement | null>(null)
  const { open } = useMenuContext()
  const side = useMenuPlacement()

  useOnClickOutside(menuRef, onClickOutside || (() => { }))

  return (
    <Ariakit.Menu
      ref={useComposedRef(menuRef, ref)}
      className={cn(
        "z-50 flex flex-col outline-none min-w-[var(--popover-anchor-width)] rounded-md border border-gray-200 bg-white p-1 text-gray-950 shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-50",
        className
      )}
      data-side={side}
      data-state={open ? "open" : "closed"}
      gutter={4}
      flip
      unmountOnHide
      {...props}
    >
      {children}
    </Ariakit.Menu>
  )
}

export const MenuButton = forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<typeof Ariakit.MenuButton>
>(({ className, ...props }, ref) => (
  <Ariakit.MenuButton
    ref={ref}
    {...props}
    className={cn("flex items-center gap-1", className)}
  />
))

MenuButton.displayName = "MenuButton"

export const MenuButtonArrow = forwardRef<
  React.ComponentRef<typeof Ariakit.MenuButtonArrow>,
  React.ComponentPropsWithoutRef<typeof Ariakit.MenuButtonArrow>
>(({ className, ...props }, ref) => (
  <Ariakit.MenuButtonArrow
    ref={ref}
    {...props}
    className={cn(className)}
  />
))

MenuButtonArrow.displayName = "MenuButtonArrow"

export const MenuGroup = forwardRef<
  React.ComponentRef<typeof Ariakit.MenuGroup>,
  React.ComponentPropsWithoutRef<typeof Ariakit.MenuGroup>
>(({ className, ...props }, ref) => (
  <Ariakit.MenuGroup
    ref={ref}
    {...props}
    className={cn("hidden has-[[role=menuitem]]:block has-[[role=option]]:block", className)}
  />
))

MenuGroup.displayName = "MenuGroup"

export const MenuGroupLabel = forwardRef<
  React.ComponentRef<typeof Ariakit.MenuGroupLabel>,
  React.ComponentPropsWithoutRef<typeof Ariakit.MenuGroupLabel>
>((props, ref) => <Label ref={ref} {...props} />)

MenuGroupLabel.displayName = "MenuGroupLabel"

export const MenuItemCheck = forwardRef<
  React.ComponentRef<typeof Ariakit.MenuItemCheck>,
  React.ComponentPropsWithoutRef<typeof Ariakit.MenuItemCheck>
>(({ className, ...props }, ref) => (
  <Ariakit.MenuItemCheck
    ref={ref}
    {...props}
    className={cn(className)}
  />
))

MenuItemCheck.displayName = "MenuItemCheck"

export const MenuItemRadio = forwardRef<
  React.ComponentRef<typeof Ariakit.MenuItemRadio>,
  React.ComponentPropsWithoutRef<typeof Ariakit.MenuItemRadio>
>(({ className, ...props }, ref) => (
  <Ariakit.MenuItemRadio
    ref={ref}
    {...props}
    className={cn("relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-disabled:pointer-events-none aria-disabled:opacity-50 aria-selected:bg-gray-100 aria-selected:text-gray-900 dark:aria-selected:bg-gray-800 dark:aria-selected:text-gray-50 focus:bg-gray-100 dark:focus:bg-gray-800 focus:text-gray-900 dark:focus:text-gray-50", className)}
  />
))

MenuItemRadio.displayName = "MenuItemRadio"

export const MenuItem = function MenuItem({
  name,
  value,
  preventClose,
  className,
  ...props
}: MenuItemProps) {
  const menu = Ariakit.useMenuContext()
  const searchable = useSearchableContext()

  const hideOnClick = useMenuItemClick(menu, preventClose)

  const itemProps: MenuItemProps = {
    blurOnHoverEnd: false,
    focusOnHover: true,
    className: cn("w-full relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-disabled:pointer-events-none aria-disabled:opacity-50 focus:bg-gray-100 dark:focus:bg-gray-800 focus:text-gray-900 dark:focus:text-gray-50", className),
    ...props,
  }

  if (!searchable) {
    if (name && value) {
      return (
        <MenuItemRadio
          {...itemProps}
          hideOnClick={true}
          name={name}
          value={value}
        />
      )
    }

    return <Ariakit.MenuItem {...itemProps} />
  }

  return <ComboboxItem {...itemProps} hideOnClick={hideOnClick} />
}

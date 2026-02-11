import { forwardRef } from "react"
import * as Ariakit from "@ariakit/react"
import { cn } from "@/lib/tiptap-utils"


export function ComboboxProvider({ ...props }: Ariakit.ComboboxProviderProps) {
  return (
    <Ariakit.ComboboxProvider
      includesBaseElement={false}
      resetValueOnHide
      {...props}
    />
  )
}

export const ComboboxList = forwardRef<
  React.ComponentRef<typeof Ariakit.ComboboxList>,
  React.ComponentProps<typeof Ariakit.ComboboxList>
>(({ className, ...props }, ref) => {
  return (
    <Ariakit.ComboboxList
      ref={ref}
      className={cn(
        "flex flex-col gap-1 p-1.5 max-h-[var(--popover-available-height)] max-w-64 overflow-y-auto overflow-x-hidden rounded-lg border border-gray-200 bg-white shadow-md outline-none dark:border-gray-800 dark:bg-gray-950 empty:hidden",
        className
      )}
      {...props}
    />
  )
})
ComboboxList.displayName = "ComboboxList"

export const ComboboxPopover = forwardRef<
  React.ComponentRef<typeof Ariakit.ComboboxPopover>,
  React.ComponentProps<typeof Ariakit.ComboboxPopover>
>(({ className, ...props }, ref) => {
  return (
    <Ariakit.ComboboxPopover
      ref={ref}
      className={cn(
        "z-50 min-w-[8rem] overflow-hidden rounded-md border border-gray-200 bg-white p-1 text-gray-950 shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-50",
        className
      )}
      {...props}
    />
  )
})
ComboboxPopover.displayName = "ComboboxPopover"

export const Combobox = forwardRef<
  React.ComponentRef<typeof Ariakit.Combobox>,
  React.ComponentProps<typeof Ariakit.Combobox>
>(({ className, ...props }, ref) => {
  return (
    <Ariakit.Combobox
      ref={ref}
      autoSelect
      {...props}
      className={cn(
        "flex h-9 w-full rounded-md border border-gray-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-800 dark:placeholder:text-gray-400 dark:focus-visible:ring-gray-300",
        className
      )}
    />
  )
})
Combobox.displayName = "Combobox"

export const ComboboxItem = forwardRef<
  React.ComponentRef<typeof Ariakit.ComboboxItem>,
  React.ComponentProps<typeof Ariakit.ComboboxItem>
>(({ className, ...props }, ref) => {
  return (
    <Ariakit.ComboboxItem
      ref={ref}
      className={cn(
        "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 aria-selected:bg-gray-100 aria-selected:text-gray-900 dark:aria-selected:bg-gray-800 dark:aria-selected:text-gray-50 data-[active-item]:bg-gray-100 dark:data-[active-item]:bg-gray-800",
        className
      )}
      {...props}
    />
  )
})
ComboboxItem.displayName = "ComboboxItem"

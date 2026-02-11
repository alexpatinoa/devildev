import { cn } from "@/lib/tiptap-utils"


function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      className={cn(
        "block w-full h-8 px-2 text-sm rounded-md bg-transparent outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500",
        className
      )}
      {...props}
    />
  )
}

function InputGroup({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div className={cn("relative flex flex-wrap items-stretch", className)} {...props}>
      {children}
    </div>
  )
}

export { Input, InputGroup }

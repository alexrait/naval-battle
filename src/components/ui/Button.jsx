import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cn } from "../../lib/utils"

const Button = React.forwardRef(({ className, variant = "default", size = "default", asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
  
  const variants = {
    default: "bg-blue-600 text-white hover:bg-blue-700 shadow-[0_0_20px_rgba(37,99,235,0.3)]",
    destructive: "bg-red-600 text-white hover:bg-red-700",
    outline: "border border-white/20 bg-transparent hover:bg-white/10 text-white",
    secondary: "bg-slate-800 text-slate-100 hover:bg-slate-700",
    ghost: "hover:bg-white/5 text-slate-400 hover:text-white",
    link: "text-blue-400 underline-offset-4 hover:underline",
  }

  const sizes = {
    default: "h-12 px-6 py-3",
    sm: "h-9 rounded-md px-3",
    lg: "h-14 rounded-2xl px-10 text-lg",
    icon: "h-12 w-12",
  }

  return (
    <Comp
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-bold ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
        variants[variant],
        sizes[size],
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Button.displayName = "Button"

export { Button }

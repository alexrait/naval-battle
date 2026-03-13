import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cn } from "../../lib/utils"

const Button = React.forwardRef(({ className, variant = "default", size = "default", asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
  
  const variants = {
    default: "bg-yellow-500 text-slate-950 hover:bg-yellow-400 font-black uppercase tracking-widest shadow-[0_0_15px_rgba(234,179,8,0.3)] transition-all hover:scale-[1.02]",
    destructive: "bg-red-600 text-white hover:bg-red-500 font-bold",
    outline: "border-2 border-slate-700 bg-transparent hover:bg-slate-800 text-slate-300 font-bold uppercase tracking-wider",
    secondary: "bg-slate-800 text-slate-100 hover:bg-slate-700 border border-slate-700",
    ghost: "hover:bg-slate-800/50 hover:text-white text-slate-400",
    link: "text-yellow-500 underline-offset-4 hover:underline",
    blue: "bg-blue-700 text-white hover:bg-blue-600 shadow-lg shadow-blue-900/20",
    white: "bg-white text-slate-950 hover:bg-slate-100 font-black uppercase tracking-widest shadow-lg"
  }

  const sizes = {
    default: "h-10 px-4 py-2",
    sm: "h-9 rounded-md px-3",
    lg: "h-11 rounded-md px-8",
    icon: "h-10 w-10",
  }

  return (
    <Comp
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
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

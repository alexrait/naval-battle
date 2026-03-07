import React from "react"
import { cn } from "../../lib/utils"

export const Button = ({ className, variant = "default", size = "default", ...props }) => {
  const variants = {
    default: "bg-blue-600 text-white hover:bg-blue-700 shadow-lg",
    destructive: "bg-red-600 text-white hover:bg-red-700",
    outline: "border border-blue-400 text-blue-400 hover:bg-blue-400/10",
    secondary: "bg-slate-800 text-slate-100 hover:bg-slate-700",
    ghost: "hover:bg-blue-400/10 text-blue-200",
    link: "text-blue-400 underline-offset-4 hover:underline",
  }

  const sizes = {
    default: "h-10 px-4 py-2",
    sm: "h-8 rounded-md px-3 text-xs",
    lg: "h-12 rounded-md px-8 text-lg",
    icon: "h-10 w-10",
  }

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  )
}

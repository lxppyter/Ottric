"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { ChevronDown } from "lucide-react"

// Simple Custom Select Implementation (No Radix)
// This is a simplified version that handles basic selection state.

const SelectContext = React.createContext<{
  value: string
  label: React.ReactNode // Store the label (children) of the selected item
  onValueChange: (value: string, label: React.ReactNode) => void
  open: boolean
  setOpen: (open: boolean) => void
} | null>(null)

interface SelectProps {
    children: React.ReactNode
    defaultValue?: string
    value?: string
    onValueChange?: (value: string) => void
    className?: string
}

const Select = ({ children, defaultValue, value: controlledValue, onValueChange, className }: SelectProps) => {
    const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue || "")
    const [selectedLabel, setSelectedLabel] = React.useState<React.ReactNode>(null)
    const [open, setOpen] = React.useState(false)
    const containerRef = React.useRef<HTMLDivElement>(null)

    const value = controlledValue !== undefined ? controlledValue : uncontrolledValue

    // Effect to find initial label if needed could go here, but complex with children inspection.
    // For now, it will update when an item is clicked.

    const handleValueChange = (newValue: string, newLabel: React.ReactNode) => {
        setUncontrolledValue(newValue)
        setSelectedLabel(newLabel)
        if (onValueChange) onValueChange(newValue)
        setOpen(false)
    }

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    return (
        <SelectContext.Provider value={{ value, label: selectedLabel, onValueChange: handleValueChange, open, setOpen }}>
            <div className={cn("relative inline-block", className)} ref={containerRef}>
                {children}
            </div>
        </SelectContext.Provider>
    )
}

const SelectTrigger = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, children, ...props }, ref) => {
    const context = React.useContext(SelectContext)
    return (
        <button
            ref={ref}
            type="button"
            onClick={() => context?.setOpen(!context.open)}
            className={cn(
                "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                className
            )}
            {...props}
        >
            {children}
            <ChevronDown className="h-4 w-4 opacity-50" />
        </button>
    )
  }
)
SelectTrigger.displayName = "SelectTrigger"

const SelectValue = React.forwardRef<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement> & { placeholder?: string }>(
  ({ className, placeholder, children, ...props }, ref) => {
      const context = React.useContext(SelectContext)
      
      const displayValue = children || context?.label || (context?.value ? context.value : placeholder)
    
    return (
      <span ref={ref} className={cn("block truncate", className)} {...props}>
        {displayValue}
      </span>
    )
  }
)
SelectValue.displayName = "SelectValue"

const SelectContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
     const context = React.useContext(SelectContext)
     if (!context?.open) return null;

    return (
        <div
            ref={ref}
            className={cn(
            "absolute z-50 min-w-full w-max overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md animate-in fade-in-80 mt-1",
            className
            )}
            {...props}
        >
            <div className="p-1">
                {children}
            </div>
        </div>
    )
  }
)
SelectContent.displayName = "SelectContent"

const SelectItem = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { value: string }>(
  ({ className, children, value, ...props }, ref) => {
    const context = React.useContext(SelectContext)
    const isSelected = context?.value === value
    
    // We want to update the label on mount if we are the selected item
    React.useEffect(() => {
        if (isSelected && context?.label !== children) {
             // This can cause re-renders loops if not careful.
             // We only want to set it if it's missing or different.
             // But we can't update state in render easily.
             // We leave this for interactions for now.
             // Better user exp: User provides the initial label via default value? No.
        }
    }, [isSelected, children, context])


    return (
        <div
            ref={ref}
            onClick={() => context?.onValueChange(value, children)}
            className={cn(
            "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 hover:bg-accent hover:text-accent-foreground",
            isSelected && "bg-accent text-accent-foreground",
            className
            )}
            {...props}
        >
            <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                 {isSelected && <span className="h-2 w-2 rounded-full bg-current" />}
            </span>
            <span className="truncate">{children}</span>
        </div>
    )
  }
)
SelectItem.displayName = "SelectItem"

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem }

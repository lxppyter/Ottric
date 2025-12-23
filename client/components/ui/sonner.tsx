"use client"

import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-[#0A0A0A] group-[.toaster]:text-white group-[.toaster]:border-primary/30 group-[.toaster]:shadow-[0_0_20px_rgba(212,93,133,0.15)] group-[.toaster]:backdrop-blur-md font-mono",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-black group-[.toast]:font-bold",
          cancelButton:
            "group-[.toast]:bg-white/10 group-[.toast]:text-white",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }

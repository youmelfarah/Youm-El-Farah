"use client";

import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

export function Toaster({ ...props }: ToasterProps) {
  return (
    <Sonner
      dir="rtl"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-surface-raised group-[.toaster]:text-text group-[.toaster]:border-border group-[.toaster]:shadow-popover group-[.toaster]:rounded-[4px] group-[.toaster]:font-body group-[.toaster]:p-4",
          description: "group-[.toast]:text-text-muted text-xs",
          actionButton:
            "group-[.toast]:bg-text group-[.toast]:text-text-inverse group-[.toast]:text-xs group-[.toast]:rounded-[2px]",
          cancelButton:
            "group-[.toast]:bg-surface-muted group-[.toast]:text-text group-[.toast]:text-xs group-[.toast]:rounded-[2px]",
          error: "group-[.toast]:border-danger/30 group-[.toast]:text-danger",
          success: "group-[.toast]:border-success/30 group-[.toast]:text-success",
          warning: "group-[.toast]:border-warning/30 group-[.toast]:text-warning",
        },
      }}
      {...props}
    />
  );
}

export { toast };

"use client";

import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { cn } from "@/lib/cn";

export const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>
>(({ className, ...props }, ref) => (
  <span className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center">
    <SwitchPrimitive.Root
      className={cn(
        "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border border-border bg-surface-muted transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "data-[state=checked]:bg-text data-[state=checked]:border-text",
        className
      )}
      {...props}
      ref={ref}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          "pointer-events-none block h-5 w-5 rounded-full bg-surface-raised shadow-sm transition-transform",
          "data-[state=unchecked]:translate-x-0.5 rtl:data-[state=unchecked]:-translate-x-0.5",
          "data-[state=checked]:translate-x-5 rtl:data-[state=checked]:-translate-x-5"
        )}
      />
    </SwitchPrimitive.Root>
  </span>
));
Switch.displayName = SwitchPrimitive.Root.displayName;

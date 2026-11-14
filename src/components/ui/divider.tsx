import * as React from "react";
import { cn } from "@/lib/cn";

export interface DividerProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: "horizontal" | "vertical";
  label?: React.ReactNode;
}

export function Divider({
  orientation = "horizontal",
  label,
  className,
  ...props
}: DividerProps) {
  if (orientation === "vertical") {
    return (
      <div
        role="separator"
        aria-orientation="vertical"
        className={cn("inline-block h-full w-[1px] bg-border self-stretch", className)}
        {...props}
      />
    );
  }

  if (label) {
    return (
      <div
        role="separator"
        className={cn("flex items-center gap-3 my-4 text-xs text-text-muted", className)}
        {...props}
      >
        <div className="h-[1px] flex-1 bg-border" />
        <span className="shrink-0">{label}</span>
        <div className="h-[1px] flex-1 bg-border" />
      </div>
    );
  }

  return (
    <div
      role="separator"
      aria-orientation="horizontal"
      className={cn("h-[1px] w-full bg-border my-4", className)}
      {...props}
    />
  );
}

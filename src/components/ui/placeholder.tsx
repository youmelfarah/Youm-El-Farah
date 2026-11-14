import * as React from "react";
import { cn } from "@/lib/cn";

export type PlaceholderAspectRatio = "1:1" | "4:5" | "3:2" | "16:9" | "auto";

export interface PlaceholderProps extends React.HTMLAttributes<HTMLDivElement> {
  aspectRatio?: PlaceholderAspectRatio;
  label?: string;
  theme?: "light" | "dark";
}

const aspectRatioClasses: Record<PlaceholderAspectRatio, string> = {
  "1:1": "aspect-square",
  "4:5": "aspect-[4/5]",
  "3:2": "aspect-[3/2]",
  "16:9": "aspect-video",
  auto: "",
};

export function Placeholder({
  aspectRatio = "auto",
  label,
  theme,
  children,
  className,
  ...props
}: PlaceholderProps) {
  return (
    <div
      data-theme={theme}
      className={cn(
        "relative flex flex-col items-center justify-center rounded-[2px] border border-border bg-surface-muted p-4 text-center transition-colors select-none",
        aspectRatioClasses[aspectRatio],
        className
      )}
      {...props}
    >
      {children ? (
        children
      ) : (
        <span className="font-latin text-xs uppercase tracking-wider text-text-muted/70">
          {label || (aspectRatio !== "auto" ? `PHOTO ${aspectRatio}` : "PLACEHOLDER")}
        </span>
      )}
    </div>
  );
}

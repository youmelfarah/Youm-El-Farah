import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

export const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-[2px] font-medium leading-none select-none transition-colors border",
  {
    variants: {
      variant: {
        neutral:
          "border-border bg-surface-muted text-text-muted",
        accent:
          "border-accent/30 bg-accent/10 text-accent-text",
        success:
          "border-success/30 bg-success-muted text-success",
        warning:
          "border-warning/30 bg-warning-muted text-warning",
        danger:
          "border-danger/30 bg-danger-muted text-danger",
        outline:
          "border-border-strong bg-transparent text-text",
      },
      size: {
        sm: "px-2 py-0.5 text-[11px]",
        md: "px-2.5 py-1 text-xs",
      },
    },
    defaultVariants: {
      variant: "neutral",
      size: "md",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <span
      className={cn(badgeVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export const AdminBadge = Badge;

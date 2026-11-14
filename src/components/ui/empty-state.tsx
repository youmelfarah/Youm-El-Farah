import * as React from "react";
import { cn } from "@/lib/cn";

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex min-h-[220px] flex-col items-center justify-center rounded-[4px] border border-dashed border-border bg-surface-raised/40 p-8 text-center",
        className
      )}
      {...props}
    >
      {icon && (
        <div className="mb-3.5 flex h-12 w-12 items-center justify-center rounded-[2px] bg-surface-muted text-text-muted">
          {icon}
        </div>
      )}
      <h3 className="font-display text-base font-semibold text-text">{title}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-xs text-text-muted leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

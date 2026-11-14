import * as React from "react";
import { cn } from "@/lib/cn";

export interface StatProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string | number;
  label: string;
  helper?: string;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
}

export function Stat({
  value,
  label,
  helper,
  trend,
  className,
  ...props
}: StatProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-1 rounded-[4px] border border-border bg-surface-raised p-5 transition-colors",
        className
      )}
      {...props}
    >
      <span className="text-xs font-medium text-text-muted">{label}</span>
      <div className="flex items-baseline gap-2">
        <span className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-text">
          {value}
        </span>
        {trend && (
          <span
            className={cn(
              "text-xs font-medium font-latin",
              trend.isPositive ? "text-success" : "text-danger"
            )}
          >
            {trend.value}
          </span>
        )}
      </div>
      {helper && <span className="text-xs text-text-muted/80">{helper}</span>}
    </div>
  );
}

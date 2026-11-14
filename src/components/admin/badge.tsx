import React from "react";

export interface AdminBadgeProps {
  children: React.ReactNode;
  variant?: "success" | "warning" | "danger" | "neutral" | "accent";
  className?: string;
}

export function AdminBadge({
  children,
  variant = "neutral",
  className = "",
}: AdminBadgeProps) {
  const baseClasses =
    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold";

  const variantClasses = {
    success: "border-success bg-success-muted text-success",
    warning: "border-warning bg-warning-muted text-warning",
    danger: "border-danger bg-danger-muted text-danger",
    neutral: "border-border bg-surface-muted text-text-muted",
    accent: "border-accent bg-accent/10 text-accent",
  }[variant];

  return (
    <span className={`${baseClasses} ${variantClasses} ${className}`}>
      {children}
    </span>
  );
}

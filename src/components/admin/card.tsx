import React from "react";

export interface AdminCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export function AdminCard({
  children,
  className = "",
  ...props
}: AdminCardProps) {
  return (
    <div
      className={`rounded-xl border border-border bg-surface p-4 sm:p-6 shadow-xs ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function AdminCardHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
      <div>
        <h2 className="text-base font-bold text-text">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs text-text-muted">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

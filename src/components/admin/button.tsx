import React from "react";

export interface AdminButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "outline-danger" | "success";
  size?: "sm" | "md" | "lg";
}

export function AdminButton({
  children,
  variant = "primary",
  size = "md",
  className = "",
  disabled,
  ...props
}: AdminButtonProps) {
  const baseClasses =
    "inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer";

  const sizeClasses = {
    sm: "px-2.5 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-5 py-2.5 text-base",
  }[size];

  const variantClasses = {
    primary: "bg-accent text-white hover:bg-accent-hover",
    secondary:
      "bg-surface-muted text-text border border-border hover:bg-surface",
    danger: "bg-danger text-white hover:opacity-90",
    "outline-danger":
      "border border-danger text-danger bg-transparent hover:bg-danger-muted",
    success: "bg-success text-white hover:opacity-90",
  }[variant];

  return (
    <button
      className={`${baseClasses} ${sizeClasses} ${variantClasses} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}

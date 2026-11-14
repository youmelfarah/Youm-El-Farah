import * as React from "react";
import { cn } from "@/lib/cn";

export interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  as?: "section" | "div" | "article" | "aside";
  theme?: "light" | "dark";
  spacing?: "default" | "sm" | "lg" | "none";
}

export function Section({
  as: Component = "section",
  theme,
  spacing = "default",
  className,
  children,
  ...props
}: SectionProps) {
  const spacingClasses = {
    default: "py-16 sm:py-24 lg:py-36",
    sm: "py-10 sm:py-14 lg:py-20",
    lg: "py-20 sm:py-32 lg:py-44",
    none: "py-0",
  }[spacing];

  return (
    <Component
      data-theme={theme}
      className={cn(
        "relative w-full bg-surface text-text transition-colors",
        spacingClasses,
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
}

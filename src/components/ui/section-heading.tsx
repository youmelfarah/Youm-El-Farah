import * as React from "react";
import { cn } from "@/lib/cn";

export interface SectionHeadingProps extends React.HTMLAttributes<HTMLDivElement> {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "start" | "center";
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "start",
  className,
  ...props
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2.5",
        align === "center" ? "items-center text-center mx-auto max-w-2xl" : "items-start text-start max-w-3xl",
        className
      )}
      {...props}
    >
      {eyebrow && (
        <span
          className="font-latin text-xs uppercase text-accent-text select-none"
          style={{ letterSpacing: "0.18em" }}
        >
          {eyebrow}
        </span>
      )}
      <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-text leading-tight">
        {title}
      </h2>
      {description && (
        <p className="text-sm sm:text-base text-text-muted leading-relaxed">
          {description}
        </p>
      )}
    </div>
  );
}

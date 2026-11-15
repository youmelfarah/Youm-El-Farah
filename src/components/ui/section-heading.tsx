import * as React from "react";
import { cn } from "@/lib/cn";

export interface SectionHeadingProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: "h1" | "h2" | "h3";
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "start" | "center";
}

export function SectionHeading({
  as: HeadingTag = "h2",
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
      <HeadingTag className="font-display text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-text leading-tight">
        {title}
      </HeadingTag>
      {description && (
        <p className="text-sm sm:text-base text-text-muted leading-relaxed">
          {description}
        </p>
      )}
    </div>
  );
}

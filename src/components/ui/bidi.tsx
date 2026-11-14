import * as React from "react";
import { cn } from "@/lib/cn";

export interface BidiProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
  as?: "bdi" | "span";
  dir?: "ltr" | "rtl" | "auto";
}

/**
 * Isolates bidirectional text (e.g. Latin text, Western numbers, dates, phones)
 * inside Arabic (RTL) sentences to prevent punctuation, parentheses, and text reordering bugs.
 */
export function Bidi({
  children,
  as: Component = "bdi",
  dir = "ltr",
  className,
  style,
  ...props
}: BidiProps) {
  return (
    <Component
      dir={dir}
      className={cn("inline-block", className)}
      style={{ unicodeBidi: "isolate", ...style }}
      {...props}
    >
      {children}
    </Component>
  );
}

/**
 * Helper for phone numbers that must always display left-to-right
 * without reversing dashes or digits in RTL Arabic text.
 */
export function BidiPhone({
  phone,
  className,
}: {
  phone: string;
  className?: string;
}) {
  return (
    <bdi
      dir="ltr"
      className={cn("inline-block font-latin", className)}
      style={{ unicodeBidi: "isolate" }}
    >
      {phone}
    </bdi>
  );
}

/**
 * Helper for dates that must always display left-to-right.
 */
export function BidiDate({
  date,
  className,
}: {
  date: string;
  className?: string;
}) {
  return (
    <bdi
      dir="ltr"
      className={cn("inline-block font-latin", className)}
      style={{ unicodeBidi: "isolate" }}
    >
      {date}
    </bdi>
  );
}

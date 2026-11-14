import Link from "next/link";
import { brand } from "@/lib/brand";
import { cn } from "@/lib/cn";

export interface LogoProps {
  variant?: "stacked" | "horizontal" | "mark-less";
  size?: "sm" | "md" | "lg";
  href?: string;
  className?: string;
}

export function Logo({
  variant = "stacked",
  size = "md",
  href,
  className,
}: LogoProps) {
  const sizeClasses = {
    sm: {
      ar: "text-base sm:text-lg",
      en: "text-[8px] sm:text-[9px] tracking-[0.18em]",
      gap: "gap-0.5",
    },
    md: {
      ar: "text-xl sm:text-2xl",
      en: "text-[10px] sm:text-[11px] tracking-[0.18em]",
      gap: "gap-0.5 sm:gap-1",
    },
    lg: {
      ar: "text-2xl sm:text-3xl lg:text-4xl",
      en: "text-[11px] sm:text-xs lg:text-sm tracking-[0.18em]",
      gap: "gap-1 sm:gap-1.5",
    },
  }[size];

  const content = (
    <div
      className={cn(
        "inline-flex select-none whitespace-nowrap",
        variant === "stacked" && "flex-col items-start leading-none",
        variant === "horizontal" &&
          "flex-col items-start leading-none sm:flex-row sm:items-baseline sm:gap-2.5",
        variant === "mark-less" && "flex-col items-start leading-none",
        sizeClasses.gap,
        className
      )}
    >
      <span
        style={{ whiteSpace: "nowrap" }}
        className={cn(
          "font-display font-semibold text-text transition-colors whitespace-nowrap",
          sizeClasses.ar
        )}
      >
        {brand.name.ar}
      </span>

      {variant !== "mark-less" && (
        <span
          className={cn(
            "font-latin uppercase text-accent-text transition-colors whitespace-nowrap",
            sizeClasses.en
          )}
          style={{ letterSpacing: "0.18em", whiteSpace: "nowrap" }}
        >
          {brand.name.en}
        </span>
      )}
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="inline-flex rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
        aria-label={`${brand.name.ar} - ${brand.name.en}`}
      >
        {content}
      </Link>
    );
  }

  return content;
}

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
      ar: "text-lg",
      en: "text-[9px] tracking-[0.18em]",
      gap: "gap-0.5",
    },
    md: {
      ar: "text-2xl",
      en: "text-[11px] tracking-[0.18em]",
      gap: "gap-1",
    },
    lg: {
      ar: "text-3xl sm:text-4xl",
      en: "text-xs sm:text-sm tracking-[0.18em]",
      gap: "gap-1.5",
    },
  }[size];

  const content = (
    <div
      className={cn(
        "inline-flex select-none",
        variant === "stacked" && "flex-col items-start leading-none",
        variant === "horizontal" && "flex-row items-baseline gap-2.5 leading-none",
        variant === "mark-less" && "flex-col items-start leading-none",
        sizeClasses.gap,
        className
      )}
    >
      <span
        className={cn(
          "font-display font-semibold text-text transition-colors",
          sizeClasses.ar
        )}
      >
        {brand.name.ar}
      </span>

      {variant !== "mark-less" && (
        <span
          className={cn(
            "font-latin uppercase text-accent-text transition-colors",
            sizeClasses.en
          )}
          style={{ letterSpacing: "0.18em" }}
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

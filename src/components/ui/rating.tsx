import * as React from "react";
import { Star } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/cn";

export interface RatingProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number; // 0 to 5
  max?: number;
  count?: number;
  showScore?: boolean;
  size?: "sm" | "md";
}

export function Rating({
  value,
  max = 5,
  count,
  showScore = true,
  size = "md",
  className,
  ...props
}: RatingProps) {
  const stars = Array.from({ length: max }, (_, i) => i + 1);
  const iconSize = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";

  return (
    <div
      className={cn("inline-flex items-center gap-1.5 text-text", className)}
      aria-label={`التقييم ${value} من ${max}`}
      {...props}
    >
      <div className="flex items-center gap-0.5 text-accent-text" dir="ltr">
        {stars.map((starIndex) => {
          const isFilled = starIndex <= Math.round(value);
          return (
            <Star
              key={starIndex}
              className={iconSize}
              weight={isFilled ? "fill" : "light"}
            />
          );
        })}
      </div>

      {showScore && (
        <span className="font-latin text-xs font-semibold text-text ms-1">
          {value.toFixed(1)}
        </span>
      )}

      {count !== undefined && (
        <span className="text-xs text-text-muted">
          ({count})
        </span>
      )}
    </div>
  );
}

import { cn } from "@/lib/cn";

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-[2px] bg-surface-muted/90 border border-border/40",
        className
      )}
      {...props}
    />
  );
}

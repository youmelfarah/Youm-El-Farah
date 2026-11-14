import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { CircleNotch } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/cn";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[4px] text-sm font-medium transition-colors select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:pointer-events-none disabled:opacity-50 cursor-pointer active:scale-[0.99] duration-150",
  {
    variants: {
      variant: {
        primary:
          "bg-text text-text-inverse hover:opacity-90 active:opacity-95 shadow-none",
        secondary:
          "border border-border bg-surface-raised text-text hover:bg-surface-muted active:bg-surface-muted/80",
        ghost:
          "text-text hover:bg-surface-muted active:bg-surface-muted/80",
        accent:
          "bg-accent text-accent-contrast hover:bg-accent-hover active:opacity-95",
        danger:
          "bg-danger text-text-inverse hover:opacity-90 active:opacity-95",
        "danger-outline":
          "border border-danger/40 text-danger hover:bg-danger-muted",
        "outline-danger":
          "border border-danger/40 text-danger hover:bg-danger-muted",
        outline:
          "border border-border-strong text-text hover:bg-surface-muted",
        success:
          "bg-success text-text-inverse hover:opacity-90 active:opacity-95",
      },
      size: {
        sm: "h-9 min-h-[36px] px-3 text-xs",
        md: "h-11 min-h-[44px] px-4 text-sm",
        lg: "h-13 min-h-[52px] px-6 text-base",
        icon: "h-11 w-11 min-h-[44px] min-w-[44px] p-0",
        "icon-sm": "h-9 w-9 min-h-[36px] min-w-[36px] p-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  iconOnly?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      disabled,
      children,
      iconOnly = false,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";
    const resolvedSize = iconOnly ? (size === "sm" ? "icon-sm" : "icon") : size;

    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size: resolvedSize, className }))}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <>
            <CircleNotch className="h-4 w-4 animate-spin text-current" weight="bold" />
            {!iconOnly && children}
          </>
        ) : (
          children
        )}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export const AdminButton = Button;

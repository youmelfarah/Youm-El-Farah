import * as React from "react";
import { cn } from "@/lib/cn";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, disabled, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-[4px] border bg-surface-raised px-3.5 py-2 text-sm text-text transition-colors",
          "placeholder:text-text-muted/60",
          "border-border hover:border-border-strong",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
          error && "border-danger text-danger focus-visible:ring-danger",
          disabled && "cursor-not-allowed opacity-50 bg-surface-muted",
          className
        )}
        ref={ref}
        disabled={disabled}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export {
  FormInput as AdminInput,
  FormSelect as AdminSelect,
  FormTextarea as AdminTextarea,
} from "@/components/ui/field";

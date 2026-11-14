import * as React from "react";
import { Label } from "@/components/ui/label";
import { Input, type InputProps } from "@/components/ui/input";
import { Textarea, type TextareaProps } from "@/components/ui/textarea";
import { cn } from "@/lib/cn";

export interface FieldProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: React.ReactNode;
  htmlFor?: string;
  required?: boolean;
  helpText?: React.ReactNode;
  error?: React.ReactNode;
}

export function Field({
  label,
  htmlFor,
  required,
  helpText,
  error,
  children,
  className,
  ...props
}: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)} {...props}>
      {label && (
        <Label htmlFor={htmlFor} required={required}>
          {label}
        </Label>
      )}
      {children}
      {error ? (
        <p className="text-xs text-danger leading-normal">{error}</p>
      ) : helpText ? (
        <p className="text-xs text-text-muted leading-normal">{helpText}</p>
      ) : null}
    </div>
  );
}

export interface FormInputProps extends Omit<InputProps, "error"> {
  label?: string;
  error?: string;
  helpText?: string;
}

export function FormInput({
  label,
  error,
  helpText,
  id,
  required,
  className,
  ...props
}: FormInputProps) {
  const inputId = id || props.name;
  return (
    <Field
      label={label}
      htmlFor={inputId}
      required={required}
      error={error}
      helpText={helpText}
    >
      <Input
        id={inputId}
        required={required}
        error={Boolean(error)}
        className={className}
        {...props}
      />
    </Field>
  );
}

export interface FormSelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helpText?: string;
}

export function FormSelect({
  label,
  error,
  helpText,
  id,
  required,
  children,
  className,
  ...props
}: FormSelectProps) {
  const selectId = id || props.name;
  return (
    <Field
      label={label}
      htmlFor={selectId}
      required={required}
      error={error}
      helpText={helpText}
    >
      <select
        id={selectId}
        required={required}
        className={cn(
          "flex h-11 w-full rounded-[4px] border border-border bg-surface-raised px-3.5 py-2 text-sm text-text transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
          error && "border-danger text-danger",
          className
        )}
        {...props}
      >
        {children}
      </select>
    </Field>
  );
}

export interface FormTextareaProps extends Omit<TextareaProps, "error"> {
  label?: string;
  error?: string;
  helpText?: string;
}

export function FormTextarea({
  label,
  error,
  helpText,
  id,
  required,
  className,
  ...props
}: FormTextareaProps) {
  const areaId = id || props.name;
  return (
    <Field
      label={label}
      htmlFor={areaId}
      required={required}
      error={error}
      helpText={helpText}
    >
      <Textarea
        id={areaId}
        required={required}
        error={Boolean(error)}
        className={className}
        {...props}
      />
    </Field>
  );
}

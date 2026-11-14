import React from "react";

export interface AdminInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helpText?: string;
}

export function AdminInput({
  label,
  error,
  helpText,
  id,
  className = "",
  ...props
}: AdminInputProps) {
  const inputId = id || props.name;

  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-medium text-text">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`block w-full rounded-lg border bg-surface px-3 py-2 text-sm text-text placeholder:text-text-muted transition focus:outline-none focus:ring-1 focus:ring-accent ${
          error ? "border-danger focus:border-danger" : "border-border focus:border-accent"
        } ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-danger">{error}</p>}
      {helpText && !error && <p className="text-xs text-text-muted">{helpText}</p>}
    </div>
  );
}

export interface AdminSelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helpText?: string;
}

export function AdminSelect({
  label,
  error,
  helpText,
  id,
  children,
  className = "",
  ...props
}: AdminSelectProps) {
  const selectId = id || props.name;

  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={selectId} className="block text-xs font-medium text-text">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={`block w-full rounded-lg border bg-surface px-3 py-2 text-sm text-text transition focus:outline-none focus:ring-1 focus:ring-accent ${
          error ? "border-danger focus:border-danger" : "border-border focus:border-accent"
        } ${className}`}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-danger">{error}</p>}
      {helpText && !error && <p className="text-xs text-text-muted">{helpText}</p>}
    </div>
  );
}

export interface AdminTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helpText?: string;
}

export function AdminTextarea({
  label,
  error,
  helpText,
  id,
  className = "",
  ...props
}: AdminTextareaProps) {
  const areaId = id || props.name;

  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={areaId} className="block text-xs font-medium text-text">
          {label}
        </label>
      )}
      <textarea
        id={areaId}
        className={`block w-full rounded-lg border bg-surface px-3 py-2 text-sm text-text placeholder:text-text-muted transition focus:outline-none focus:ring-1 focus:ring-accent ${
          error ? "border-danger focus:border-danger" : "border-border focus:border-accent"
        } ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-danger">{error}</p>}
      {helpText && !error && <p className="text-xs text-text-muted">{helpText}</p>}
    </div>
  );
}

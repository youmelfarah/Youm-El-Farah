"use client";

import * as React from "react";
import { X } from "@phosphor-icons/react";

export interface BrandConfigHintProps {
  field?: string;
  className?: string;
}

/**
 * A small dismissible note shown only in development when an optional brand.ts field is missing.
 * In production (NODE_ENV === "production"), it returns null.
 */
export function BrandConfigHint({ field, className = "" }: BrandConfigHintProps) {
  const [dismissed, setDismissed] = React.useState(false);

  if (process.env.NODE_ENV === "production" || dismissed) {
    return null;
  }

  return (
    <span
      role="note"
      className={`inline-flex items-center gap-1.5 rounded-[2px] border border-warning/40 bg-warning/10 px-2 py-0.5 text-[11px] font-medium text-warning ${className}`}
    >
      <span>اضبطي brand.ts{field ? ` (${field})` : ""}</span>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="ms-1 inline-flex items-center justify-center text-warning/70 hover:text-warning"
        aria-label="إخفاء التنبيه"
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}

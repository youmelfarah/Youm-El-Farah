import React from "react";

export function AdminTable({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`overflow-x-auto rounded-lg border border-border bg-surface ${className}`}>
      <table className="min-w-full divide-y divide-border text-right text-sm">
        {children}
      </table>
    </div>
  );
}

export function AdminTableHead({ children }: { children: React.ReactNode }) {
  return <thead className="bg-surface-muted text-xs font-semibold text-text-muted">{children}</thead>;
}

export function AdminTableBody({ children }: { children: React.ReactNode }) {
  return <tbody className="divide-y divide-border bg-surface text-text">{children}</tbody>;
}

export function AdminTh({
  children,
  className = "",
  colSpan,
  rowSpan,
}: {
  children: React.ReactNode;
  className?: string;
  colSpan?: number;
  rowSpan?: number;
}) {
  return (
    <th
      colSpan={colSpan}
      rowSpan={rowSpan}
      className={`px-4 py-3 text-right font-medium ${className}`}
    >
      {children}
    </th>
  );
}

export function AdminTd({
  children,
  className = "",
  colSpan,
  rowSpan,
}: {
  children: React.ReactNode;
  className?: string;
  colSpan?: number;
  rowSpan?: number;
}) {
  return (
    <td
      colSpan={colSpan}
      rowSpan={rowSpan}
      className={`px-4 py-3 align-middle text-sm ${className}`}
    >
      {children}
    </td>
  );
}

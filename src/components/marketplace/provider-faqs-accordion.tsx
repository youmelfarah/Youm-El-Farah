"use client";

import * as React from "react";
import { CaretDown } from "@phosphor-icons/react";
import type { FaqItem } from "@/lib/faq-schema";
import { cn } from "@/lib/cn";

export function ProviderFaqsAccordion({ faqs }: { faqs: FaqItem[] }) {
  const [openIdx, setOpenIdx] = React.useState<number | null>(0);

  if (!faqs || faqs.length === 0) return null;

  return (
    <div className="divide-y divide-border rounded-[4px] border border-border bg-surface-raised">
      {faqs.map((faq, idx) => {
        const isOpen = openIdx === idx;
        return (
          <div key={`${faq.question}-${idx}`}>
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => setOpenIdx(isOpen ? null : idx)}
              className="flex w-full min-h-[52px] items-center justify-between gap-4 px-5 py-4 text-start font-display text-sm font-semibold text-text transition-colors hover:bg-surface-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
            >
              <span>{faq.question}</span>
              <CaretDown
                className={cn(
                  "h-4 w-4 shrink-0 text-text-muted transition-transform duration-200",
                  isOpen && "rotate-180"
                )}
                weight="bold"
              />
            </button>
            {isOpen && (
              <div className="border-t border-border/60 bg-surface-muted/30 px-5 py-4 text-sm text-text-muted leading-relaxed whitespace-pre-line">
                {faq.answer}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

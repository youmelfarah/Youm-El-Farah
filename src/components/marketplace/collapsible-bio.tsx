"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";

const BIO_COLLAPSE_THRESHOLD = 600;

export function CollapsibleBio({ bio }: { bio: string }) {
  const [expanded, setExpanded] = React.useState(false);
  const needsCollapse = bio.length > BIO_COLLAPSE_THRESHOLD;

  const displayedText = React.useMemo(() => {
    if (!needsCollapse || expanded) return bio;
    const sliced = bio.slice(0, BIO_COLLAPSE_THRESHOLD);
    const lastSpace = sliced.lastIndexOf(" ");
    return (lastSpace > 400 ? sliced.slice(0, lastSpace) : sliced).trimEnd() + "...";
  }, [bio, needsCollapse, expanded]);

  return (
    <div className="space-y-3">
      <div className="text-body text-text whitespace-pre-line leading-relaxed">
        {displayedText}
      </div>
      {needsCollapse && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setExpanded((prev) => !prev)}
          aria-expanded={expanded}
          className="px-0 text-xs font-semibold text-accent-text hover:bg-transparent hover:underline"
        >
          {expanded ? "عرض أقل" : "اقرأ المزيد"}
        </Button>
      )}
    </div>
  );
}

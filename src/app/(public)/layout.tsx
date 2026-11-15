import * as React from "react";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { SmoothScroll } from "@/components/ui/smooth-scroll";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SmoothScroll>
      <div className="flex min-h-screen flex-col bg-surface text-text">
        <main className="flex-1">{children}</main>
        <PublicFooter />
      </div>
    </SmoothScroll>
  );
}

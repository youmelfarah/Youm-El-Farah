import * as React from "react";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { getWeddingDateFromCookie } from "@/lib/wedding-date";

export default async function ServicesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const weddingDate = await getWeddingDateFromCookie();

  return (
    <>
      <PublicHeader variant="solid" initialWeddingDate={weddingDate} />
      {children}
    </>
  );
}

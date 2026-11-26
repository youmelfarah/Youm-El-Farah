import { prisma } from "@/lib/prisma";
import { requireProviderPage } from "@/lib/provider-dashboard";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireProviderPage();
  const provider = await prisma.provider.findUnique({
    where: { userId: session.user.id },
    select: {
      id: true,
      name: true,
      status: true,
    },
  });

  const newLeadsCount = provider
    ? await prisma.lead.count({
        where: { providerId: provider.id, status: "NEW" },
      })
    : 0;

  return (
    <DashboardShell
      providerName={provider?.name}
      providerStatus={provider?.status ?? null}
      userName={session.user.name || session.user.email}
      newLeadsCount={newLeadsCount}
    >
      {children}
    </DashboardShell>
  );
}


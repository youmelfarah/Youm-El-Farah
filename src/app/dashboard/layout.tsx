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
      name: true,
      status: true,
    },
  });

  return (
    <DashboardShell
      providerName={provider?.name}
      providerStatus={provider?.status ?? null}
      userName={session.user.name || session.user.email}
    >
      {children}
    </DashboardShell>
  );
}


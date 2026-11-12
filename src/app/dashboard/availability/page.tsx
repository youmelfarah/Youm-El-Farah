import {
  addMonthsToDateString,
  dateStringToPrismaDate,
  getCairoTodayString,
  MAX_CALENDAR_MONTHS,
  prismaDateToDateString,
} from "@/lib/calendar-dates";
import { prisma } from "@/lib/prisma";
import { requireOwnedProviderPage } from "@/lib/provider-dashboard";
import { AvailabilityClient } from "./availability-client";

export const dynamic = "force-dynamic";

export default async function DashboardAvailabilityPage() {
  const { provider } = await requireOwnedProviderPage();

  const todayStr = getCairoTodayString();
  const maxDateStr = addMonthsToDateString(todayStr, MAX_CALENDAR_MONTHS);

  const blocked = await prisma.blockedDate.findMany({
    where: {
      providerId: provider.id,
      date: {
        gte: dateStringToPrismaDate(todayStr),
        lte: dateStringToPrismaDate(maxDateStr),
      },
    },
    orderBy: { date: "asc" },
    select: { date: true },
  });

  const initialBlockedDates = blocked.map((row) =>
    prismaDateToDateString(row.date)
  );

  return (
    <AvailabilityClient
      initialBlockedDates={initialBlockedDates}
      todayStr={todayStr}
      maxDateStr={maxDateStr}
      isSuspended={provider.status === "SUSPENDED"}
    />
  );
}


import { prisma } from "./prisma";
import {
  getCairoTodayString,
  dateStringToPrismaDate,
  formatYmd,
  parseDateString,
} from "./calendar-dates";

export interface ProviderStatsSummary {
  last30Days: {
    views: number;
    whatsappClicks: number;
    callClicks: number;
    totalEngagements: number;
  };
  thisMonth: {
    views: number;
    whatsappClicks: number;
    callClicks: number;
  };
  lastMonth: {
    views: number;
    whatsappClicks: number;
    callClicks: number;
  };
}

export async function getProviderStatsSummary(
  providerId: string
): Promise<ProviderStatsSummary> {
  const todayStr = getCairoTodayString();
  const parsedToday = parseDateString(todayStr)!;

  // 30 days ago in Cairo calendar
  const todayUtcMs = Date.UTC(parsedToday.year, parsedToday.month - 1, parsedToday.day);
  const thirtyDaysAgoUtc = new Date(todayUtcMs - 30 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgoStr = formatYmd(
    thirtyDaysAgoUtc.getUTCFullYear(),
    thirtyDaysAgoUtc.getUTCMonth() + 1,
    thirtyDaysAgoUtc.getUTCDate()
  );
  const thirtyDaysAgoDate = dateStringToPrismaDate(thirtyDaysAgoStr);

  // This month boundaries
  const thisMonthStart = dateStringToPrismaDate(
    formatYmd(parsedToday.year, parsedToday.month, 1)
  );

  // Last month boundaries
  let lastMonthYear = parsedToday.year;
  let lastMonthNum = parsedToday.month - 1;
  if (lastMonthNum < 1) {
    lastMonthNum = 12;
    lastMonthYear -= 1;
  }
  const lastMonthStart = dateStringToPrismaDate(
    formatYmd(lastMonthYear, lastMonthNum, 1)
  );
  const lastMonthEnd = new Date(thisMonthStart.getTime() - 24 * 60 * 60 * 1000);

  // Query stats in parallel
  const [last30Rows, thisMonthRows, lastMonthRows] = await Promise.all([
    // Last 30 days
    prisma.providerDailyStat.findMany({
      where: {
        providerId,
        date: { gte: thirtyDaysAgoDate },
      },
      select: { views: true, whatsappClicks: true, callClicks: true },
    }),
    // This month
    prisma.providerDailyStat.findMany({
      where: {
        providerId,
        date: { gte: thisMonthStart },
      },
      select: { views: true, whatsappClicks: true, callClicks: true },
    }),
    // Last month
    prisma.providerDailyStat.findMany({
      where: {
        providerId,
        date: { gte: lastMonthStart, lte: lastMonthEnd },
      },
      select: { views: true, whatsappClicks: true, callClicks: true },
    }),
  ]);

  const sum = (rows: Array<{ views: number; whatsappClicks: number; callClicks: number }>) =>
    rows.reduce(
      (acc, r) => ({
        views: acc.views + r.views,
        whatsappClicks: acc.whatsappClicks + r.whatsappClicks,
        callClicks: acc.callClicks + r.callClicks,
      }),
      { views: 0, whatsappClicks: 0, callClicks: 0 }
    );

  const l30 = sum(last30Rows);
  const tm = sum(thisMonthRows);
  const lm = sum(lastMonthRows);

  return {
    last30Days: {
      ...l30,
      totalEngagements: l30.whatsappClicks + l30.callClicks,
    },
    thisMonth: tm,
    lastMonth: lm,
  };
}

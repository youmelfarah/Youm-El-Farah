import * as React from "react";
import { Eye, WhatsappLogo, PhoneCall, TrendUp } from "@phosphor-icons/react/dist/ssr";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import type { ProviderStatsSummary } from "@/lib/provider-stats";

export interface ProviderStatsCardProps {
  stats: ProviderStatsSummary;
  providerName?: string;
  showCopyReport?: boolean;
}

export function ProviderStatsCard({
  stats,
  providerName,
  showCopyReport = false,
}: ProviderStatsCardProps) {
  const { last30Days, thisMonth, lastMonth } = stats;

  const maxViews = Math.max(1, thisMonth.views, lastMonth.views);
  const maxWhatsapp = Math.max(1, thisMonth.whatsappClicks, lastMonth.whatsappClicks);
  const maxCalls = Math.max(1, thisMonth.callClicks, lastMonth.callClicks);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>إحصائيات وتفاعل الزوار</CardTitle>
            <CardDescription>
              ملخص الزيارات ونقرات التواصل لملفك التعريفي خلال آخر 30 يوماً
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Views */}
          <div className="rounded-[4px] border border-border bg-surface-raised p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-muted">زيارات الملف</span>
              <Eye className="h-4 w-4 text-accent-text" weight="light" />
            </div>
            <p className="mt-2 font-latin text-2xl font-bold text-text">
              {last30Days.views}
            </p>
            <span className="text-[11px] text-text-muted">خلال آخر 30 يوماً</span>
          </div>

          {/* WhatsApp */}
          <div className="rounded-[4px] border border-border bg-surface-raised p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-muted">نقرات واتساب</span>
              <WhatsappLogo className="h-4 w-4 text-success" weight="fill" />
            </div>
            <p className="mt-2 font-latin text-2xl font-bold text-text">
              {last30Days.whatsappClicks}
            </p>
            <span className="text-[11px] text-text-muted">طلب تواصل عبر واتساب</span>
          </div>

          {/* Calls */}
          <div className="rounded-[4px] border border-border bg-surface-raised p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-muted">نقرات الاتصال</span>
              <PhoneCall className="h-4 w-4 text-accent-text" weight="regular" />
            </div>
            <p className="mt-2 font-latin text-2xl font-bold text-text">
              {last30Days.callClicks}
            </p>
            <span className="text-[11px] text-text-muted">مكالمات هاتفية مباشرة</span>
          </div>
        </div>

        {/* CSS Bars Comparison: This Month vs Last Month */}
        <div className="rounded-[4px] border border-border bg-surface-muted/50 p-4 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-border/60">
            <h4 className="font-display font-semibold text-xs text-text flex items-center gap-1.5">
              <TrendUp className="h-4 w-4 text-accent-text" />
              <span>مقارنة الأداء: هذا الشهر مقابل الشهر السابق</span>
            </h4>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1 text-text">
                <span className="h-2 w-2 rounded-full bg-text" />
                هذا الشهر
              </span>
              <span className="flex items-center gap-1 text-text-muted">
                <span className="h-2 w-2 rounded-full bg-border-strong" />
                الشهر السابق
              </span>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            {/* Views bar */}
            <div>
              <div className="flex justify-between mb-1 text-[11px]">
                <span className="text-text font-medium">زيارات الملف</span>
                <span className="font-latin text-text">
                  {thisMonth.views} (هذا الشهر) / {lastMonth.views} (السابق)
                </span>
              </div>
              <div className="flex h-2.5 w-full overflow-hidden rounded-[2px] bg-surface gap-1">
                <div
                  className="bg-text h-full transition-all duration-300 rounded-[2px]"
                  style={{ width: `${Math.round((thisMonth.views / maxViews) * 100)}%` }}
                />
                <div
                  className="bg-border-strong h-full transition-all duration-300 rounded-[2px]"
                  style={{ width: `${Math.round((lastMonth.views / maxViews) * 100)}%` }}
                />
              </div>
            </div>

            {/* WhatsApp bar */}
            <div>
              <div className="flex justify-between mb-1 text-[11px]">
                <span className="text-text font-medium">نقرات واتساب</span>
                <span className="font-latin text-text">
                  {thisMonth.whatsappClicks} (هذا الشهر) / {lastMonth.whatsappClicks} (السابق)
                </span>
              </div>
              <div className="flex h-2.5 w-full overflow-hidden rounded-[2px] bg-surface gap-1">
                <div
                  className="bg-success h-full transition-all duration-300 rounded-[2px]"
                  style={{ width: `${Math.round((thisMonth.whatsappClicks / maxWhatsapp) * 100)}%` }}
                />
                <div
                  className="bg-border-strong h-full transition-all duration-300 rounded-[2px]"
                  style={{ width: `${Math.round((lastMonth.whatsappClicks / maxWhatsapp) * 100)}%` }}
                />
              </div>
            </div>

            {/* Calls bar */}
            <div>
              <div className="flex justify-between mb-1 text-[11px]">
                <span className="text-text font-medium">نقرات الاتصال</span>
                <span className="font-latin text-text">
                  {thisMonth.callClicks} (هذا الشهر) / {lastMonth.callClicks} (السابق)
                </span>
              </div>
              <div className="flex h-2.5 w-full overflow-hidden rounded-[2px] bg-surface gap-1">
                <div
                  className="bg-accent-text h-full transition-all duration-300 rounded-[2px]"
                  style={{ width: `${Math.round((thisMonth.callClicks / maxCalls) * 100)}%` }}
                />
                <div
                  className="bg-border-strong h-full transition-all duration-300 rounded-[2px]"
                  style={{ width: `${Math.round((lastMonth.callClicks / maxCalls) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

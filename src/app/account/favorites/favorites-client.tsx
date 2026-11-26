"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowsClockwise,
  Copy,
  Heart,
  LinkBreak,
  ShareNetwork,
  Trash,
  WhatsappLogo,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import type { PublicProviderCardData } from "@/lib/marketplace-query";
import { ProviderCard } from "@/components/marketplace/provider-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import {
  createOrRotateFavoritesShareTokenAction,
  disableFavoritesShareTokenAction,
  removeFavoriteAction,
} from "../actions";

export interface FavoriteGroup {
  categoryId: string;
  categoryName: string;
  providers: PublicProviderCardData[];
}

export interface UnavailableFavorite {
  providerId: string;
  name: string;
}

export function FavoritesClient({
  groups,
  unavailable,
  initialShareToken,
  baseUrl,
}: {
  groups: FavoriteGroup[];
  unavailable: UnavailableFavorite[];
  initialShareToken: string | null;
  baseUrl: string;
}) {
  const router = useRouter();
  const [shareToken, setShareToken] = React.useState<string | null>(
    initialShareToken
  );
  const [shareBusy, setShareBusy] = React.useState(false);
  const [removingId, setRemovingId] = React.useState<string | null>(null);

  const totalCount =
    groups.reduce((sum, g) => sum + g.providers.length, 0) + unavailable.length;

  const shareUrl = shareToken ? `${baseUrl}/list/${shareToken}` : "";

  const handleCreateOrRotate = async () => {
    setShareBusy(true);
    try {
      const res = await createOrRotateFavoritesShareTokenAction();
      if (!res.ok || !res.token) {
        toast.error(res.error || "تعذر إنشاء رابط المشاركة");
        return;
      }
      setShareToken(res.token);
      toast.success(
        shareToken ? "تم تجديد رابط المشاركة وإلغاء الرابط السابق" : "تم إنشاء رابط المشاركة"
      );
      router.refresh();
    } finally {
      setShareBusy(false);
    }
  };

  const handleDisableShare = async () => {
    setShareBusy(true);
    try {
      const res = await disableFavoritesShareTokenAction();
      if (!res.ok) {
        toast.error(res.error || "تعذر إيقاف المشاركة");
        return;
      }
      setShareToken(null);
      toast.success("تم إيقاف رابط المشاركة");
      router.refresh();
    } finally {
      setShareBusy(false);
    }
  };

  const handleCopy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("تم نسخ الرابط");
    } catch {
      toast.error("تعذر نسخ الرابط تلقائياً");
    }
  };

  const handleRemove = async (providerId: string) => {
    setRemovingId(providerId);
    try {
      const res = await removeFavoriteAction(providerId);
      if (!res.ok) {
        toast.error(res.error || "تعذر إزالة مقدم الخدمة");
        return;
      }
      toast.success("تمت الإزالة من المفضلة");
      router.refresh();
    } finally {
      setRemovingId(null);
    }
  };

  if (totalCount === 0) {
    return (
      <EmptyState
        icon={<Heart className="h-6 w-6" weight="light" />}
        title="لسه ماحفظتيش أي مقدم خدمة. اضغطي على القلب في أي كارت."
        description="احفظي القاعات والمصورين والميك اب ارتيست المفضلين ليكِ علشان ترجعيلهم وتشاركي اختياراتك بسهولة."
        action={
          <Button asChild variant="primary">
            <Link href="/services">تصفحي الخدمات</Link>
          </Button>
        }
      />
    );
  }

  const whatsappShareHref = shareUrl
    ? `https://wa.me/?text=${encodeURIComponent(
        `اختياراتي لخدمات الفرح على يوم الفرح:\n${shareUrl}`
      )}`
    : "";

  return (
    <div className="space-y-10">
      {/* Share Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShareNetwork className="h-5 w-5 text-accent-text" weight="light" />
            <span>شاركي اختياراتك</span>
          </CardTitle>
          <CardDescription>
            أنشئي رابطاً خاصاً للقراءة فقط لمشاركة قائمتك المفضلة مع خطيبك أو عائلتك بدون إظهار أي بيانات شخصية.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {shareToken ? (
            <>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  readOnly
                  value={shareUrl}
                  dir="ltr"
                  aria-label="رابط مشاركة المفضلة"
                  className="font-latin text-xs"
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => void handleCopy()}
                  className="gap-1.5 shrink-0"
                >
                  <Copy className="h-4 w-4" weight="light" />
                  <span>نسخ الرابط</span>
                </Button>
                <Button asChild variant="primary" className="gap-1.5 shrink-0">
                  <a
                    href={whatsappShareHref}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <WhatsappLogo className="h-4 w-4" weight="fill" />
                    <span>مشاركة على واتساب</span>
                  </a>
                </Button>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  loading={shareBusy}
                  onClick={() => void handleCreateOrRotate()}
                  className="gap-1.5 text-xs"
                >
                  <ArrowsClockwise className="h-4 w-4" weight="light" />
                  <span>تجديد الرابط</span>
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  loading={shareBusy}
                  onClick={() => void handleDisableShare()}
                  className="gap-1.5 text-xs text-danger hover:bg-danger-muted hover:text-danger"
                >
                  <LinkBreak className="h-4 w-4" weight="light" />
                  <span>تعطيل الرابط</span>
                </Button>
              </div>
            </>
          ) : (
            <Button
              type="button"
              variant="primary"
              loading={shareBusy}
              onClick={() => void handleCreateOrRotate()}
              className="gap-2"
            >
              <ShareNetwork className="h-4 w-4" weight="light" />
              <span>إنشاء رابط للمشاركة</span>
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Grouped Visible Favorites */}
      {groups.map((group) => (
        <section key={group.categoryId} className="space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <h2 className="font-display text-lg font-semibold text-text">
              {group.categoryName}
            </h2>
            <span className="font-latin text-xs text-text-muted">
              {group.providers.length}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {group.providers.map((p) => (
              <div key={p.id} className="flex flex-col gap-2">
                <ProviderCard provider={p} initialFavorited={true} />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  loading={removingId === p.id}
                  onClick={() => void handleRemove(p.id)}
                  className="self-start text-xs text-text-muted hover:text-danger gap-1.5"
                >
                  <Trash className="h-3.5 w-3.5" weight="light" />
                  <span>إزالة من المفضلة</span>
                </Button>
              </div>
            ))}
          </div>
        </section>
      ))}

      {/* Unavailable Favorites */}
      {unavailable.length > 0 && (
        <section className="space-y-3 border-t border-border pt-8">
          <h2 className="font-display text-base font-semibold text-text">
            خدمات غير متاحة حالياً
          </h2>
          <div className="space-y-2">
            {unavailable.map((item) => (
              <div
                key={item.providerId}
                className="flex flex-wrap items-center justify-between gap-3 rounded-[4px] border border-border bg-surface-raised p-4"
              >
                <div className="flex items-center gap-2.5">
                  <span className="font-display text-sm font-semibold text-text">
                    {item.name}
                  </span>
                  <Badge variant="neutral" size="sm">
                    غير متاح حالياً
                  </Badge>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  loading={removingId === item.providerId}
                  onClick={() => void handleRemove(item.providerId)}
                  className="text-xs text-danger hover:bg-danger-muted hover:text-danger gap-1.5"
                >
                  <Trash className="h-3.5 w-3.5" weight="light" />
                  <span>إزالة</span>
                </Button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

import Link from "next/link";
import { Heart, PaperPlaneTilt, Star, ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import { requireUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { toCairoDateString } from "@/lib/cairo-time";
import { formatArabicDateString } from "@/lib/calendar-dates";
import { LEAD_STATUS_LABELS_AR } from "@/lib/lead-validation";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { DeleteAccountSection } from "./delete-account-section";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = await requireUser();
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
    },
  });

  if (!user) {
    return null;
  }

  const [favoritesCount, reviewsCount, leadsSent] = await Promise.all([
    prisma.favorite.count({ where: { userId: user.id } }),
    prisma.review.count({ where: { userId: user.id } }),
    prisma.lead.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        status: true,
        createdAt: true,
        provider: { select: { name: true, slug: true } },
        offer: { select: { title: true } },
      },
    }),
  ]);

  return (
    <div className="min-h-screen bg-surface text-text">
      <PublicHeader />
      <Section spacing="sm">
        <Container className="max-w-4xl space-y-8">
          <SectionHeading
            eyebrow="MY ACCOUNT"
            title="حسابي"
            description="إدارة المفضلة والتقييمات وطلبات عروض الأسعار المرسلة."
          />

          {/* User Profile Card */}
          <Card>
            <CardContent className="p-6 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 border border-border">
                  {user.image ? <AvatarImage src={user.image} alt={user.name} /> : null}
                  <AvatarFallback className="font-display text-lg font-semibold">
                    {user.name.slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="font-display text-xl font-semibold text-text">
                    {user.name}
                  </h2>
                  <p className="text-xs text-text-muted font-latin mt-0.5" dir="ltr">
                    {user.email}
                  </p>
                </div>
              </div>

              {user.role === "ADMIN" && (
                <Button asChild variant="secondary" size="sm">
                  <Link href="/admin">لوحة الإدارة</Link>
                </Button>
              )}
              {user.role === "PROVIDER" && (
                <Button asChild variant="secondary" size="sm">
                  <Link href="/dashboard">لوحة مقدم الخدمة</Link>
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Quick Summary Cards */}
          {user.role === "VISITOR" && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Link
                  href="/account/favorites"
                  className="rounded-[4px] border border-border bg-surface-raised p-5 transition-colors hover:border-border-strong"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-text-muted">المفضلة</span>
                    <Heart className="h-4 w-4 text-accent-text" weight="light" />
                  </div>
                  <p className="mt-2 font-latin text-2xl font-bold text-text">
                    {favoritesCount}
                  </p>
                  <span className="mt-2 inline-flex items-center gap-1 text-xs text-accent-text">
                    <span>عرض المحفوظات</span>
                    <ArrowLeft className="h-3 w-3" />
                  </span>
                </Link>

                <Link
                  href="/account/reviews"
                  className="rounded-[4px] border border-border bg-surface-raised p-5 transition-colors hover:border-border-strong"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-text-muted">تقييماتي</span>
                    <Star className="h-4 w-4 text-accent-text" weight="light" />
                  </div>
                  <p className="mt-2 font-latin text-2xl font-bold text-text">
                    {reviewsCount}
                  </p>
                  <span className="mt-2 inline-flex items-center gap-1 text-xs text-accent-text">
                    <span>إدارة التقييمات</span>
                    <ArrowLeft className="h-3 w-3" />
                  </span>
                </Link>

                <div className="rounded-[4px] border border-border bg-surface-raised p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-text-muted">الطلبات المرسلة</span>
                    <PaperPlaneTilt className="h-4 w-4 text-accent-text" weight="light" />
                  </div>
                  <p className="mt-2 font-latin text-2xl font-bold text-text">
                    {leadsSent.length}
                  </p>
                  <span className="mt-2 inline-block text-xs text-text-muted">
                    طلبات عروض الأسعار
                  </span>
                </div>
              </div>

              {/* Leads Sent List */}
              <Card>
                <CardHeader>
                  <CardTitle>الطلبات المرسلة لمقدمي الخدمة</CardTitle>
                  <CardDescription>
                    متابعة طلبات عروض الأسعار التي أرسلتِها عبر المنصة
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {leadsSent.length === 0 ? (
                    <EmptyState
                      icon={<PaperPlaneTilt className="h-6 w-6" weight="light" />}
                      title="لم ترسلي أي طلب عرض سعر بعد"
                      description="افتحي صفحة أي مقدم خدمة واضغطي على «اطلبي عرض سعر» للتواصل المباشر."
                      action={
                        <Button asChild variant="secondary">
                          <Link href="/services">تصفحي الخدمات</Link>
                        </Button>
                      }
                    />
                  ) : (
                    <ul className="divide-y divide-border">
                      {leadsSent.map((lead) => (
                        <li
                          key={lead.id}
                          className="flex flex-wrap items-center justify-between gap-3 py-3.5 text-sm"
                        >
                          <div>
                            <Link
                              href={`/providers/${lead.provider.slug}`}
                              className="font-display font-semibold text-text hover:text-accent-text transition-colors"
                            >
                              {lead.provider.name}
                            </Link>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-text-muted mt-0.5">
                              <span className="font-latin">
                                {formatArabicDateString(toCairoDateString(lead.createdAt))}
                              </span>
                              {lead.offer && <span>• {lead.offer.title}</span>}
                            </div>
                          </div>
                          <Badge
                            variant={
                              lead.status === "BOOKED"
                                ? "success"
                                : lead.status === "SPAM" || lead.status === "DECLINED"
                                ? "danger"
                                : lead.status === "CONTACTED"
                                ? "accent"
                                : "neutral"
                            }
                            size="sm"
                          >
                            {LEAD_STATUS_LABELS_AR[lead.status]}
                          </Badge>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {/* Danger Zone: Delete Account */}
          <DeleteAccountSection role={user.role} />
        </Container>
      </Section>
    </div>
  );
}

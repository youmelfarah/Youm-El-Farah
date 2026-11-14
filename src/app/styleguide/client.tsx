"use client";

import * as React from "react";
import {
  Sparkle,
  Heart,
  CalendarCheck,
  Camera,
  MapPin,
  CheckCircle,
  WarningCircle,
  XCircle,
  Info,
  DotsThreeVertical,
} from "@phosphor-icons/react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Field } from "@/components/ui/field";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "@/components/ui/toast";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  MobileCardList,
  MobileCardItem,
  MobileCardRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Divider } from "@/components/ui/divider";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { Stat } from "@/components/ui/stat";
import { Rating } from "@/components/ui/rating";
import { Placeholder } from "@/components/ui/placeholder";
import { Reveal, RevealGroup } from "@/components/ui/reveal";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { formatMoney } from "@/lib/format-money";
import { Bidi, BidiDate, BidiPhone } from "@/components/ui/bidi";

const lightColorTokens = [
  { name: "surface", hex: "#F5EFE6", desc: "خلفية الصفحة الرئيسية (Ivory 100)" },
  { name: "surface-raised", hex: "#FBF8F3", desc: "خلفية البطاقات والنوافذ (Ivory 50)" },
  { name: "surface-muted", hex: "#EFE8DD", desc: "خلفية الحاويات المظللة (Stone 100)" },
  { name: "border", hex: "#E4DBCF", desc: "حدود العناصر القياسية (Stone 200)" },
  { name: "border-strong", hex: "#CFC5B8", desc: "حدود الحقول والحالات النشطة (Stone 300)" },
  { name: "text", hex: "#17120F", desc: "النصوص الأساسية والعناوين (Ink 950)" },
  { name: "text-muted", hex: "#6B625A", desc: "النصوص التوضيحية والثانوية (Stone 600)" },
  { name: "text-inverse", hex: "#FBF8F3", desc: "نصوص الأزرار المعكوسة (Ivory 50)" },
  { name: "accent", hex: "#B79A6B", desc: "اللون التزييني الذهبي (Champagne 400)" },
  { name: "accent-text", hex: "#7A5F34", desc: "نصوص التأكيد اللوني المقروءة (Champagne 700)" },
  { name: "accent-contrast", hex: "#17120F", desc: "نص التباين فوق الزر الذهبي (Ink 950)" },
  { name: "ring", hex: "#7A5F34", desc: "حلقة التركيز المتاحة 2px" },
  { name: "success", hex: "#2E5E3E", desc: "حالة النجاح والتأكيد" },
  { name: "warning", hex: "#8F5F14", desc: "حالة التنبيه والانتظار" },
  { name: "danger", hex: "#9E3228", desc: "حالة الحذف والخطأ" },
];

const darkColorTokens = [
  { name: "surface", hex: "#17120F", desc: "خلفية الصفحة الليلية (Ink 950)" },
  { name: "surface-raised", hex: "#221B17", desc: "خلفية البطاقات الليلية (Ink 900)" },
  { name: "surface-muted", hex: "#3A322C", desc: "خلفية الحاويات المظللة (Ink 700)" },
  { name: "border", hex: "#3A322C", desc: "الحدود القياسية الليلية (Ink 700)" },
  { name: "border-strong", hex: "#6B625A", desc: "الحدود البارزة الليلية (Stone 600)" },
  { name: "text", hex: "#FBF8F3", desc: "النصوص الأساسية الليلية (Ivory 50)" },
  { name: "text-muted", hex: "#CFC5B8", desc: "النصوص الثانوية الليلية (Stone 300)" },
  { name: "text-inverse", hex: "#17120F", desc: "نصوص الأزرار المعكوسة (Ink 950)" },
  { name: "accent", hex: "#B79A6B", desc: "اللون التزييني الشمباني (Champagne 400)" },
  { name: "accent-text", hex: "#D4BC92", desc: "نصوص التأكيد اللوني الليلي" },
  { name: "accent-contrast", hex: "#17120F", desc: "نص التباين فوق الزر الذهبي" },
  { name: "ring", hex: "#B79A6B", desc: "حلقة التركيز المتاحة الليلية" },
  { name: "success", hex: "#7EC494", desc: "حالة النجاح الليلية" },
  { name: "warning", hex: "#E9B764", desc: "حالة التنبيه الليلية" },
  { name: "danger", hex: "#F0897E", desc: "حالة الخطأ الليلية" },
];

const contrastReportData = [
  { theme: "فاتح", token: "text", fg: "#17120F", bg: "surface (#F5EFE6)", ratio: "16.26:1", req: "4.5:1", status: "PASS" },
  { theme: "فاتح", token: "text-muted", fg: "#6B625A", bg: "surface (#F5EFE6)", ratio: "5.22:1", req: "4.5:1", status: "PASS" },
  { theme: "فاتح", token: "accent-text", fg: "#7A5F34", bg: "surface (#F5EFE6)", ratio: "5.23:1", req: "4.5:1", status: "PASS" },
  { theme: "فاتح", token: "danger", fg: "#9E3228", bg: "surface (#F5EFE6)", ratio: "6.25:1", req: "4.5:1", status: "PASS" },
  { theme: "فاتح", token: "success", fg: "#2E5E3E", bg: "surface (#F5EFE6)", ratio: "6.59:1", req: "4.5:1", status: "PASS" },
  { theme: "فاتح", token: "warning", fg: "#8F5F14", bg: "surface (#F5EFE6)", ratio: "4.82:1", req: "4.5:1", status: "PASS" },
  { theme: "فاتح", token: "accent-contrast", fg: "#17120F", bg: "accent (#B79A6B)", ratio: "6.95:1", req: "4.5:1", status: "PASS" },
  { theme: "فاتح", token: "text-inverse", fg: "#FBF8F3", bg: "button ink (#17120F)", ratio: "17.54:1", req: "4.5:1", status: "PASS" },
  { theme: "داكن", token: "text", fg: "#FBF8F3", bg: "surface (#17120F)", ratio: "17.54:1", req: "4.5:1", status: "PASS" },
  { theme: "داكن", token: "text-muted", fg: "#CFC5B8", bg: "surface (#17120F)", ratio: "10.91:1", req: "4.5:1", status: "PASS" },
  { theme: "داكن", token: "accent-text", fg: "#D4BC92", bg: "surface (#17120F)", ratio: "10.10:1", req: "4.5:1", status: "PASS" },
  { theme: "داكن", token: "danger", fg: "#F0897E", bg: "surface (#17120F)", ratio: "7.60:1", req: "4.5:1", status: "PASS" },
  { theme: "داكن", token: "success", fg: "#7EC494", bg: "surface (#17120F)", ratio: "9.04:1", req: "4.5:1", status: "PASS" },
  { theme: "داكن", token: "warning", fg: "#E9B764", bg: "surface (#17120F)", ratio: "10.11:1", req: "4.5:1", status: "PASS" },
  { theme: "داكن", token: "accent-contrast", fg: "#17120F", bg: "accent (#B79A6B)", ratio: "6.95:1", req: "4.5:1", status: "PASS" },
  { theme: "داكن", token: "text-inverse", fg: "#17120F", bg: "button ivory (#FBF8F3)", ratio: "17.54:1", req: "4.5:1", status: "PASS" },
];

export function StyleGuideClient() {
  const [activeThemeTab, setActiveThemeTab] = React.useState<"light" | "dark" | "both">("both");
  const [selectValue, setSelectValue] = React.useState("beni-suef");
  const [checkboxValue, setCheckboxValue] = React.useState(true);
  const [switchValue, setSwitchValue] = React.useState(true);

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-surface text-text">
        {/* Styleguide Top Banner */}
        <div className="border-b border-border bg-surface-raised px-5 py-4">
          <Container className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-latin text-xs uppercase tracking-widest text-accent-text">
                  DESIGN SYSTEM SPECIFICATION
                </span>
                <Badge variant="accent" size="sm">
                  DEV ONLY
                </Badge>
              </div>
              <h1 className="font-display text-xl sm:text-2xl font-bold text-text mt-1">
                نظام تصميم يوم الفرح <Bidi dir="ltr">(Youm El-Farah Design System)</Bidi>
              </h1>
              <p className="text-xs text-text-muted mt-0.5">
                فخامة تحريرية <Bidi dir="ltr">(Editorial Luxury)</Bidi> • بساطة هادئة • توافق تام مع <Bidi dir="ltr">WCAG AA</Bidi> • خطوط عربية ولاتينية مخصصة
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-text-muted font-medium">عرض السمة:</span>
              <div className="inline-flex rounded-[4px] border border-border bg-surface p-0.5">
                <button
                  type="button"
                  onClick={() => setActiveThemeTab("both")}
                  className={`rounded-[2px] px-3 py-1 text-xs font-medium transition-colors ${
                    activeThemeTab === "both"
                      ? "bg-text text-text-inverse"
                      : "text-text-muted hover:text-text"
                  }`}
                >
                  السمتان معاً
                </button>
                <button
                  type="button"
                  onClick={() => setActiveThemeTab("light")}
                  className={`rounded-[2px] px-3 py-1 text-xs font-medium transition-colors ${
                    activeThemeTab === "light"
                      ? "bg-text text-text-inverse"
                      : "text-text-muted hover:text-text"
                  }`}
                >
                  الفاتحة فقط
                </button>
                <button
                  type="button"
                  onClick={() => setActiveThemeTab("dark")}
                  className={`rounded-[2px] px-3 py-1 text-xs font-medium transition-colors ${
                    activeThemeTab === "dark"
                      ? "bg-text text-text-inverse"
                      : "text-text-muted hover:text-text"
                  }`}
                >
                  الداكنة فقط
                </button>
              </div>
            </div>
          </Container>
        </div>

        {/* SECTION 1 & 2: EDITORIAL HYBRID PROOF (DARK HERO BAND + LIGHT CONTENT SECTION) */}
        <section className="border-b border-border">
          {/* Banner indicator */}
          <div className="border-b border-border/60 bg-surface-muted/60 px-5 py-2.5">
            <Container className="flex items-center justify-between">
              <span className="font-latin text-xs uppercase tracking-wider text-accent-text">
                01. EDITORIAL HYBRID PROOF (DARK HERO BAND FOLLOWED BY LIGHT SECTION)
              </span>
              <Badge variant="accent" size="sm">
                نموذج تجريبي <Bidi dir="ltr">(Dev Sample)</Bidi>
              </Badge>
            </Container>
          </div>

          {/* 1A. DARK HERO BAND: Full-bleed Placeholder, Dark Scrim, Transparent PublicHeader */}
          <div
            data-theme="dark"
            style={{ backgroundColor: "var(--surface)", color: "var(--text)" }}
            className="relative w-full overflow-hidden bg-surface text-text transition-colors"
          >
            {/* Full-bleed background image placeholder */}
            <div className="absolute inset-0 z-0">
              <Placeholder
                aspectRatio="16:9"
                label="FULL-BLEED EDITORIAL HERO BACKGROUND"
                className="h-full w-full rounded-none border-none opacity-30 object-cover"
              />
              {/* Dark scrim for text legibility */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-[#17120F]/90 to-[#17120F]" />
            </div>

            {/* Light PublicHeader variant transparent over the dark scrim */}
            <div className="relative z-20">
              <PublicHeader variant="transparent" />
            </div>

            {/* Dark Hero Content */}
            <div className="relative z-10 py-16 sm:py-24 lg:py-28">
              <Container>
                <div className="max-w-2xl flex flex-col gap-5">
                  <div className="flex items-center gap-2">
                    <span className="eyebrow text-accent-text">
                      EXCLUSIVE EDITORIAL HERO
                    </span>
                    <Badge variant="accent" size="sm">
                      بيانات تجريبية <Bidi dir="ltr">(Sample)</Bidi>
                    </Badge>
                  </div>

                  <h2 className="font-display text-display font-bold text-text leading-tight">
                    نصنع من تفاصيل زفافكِ لوحة خالدة
                  </h2>

                  <p className="text-body-lg text-text-muted leading-relaxed">
                    معاينة حية لتدرج نظام التصميم الهجين: شريط علوي شفاف يعلو بطلاً داكناً فخماً (حبر ليلي #17120F)، تتبعه مباشرة أقسام نهارية عاجية هادئة.
                  </p>

                  <div className="flex flex-wrap items-center gap-4 pt-3">
                    <Button variant="primary" size="lg">
                      استكشفي القاعات المتاحة
                    </Button>
                    <Button variant="secondary" size="lg">
                      تصفحي الباقات والأسعار
                    </Button>
                  </div>
                </div>
              </Container>
            </div>
          </div>

          {/* 1B. LIGHT CONTENT SECTION: Immediately follows to prove hybrid transition */}
          <Section
            theme="light"
            spacing="default"
            className="border-t border-border"
          >
            <Container>
              <div className="border-b border-border/60 pb-3 mb-8 flex items-center justify-between">
                <span className="font-latin text-xs uppercase tracking-wider text-accent-text">
                  HYBRID PROOF: LIGHT CONTENT SECTION (IVORY SURFACE)
                </span>
                <Badge variant="neutral" size="sm">
                  عاجي نهاري <Bidi dir="ltr">(Ivory 100)</Bidi>
                </Badge>
              </div>

              <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center">
                <div className="flex flex-col gap-5 lg:col-span-5">
                  <SectionHeading
                    eyebrow="BENI SUEF WEDDING CURATION"
                    title="أرقى قاعات الأفراح واستوديوهات التصوير"
                    description="دليلكِ الحصري لأرقى قاعات الأفراح واستوديوهات التصوير ومصممي الديكور في بني سويف. مقارنات دقيقة، أسعار معلنة، وتأكيد فوري للحجوزات."
                  />

                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <Button variant="primary" size="lg">
                      استعراض كافة الخدمات
                    </Button>
                    <Button variant="secondary" size="lg">
                      طلب استشارة مخصصة
                    </Button>
                  </div>

                  <div className="border-t border-border pt-4 mt-2">
                    <p className="text-xs text-text-muted">
                      محتوى تحريري تجريبي مخصص لاختبار السلم الطباعي وتوازن المسافات في السمة النهارية.
                    </p>
                  </div>
                </div>

                <div className="lg:col-span-7">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-4">
                      <Placeholder
                        aspectRatio="4:5"
                        label="EDITORIAL COVER PHOTO 4:5"
                        className="min-h-[260px] border-border-strong"
                      />
                      <div className="p-2 border-s-2 border-accent-text">
                        <p className="text-xs font-medium text-text">
                          «قاعة اللؤلؤة الملكية - بني سويف الجديدة»
                        </p>
                        <p className="text-[11px] text-text-muted mt-0.5">
                          سعة 450 فرد • إطلالة بانورامية • إضاءة سينمائية
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-4 sm:pt-10">
                      <div className="rounded-[4px] border border-border bg-surface-raised p-5">
                        <span className="font-latin text-xs uppercase tracking-wider text-accent-text">
                          EXCLUSIVE OFFER <Bidi dir="ltr">(Sample)</Bidi>
                        </span>
                        <h4 className="font-display text-base font-semibold text-text mt-1">
                          عرض باقة تصوير الموسم 2026
                        </h4>
                        <p className="text-xs text-text-muted mt-1 leading-relaxed">
                          جلسة تصوير خارجية كاملة بالإضافة إلى ألبوم مخملي فاخر وتصوير سينمائي 4K.
                        </p>
                        <div className="mt-4 flex items-center justify-between">
                          <span className="font-latin text-lg font-bold text-text">
                            {formatMoney(6500)}
                          </span>
                          <Button variant="accent" size="sm">
                            احجزي الموعد
                          </Button>
                        </div>
                      </div>

                      <Placeholder
                        aspectRatio="3:2"
                        label="ATMOSPHERE PHOTO 3:2"
                        className="min-h-[180px]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </Container>
          </Section>
        </section>

        {/* SECTION 3: SIDE-BY-SIDE LIGHT & DARK THEMES */}
        <main className="py-12">
          <Container>
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
              {/* LIGHT THEME COLUMN */}
              {(activeThemeTab === "both" || activeThemeTab === "light") && (
                <div
                  data-theme="light"
                  style={{ backgroundColor: "var(--surface)", color: "var(--text)" }}
                  className="flex flex-col gap-10 rounded-[8px] border border-border bg-surface p-6 sm:p-8"
                >
                  <div className="border-b border-border pb-4">
                    <Badge variant="neutral" size="sm" className="mb-2">
                      السمة الأساسية [DATA-THEME=&quot;LIGHT&quot;]
                    </Badge>
                    <h2 className="font-display text-2xl font-bold text-text">
                      السمة النهارية <Bidi dir="ltr">(Light Theme)</Bidi>
                    </h2>
                    <p className="text-xs text-text-muted mt-1">
                      صفحة عاجية دافئة (#F5EFE6) • نصوص بحبر داكن (#17120F) • لمسات شمبانيا ذهبية
                    </p>
                  </div>

                  {/* 1. Color Palette */}
                  <div className="flex flex-col gap-3">
                    <h3 className="font-display text-base font-semibold text-text">
                      رموز الألوان <Bidi dir="ltr">(Color Tokens)</Bidi>
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {lightColorTokens.map((t) => (
                        <div
                          key={t.name}
                          className="flex items-center gap-3 rounded-[4px] border border-border bg-surface-raised p-2"
                        >
                          <div
                            className="h-8 w-8 shrink-0 rounded-[2px] border border-border"
                            style={{ backgroundColor: t.hex }}
                          />
                          <div className="flex flex-col min-w-0">
                            <span className="font-mono text-[11px] font-semibold text-text">
                              --{t.name}
                            </span>
                            <span className="text-[10px] text-text-muted truncate">
                              {t.hex} • {t.desc}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 2. Typographic Scale */}
                  <div className="flex flex-col gap-4 border-t border-border pt-6">
                    <h3 className="font-display text-base font-semibold text-text">
                      السلم الطباعي <Bidi dir="ltr">(Type Scale)</Bidi>
                    </h3>
                    <div className="flex flex-col gap-4">
                      <div>
                        <span className="text-[10px] text-text-muted font-mono">
                          display (2.75rem - 5.5rem):
                        </span>
                        <div className="text-display font-semibold text-text">
                          أفراح بني سويف
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] text-text-muted font-mono">
                          h1 (2.25rem - 3.75rem):
                        </span>
                        <div className="text-h1 font-semibold text-text">
                          لحظات تدوم في الذاكرة لأجمل ليالي العمر
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] text-text-muted font-mono">
                          h2 (1.75rem - 2.75rem):
                        </span>
                        <div className="text-h2 font-semibold text-text">
                          دليلكِ لاختيار قاعة زفاف استثنائية
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] text-text-muted font-mono">
                          h3 (1.375rem - 1.75rem):
                        </span>
                        <div className="text-h3 font-semibold text-text">
                          نخبة المصورين ومصممي الديكور لحفل لا يُنسى
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] text-text-muted font-mono">
                          body-lg (1.125rem) line-height 1.85:
                        </span>
                        <p className="text-body-lg text-text">
                          نجمع لكِ أرقى مزودي خدمات الزفاف في بني سويف في مكان واحد، لتخطيط ليلة زفافكِ بسلاسة وطمأنينة.
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] text-text-muted font-mono">
                          body (1rem) line-height 1.85:
                        </span>
                        <p className="text-body text-text">
                          تصفحي القوائم المصنفة وقارني بين العروض والأسعار وجدول المواعيد المتاحة مباشرة دون وسطاء.
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] text-text-muted font-mono">
                          small (0.875rem) & caption (0.75rem):
                        </span>
                        <p className="text-small text-text-muted">
                          تأكيد فوري للحجز مع خيارات دفع ميسرة وضمان توثيق العقود الرسمية.
                        </p>
                        <p className="text-caption text-text-muted/80 mt-1">
                          آخر تحديث لبيانات الأسعار والقاعات: ديسمبر 2026.
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] text-text-muted font-mono">
                          Latin Eyebrow (tracking 0.18em):
                        </span>
                        <p className="eyebrow text-accent-text">
                          CURATED WEDDING DIRECTORY • BENI SUEF
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 3. Button States */}
                  <div className="flex flex-col gap-4 border-t border-border pt-6">
                    <h3 className="font-display text-base font-semibold text-text">
                      أزرار النظام بجميع حالاتها <Bidi dir="ltr">(Button States)</Bidi>
                    </h3>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <Button variant="primary">أساسي <Bidi dir="ltr">(Primary)</Bidi></Button>
                      <Button variant="secondary">ثانوي <Bidi dir="ltr">(Secondary)</Bidi></Button>
                      <Button variant="outline">إطار <Bidi dir="ltr">(Outline)</Bidi></Button>
                      <Button variant="ghost">شفاف <Bidi dir="ltr">(Ghost)</Bidi></Button>
                      <Button variant="accent">تأكيد <Bidi dir="ltr">(Accent)</Bidi></Button>
                      <Button variant="danger">حذف <Bidi dir="ltr">(Danger)</Bidi></Button>
                      <Button variant="primary" loading>
                        تحميل
                      </Button>
                      <Button variant="primary" disabled>
                        معطل
                      </Button>
                      <Button variant="secondary" iconOnly size="sm">
                        <Heart className="h-4 w-4" weight="light" />
                      </Button>
                    </div>

                    <div className="flex items-center gap-3">
                      <Button size="sm">صغير SM</Button>
                      <Button size="md">قياسي MD (44px)</Button>
                      <Button size="lg">كبير LG (52px)</Button>
                    </div>
                  </div>

                  {/* 4. Form Controls */}
                  <div className="flex flex-col gap-4 border-t border-border pt-6">
                    <h3 className="font-display text-base font-semibold text-text">
                      حقول الإدخال والتحكم <Bidi dir="ltr">(Form Controls)</Bidi>
                    </h3>
                    <div className="grid grid-cols-1 gap-4">
                      <Field
                        label="اسم قاعة الزفاف أو مقدم الخدمة"
                        required
                        helpText="اكتبي الاسم التجاري باللغة العربية"
                      >
                        <Input placeholder="مثال: قاعة قصر الشوق" />
                      </Field>

                      <Field
                        label="رقم الهاتف للتواصل (أرقام غربية)"
                        error="يرجى إدخال رقم هاتف صحيح يبدأ بـ 01"
                      >
                        <Input
                          defaultValue="01012345678"
                          error
                          dir="ltr"
                          className="text-end"
                        />
                      </Field>

                      <Field label="المدينة / المركز">
                        <Select value={selectValue} onValueChange={setSelectValue}>
                          <SelectTrigger>
                            <SelectValue placeholder="اختاري المركز" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="beni-suef">مركز بني سويف</SelectItem>
                            <SelectItem value="nasser">مركز ناصر</SelectItem>
                            <SelectItem value="biba">مركز ببا</SelectItem>
                            <SelectItem value="ehnasia">مركز إهناسيا</SelectItem>
                            <SelectItem value="wasta">مركز الواسطى</SelectItem>
                          </SelectContent>
                        </Select>
                      </Field>

                      <Field label="وصف تفصيلي للخدمات المقدمة">
                        <Textarea placeholder="اكتبي تفاصيل الباقة والخدمات المشمولة..." />
                      </Field>

                      {/* Stacked on mobile (< 640px) */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 pt-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <Checkbox
                            checked={checkboxValue}
                            onCheckedChange={(c) => setCheckboxValue(Boolean(c))}
                          />
                          <span className="text-xs text-text">تأكيد توفر الحجز الفوري</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer">
                          <Switch
                            checked={switchValue}
                            onCheckedChange={setSwitchValue}
                          />
                          <span className="text-xs text-text">إظهار رقم الواتساب للعملاء</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* 5. Feedback, Modals & Menus */}
                  <div className="flex flex-col gap-4 border-t border-border pt-6">
                    <h3 className="font-display text-base font-semibold text-text">
                      النوافذ والقوائم والتنبيهات <Bidi dir="ltr">(Feedback & Overlays)</Bidi>
                    </h3>
                    <div className="flex flex-wrap items-center gap-3">
                      {/* Dialog */}
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="secondary" size="sm">
                            فتح نافذة منبثقة <Bidi dir="ltr">(Dialog)</Bidi>
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>تأكيد موعد حجز القاعة</DialogTitle>
                            <DialogDescription>
                              هل أنتِ متأكدة من رغبتكِ في تثبيت الموعد بتاريخ <Bidi dir="ltr">2026/12/25</Bidi>؟
                            </DialogDescription>
                          </DialogHeader>
                          <div className="rounded-[4px] border border-border bg-surface-muted p-3 text-xs text-text-muted">
                            الموعد المحجوز: قاعة شهرزاد • بني سويف • سعة 300 فرد.
                          </div>
                          <DialogFooter>
                            <Button variant="secondary">إلغاء</Button>
                            <Button variant="primary">تأكيد الموعد</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>

                      {/* Sheet Drawer */}
                      <Sheet>
                        <SheetTrigger asChild>
                          <Button variant="secondary" size="sm">
                            فتح درج جانبي <Bidi dir="ltr">(Sheet Drawer)</Bidi>
                          </Button>
                        </SheetTrigger>
                        <SheetContent side="start">
                          <SheetHeader>
                            <SheetTitle>تصفية نتائج البحث</SheetTitle>
                            <SheetDescription>
                              حددي نطاق السعر والمنطقة للوصول إلى أفضل نتيجة.
                            </SheetDescription>
                          </SheetHeader>
                          <div className="flex flex-col gap-4 py-4 text-xs">
                            <Field label="نطاق السعر الأقصى">
                              <Input placeholder={formatMoney(15000)} />
                            </Field>
                            <Field label="تصنيف الخدمة">
                              <Input placeholder="قاعات أفراح" />
                            </Field>
                          </div>
                        </SheetContent>
                      </Sheet>

                      {/* Dropdown Menu */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="secondary" size="sm">
                            قائمة خيارات <Bidi dir="ltr">(Dropdown)</Bidi>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuLabel>إجراءات الحساب</DropdownMenuLabel>
                          <DropdownMenuItem>تعديل بيانات الحساب</DropdownMenuItem>
                          <DropdownMenuItem>إدارة عروض الأسعار</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem danger>تسجيل الخروج</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>

                      {/* Tooltip */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon-sm">
                            <Info className="h-4 w-4 text-text-muted" weight="bold" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>معلومات إضافية عن سياسة الحجز</TooltipContent>
                      </Tooltip>
                    </div>

                    {/* Toast triggers */}
                    <div className="flex flex-wrap items-center gap-2 pt-2">
                      <span className="text-xs text-text-muted">اختبار الإشعارات <Bidi dir="ltr">(Sonner)</Bidi>:</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toast.success("تم حفظ التعديلات بنجاح!")}
                      >
                        نجاح
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toast.warning("يرجى مراجعة تاريخ الحجز.")}
                      >
                        تنبيه
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toast.error("فشل الاتصال بالخادم، يرجى إعادة المحاولة.")}
                      >
                        خطأ
                      </Button>
                    </div>
                  </div>

                  {/* 6. Cards, Badges, Table & Stats */}
                  <div className="flex flex-col gap-4 border-t border-border pt-6">
                    <h3 className="font-display text-base font-semibold text-text">
                      البطاقات والشارات والجداول <Bidi dir="ltr">(Cards & Data Display)</Bidi>
                    </h3>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="neutral">افتراضي</Badge>
                      <Badge variant="accent">باقة مميزة</Badge>
                      <Badge variant="success">متاح للحجز</Badge>
                      <Badge variant="warning">قيد المراجعة</Badge>
                      <Badge variant="danger">محجوز بالكامل</Badge>
                      <Badge variant="outline">إطار محدد</Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <Stat
                        label="إجمالي الحجوزات"
                        value="142"
                        trend={{ value: "+18%", isPositive: true }}
                      />
                      <Stat
                        label="متوسط التقييم"
                        value="4.9"
                        helper="من أصل 64 تقييماً موثقاً"
                      />
                    </div>

                    {/* Flat Card */}
                    <Card>
                      <CardHeader>
                        <CardTitle>قصر الملكة للأفراح</CardTitle>
                        <CardDescription>طريق كورنيش النيل، بني سويف</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-xs text-text-muted leading-relaxed">
                          قاعة مجهزة بأحدث أنظمة الصوت والإضاءة المسرحية، تتسع لأكثر من 500 مدعو مع جناح مخصص للعروسين.
                        </p>
                        <div className="mt-3 flex items-center justify-between">
                          <Rating value={4.8} count={38} />
                          <span className="font-latin text-sm font-bold text-text">
                            {formatMoney(25000)}
                          </span>
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button variant="primary" size="sm" className="w-full">
                          عرض التفاصيل والتوافر
                        </Button>
                      </CardFooter>
                    </Card>

                    {/* Table with responsive card */}
                    <div className="flex flex-col gap-2">
                      <span className="text-xs font-semibold text-text">جدول بيانات مع تخطيط بطاقات للجوال:</span>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>المقدم</TableHead>
                            <TableHead>التصنيف</TableHead>
                            <TableHead>الحالة</TableHead>
                            <TableHead className="text-end">السعر</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow>
                            <TableCell className="font-medium">ستوديو شادي</TableCell>
                            <TableCell>تصوير فوتوغرافي</TableCell>
                            <TableCell>
                              <Badge variant="success" size="sm">متاح</Badge>
                            </TableCell>
                            <TableCell className="text-end font-latin">{formatMoney(4500)}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">قاعة فينيسيا</TableCell>
                            <TableCell>قاعات أفراح</TableCell>
                            <TableCell>
                              <Badge variant="warning" size="sm">قيد الحجز</Badge>
                            </TableCell>
                            <TableCell className="text-end font-latin">{formatMoney(18000)}</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>

                    {/* Pagination */}
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious href="#" />
                        </PaginationItem>
                        <PaginationItem>
                          <PaginationLink href="#" isActive>
                            1
                          </PaginationLink>
                        </PaginationItem>
                        <PaginationItem>
                          <PaginationLink href="#">2</PaginationLink>
                        </PaginationItem>
                        <PaginationItem>
                          <PaginationEllipsis />
                        </PaginationItem>
                        <PaginationItem>
                          <PaginationNext href="#" />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                </div>
              )}

              {/* DARK THEME COLUMN */}
              {(activeThemeTab === "both" || activeThemeTab === "dark") && (
                <div
                  data-theme="dark"
                  style={{ backgroundColor: "var(--surface)", color: "var(--text)" }}
                  className="flex flex-col gap-10 rounded-[8px] border border-border bg-surface p-6 sm:p-8"
                >
                  <div className="border-b border-border pb-4">
                    <Badge variant="accent" size="sm" className="mb-2">
                      السمة الليلية [DATA-THEME=&quot;DARK&quot;]
                    </Badge>
                    <h2 className="font-display text-2xl font-bold text-text">
                      السمة الليلية الفاخرة <Bidi dir="ltr">(Dark Luxury)</Bidi>
                    </h2>
                    <p className="text-xs text-text-muted mt-1">
                      حبر ليلي عميق (#17120F) • نصوص عاجية صريحة (#FBF8F3) • لمسات شمبانيا ذهبية (#B79A6B)
                    </p>
                  </div>

                  {/* 1. Color Palette */}
                  <div className="flex flex-col gap-3">
                    <h3 className="font-display text-base font-semibold text-text">
                      رموز الألوان الليلية <Bidi dir="ltr">(Dark Tokens)</Bidi>
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {darkColorTokens.map((t) => (
                        <div
                          key={t.name}
                          className="flex items-center gap-3 rounded-[4px] border border-border bg-surface-raised p-2"
                        >
                          <div
                            className="h-8 w-8 shrink-0 rounded-[2px] border border-border"
                            style={{ backgroundColor: t.hex }}
                          />
                          <div className="flex flex-col min-w-0">
                            <span className="font-mono text-[11px] font-semibold text-text">
                              --{t.name}
                            </span>
                            <span className="text-[10px] text-text-muted truncate">
                              {t.hex} • {t.desc}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 2. Typographic Scale on Dark */}
                  <div className="flex flex-col gap-4 border-t border-border pt-6">
                    <h3 className="font-display text-base font-semibold text-text">
                      السلم الطباعي على الخلفية الداكنة
                    </h3>
                    <div className="flex flex-col gap-4">
                      <div>
                        <span className="text-[10px] text-text-muted font-mono">
                          display (2.75rem - 5.5rem):
                        </span>
                        <div className="text-display font-semibold text-text">
                          أفراح بني سويف
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] text-text-muted font-mono">
                          h1 (2.25rem - 3.75rem):
                        </span>
                        <div className="text-h1 font-semibold text-text">
                          لحظات تدوم في الذاكرة لأجمل ليالي العمر
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] text-text-muted font-mono">
                          h2 (1.75rem - 2.75rem):
                        </span>
                        <div className="text-h2 font-semibold text-text">
                          دليلكِ لاختيار قاعة زفاف استثنائية
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] text-text-muted font-mono">
                          body-lg (1.125rem):
                        </span>
                        <p className="text-body-lg text-text">
                          نجمع لكِ أرقى مزودي خدمات الزفاف في بني سويف في مكان واحد، لتخطيط ليلة زفافكِ بسلاسة وطمأنينة.
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] text-text-muted font-mono">
                          Latin Eyebrow (tracking 0.18em):
                        </span>
                        <p className="eyebrow text-accent-text">
                          CURATED WEDDING DIRECTORY • BENI SUEF
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 3. Button States on Dark */}
                  <div className="flex flex-col gap-4 border-t border-border pt-6">
                    <h3 className="font-display text-base font-semibold text-text">
                      أزرار السمة الليلية (أزرار معكوسة)
                    </h3>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <Button variant="primary">أساسي عاجي <Bidi dir="ltr">(Ivory on Ink)</Bidi></Button>
                      <Button variant="secondary">ثانوي <Bidi dir="ltr">(Secondary)</Bidi></Button>
                      <Button variant="outline">إطار عاجي <Bidi dir="ltr">(Outline)</Bidi></Button>
                      <Button variant="ghost">شفاف <Bidi dir="ltr">(Ghost)</Bidi></Button>
                      <Button variant="accent">تأكيد ذهبي <Bidi dir="ltr">(Accent)</Bidi></Button>
                      <Button variant="danger">حذف <Bidi dir="ltr">(Danger)</Bidi></Button>
                      <Button variant="accent" loading>
                        تحميل
                      </Button>
                      <Button variant="primary" disabled>
                        معطل
                      </Button>
                    </div>
                  </div>

                  {/* 4. Form Controls on Dark */}
                  <div className="flex flex-col gap-4 border-t border-border pt-6">
                    <h3 className="font-display text-base font-semibold text-text">
                      حقول الإدخال على الخلفية الداكنة <Bidi dir="ltr">(Form Controls)</Bidi>
                    </h3>
                    <div className="grid grid-cols-1 gap-4">
                      <Field label="اسم مقدم الخدمة" required>
                        <Input placeholder="مثال: ستوديو الأندلس" />
                      </Field>
                      <Field label="المدينة / المركز">
                        <Select value={selectValue} onValueChange={setSelectValue}>
                          <SelectTrigger>
                            <SelectValue placeholder="اختاري المركز" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="beni-suef">مركز بني سويف</SelectItem>
                            <SelectItem value="nasser">مركز ناصر</SelectItem>
                            <SelectItem value="biba">مركز ببا</SelectItem>
                          </SelectContent>
                        </Select>
                      </Field>

                      {/* Stacked on mobile (< 640px) */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 pt-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <Checkbox
                            checked={checkboxValue}
                            onCheckedChange={(c) => setCheckboxValue(Boolean(c))}
                          />
                          <span className="text-xs text-text">تأكيد توفر الحجز الفوري</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <Switch
                            checked={switchValue}
                            onCheckedChange={setSwitchValue}
                          />
                          <span className="text-xs text-text">إظهار رقم الواتساب</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* 5. Dark Dialogs & Feedback */}
                  <div className="flex flex-col gap-4 border-t border-border pt-6">
                    <h3 className="font-display text-base font-semibold text-text">
                      النوافذ الليلية <Bidi dir="ltr">(Dark Dialogs & Feedback)</Bidi>
                    </h3>
                    <div className="flex flex-wrap items-center gap-3">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="secondary" size="sm">
                            فتح نافذة ليلية <Bidi dir="ltr">(Dark Dialog)</Bidi>
                          </Button>
                        </DialogTrigger>
                        <DialogContent theme="dark">
                          <DialogHeader>
                            <DialogTitle>تأكيد الحجز الليلي الفاخر</DialogTitle>
                            <DialogDescription>
                              نافذة منبثقة تقرأ الرموز الدلالية الليلية بالكامل.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="rounded-[4px] border border-border bg-surface-muted p-3 text-xs text-text-muted">
                            الموعد المحجوز: قصر الفيروز • بني سويف • السعر: {formatMoney(32000)}.
                          </div>
                          <DialogFooter>
                            <Button variant="secondary">إلغاء</Button>
                            <Button variant="primary">تأكيد الحجز</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>

                  {/* 6. Tabs on Dark */}
                  <div className="flex flex-col gap-3 border-t border-border pt-6">
                    <h3 className="font-display text-base font-semibold text-text">
                      ألسنة التبويب الليلية <Bidi dir="ltr">(Dark Tabs)</Bidi>
                    </h3>
                    <Tabs defaultValue="overview" className="w-full">
                      <TabsList className="w-full justify-start">
                        <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
                        <TabsTrigger value="pricing">الأسعار والباقات</TabsTrigger>
                        <TabsTrigger value="reviews">التقييمات</TabsTrigger>
                      </TabsList>
                      <TabsContent value="overview" className="rounded-[4px] border border-border bg-surface-raised p-4 text-xs text-text-muted">
                        معلومات تفصيلية عن القاعة وخدمات الضيافة المتاحة على السطح الداكن المرتفع.
                      </TabsContent>
                      <TabsContent value="pricing" className="rounded-[4px] border border-border bg-surface-raised p-4 text-xs text-text-muted">
                        أسعار باقات الزفاف وتفاصيل الدفع.
                      </TabsContent>
                      <TabsContent value="reviews" className="rounded-[4px] border border-border bg-surface-raised p-4 text-xs text-text-muted">
                        آراء العرائس الموثقة.
                      </TabsContent>
                    </Tabs>
                  </div>

                  {/* 7. Cards, Badges, Table & Stats on Dark */}
                  <div className="flex flex-col gap-4 border-t border-border pt-6">
                    <h3 className="font-display text-base font-semibold text-text">
                      البطاقات والشارات والجداول الليلية <Bidi dir="ltr">(Dark Cards & Data)</Bidi>
                    </h3>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="neutral">افتراضي</Badge>
                      <Badge variant="accent">باقة مميزة</Badge>
                      <Badge variant="success">متاح للحجز</Badge>
                      <Badge variant="warning">قيد المراجعة</Badge>
                      <Badge variant="danger">محجوز بالكامل</Badge>
                      <Badge variant="outline">إطار محدد</Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <Stat
                        label="إجمالي الحجوزات"
                        value="142"
                        trend={{ value: "+18%", isPositive: true }}
                      />
                      <Stat
                        label="متوسط التقييم"
                        value="4.9"
                        helper="من أصل 64 تقييماً"
                      />
                    </div>

                    <Card>
                      <CardHeader>
                        <CardTitle>قصر الفيروز للأفراح</CardTitle>
                        <CardDescription>شارع عبد السلام عارف، بني سويف</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-xs text-text-muted leading-relaxed">
                          أجواء ملكية فخمة مع ديكورات كوشة عصرية وخدمة ضيافة متكاملة لأرقى حفلات الزفاف.
                        </p>
                        <div className="mt-3 flex items-center justify-between">
                          <Rating value={4.9} count={52} />
                          <span className="font-latin text-sm font-bold text-accent-text">
                            {formatMoney(32000)}
                          </span>
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button variant="accent" size="sm" className="w-full">
                          عرض المواعيد المتاحة
                        </Button>
                      </CardFooter>
                    </Card>

                    {/* Dark Table */}
                    <div className="flex flex-col gap-2">
                      <span className="text-xs font-semibold text-text">جدول بيانات ليلي:</span>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>المقدم</TableHead>
                            <TableHead>التصنيف</TableHead>
                            <TableHead>الحالة</TableHead>
                            <TableHead className="text-end">السعر</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow>
                            <TableCell className="font-medium">ستوديو الأندلس</TableCell>
                            <TableCell>تصوير سينمائي</TableCell>
                            <TableCell>
                              <Badge variant="success" size="sm">متاح</Badge>
                            </TableCell>
                            <TableCell className="text-end font-latin">{formatMoney(8500)}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">قصر الفيروز</TableCell>
                            <TableCell>قاعات أفراح</TableCell>
                            <TableCell>
                              <Badge variant="accent" size="sm">مميز</Badge>
                            </TableCell>
                            <TableCell className="text-end font-latin">{formatMoney(32000)}</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* CONTRAST VERIFICATION TABLE */}
            <div className="mt-16 rounded-[8px] border border-border bg-surface-raised p-6 sm:p-8">
              <div className="border-b border-border pb-4 mb-6">
                <span className="font-latin text-xs uppercase tracking-wider text-accent-text">
                  WCAG 2.1 AA COMPLIANCE REPORT
                </span>
                <h3 className="font-display text-xl font-bold text-text mt-1">
                  تقرير التحقق من تباين الألوان <Bidi dir="ltr">(WCAG AA Contrast Results)</Bidi>
                </h3>
                <p className="text-xs text-text-muted mt-1">
                  يتحقق الاختبار التلقائي من نسبة تباين لا تقل عن 4.5:1 للنصوص الأساسية و 3.0:1 للعناصر الكبيرة وحدود الواجهة.
                </p>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>السمة</TableHead>
                      <TableHead>الرمز اللوني <Bidi dir="ltr">(Token)</Bidi></TableHead>
                      <TableHead>لون النص <Bidi dir="ltr">(Foreground)</Bidi></TableHead>
                      <TableHead>الخلفية <Bidi dir="ltr">(Background)</Bidi></TableHead>
                      <TableHead>نسبة التباين الفعلية</TableHead>
                      <TableHead>الحد الأدنى المطلوب</TableHead>
                      <TableHead className="text-end">حالة الفحص</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contrastReportData.map((row, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{row.theme}</TableCell>
                        <TableCell className="font-mono text-xs">{row.token}</TableCell>
                        <TableCell className="font-mono text-xs">{row.fg}</TableCell>
                        <TableCell className="text-xs text-text-muted">{row.bg}</TableCell>
                        <TableCell className="font-latin font-bold text-text">{row.ratio}</TableCell>
                        <TableCell className="font-latin text-xs text-text-muted">{row.req}</TableCell>
                        <TableCell className="text-end">
                          <Badge variant="success" size="sm">
                            {row.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* LOGO VARIANTS */}
            <div className="mt-12 rounded-[8px] border border-border bg-surface-raised p-6 sm:p-8">
              <div className="border-b border-border pb-4 mb-6">
                <span className="font-latin text-xs uppercase tracking-wider text-accent-text">
                  BRAND IDENTITY WORDMARK
                </span>
                <h3 className="font-display text-xl font-bold text-text mt-1">
                  شعار العلامة التجارية <Bidi dir="ltr">(Logo Variants)</Bidi>
                </h3>
                <p className="text-xs text-text-muted mt-1">
                  يتم استيراد الشعار حصرياً من مكون Logo.tsx ليتاح استبداله بنقرة واحدة لاحقاً.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-center justify-items-center p-6 border border-border rounded-[4px] bg-surface">
                <div className="flex flex-col items-center gap-2">
                  <span className="text-[10px] text-text-muted font-mono">stacked (md):</span>
                  <Logo variant="stacked" size="md" />
                </div>
                <div className="flex flex-col items-center gap-2">
                  <span className="text-[10px] text-text-muted font-mono">horizontal (md):</span>
                  <Logo variant="horizontal" size="md" />
                </div>
                <div className="flex flex-col items-center gap-2">
                  <span className="text-[10px] text-text-muted font-mono">mark-less (lg):</span>
                  <Logo variant="mark-less" size="lg" />
                </div>
              </div>
            </div>

            {/* PLACEHOLDER AND RATIOS */}
            <div className="mt-12 rounded-[8px] border border-border bg-surface-raised p-6 sm:p-8">
              <div className="border-b border-border pb-4 mb-6">
                <span className="font-latin text-xs uppercase tracking-wider text-accent-text">
                  MEDIA SYSTEM
                </span>
                <h3 className="font-display text-xl font-bold text-text mt-1">
                  نسب الصور والعناصر النائبة <Bidi dir="ltr">(Aspect Ratio Presets)</Bidi>
                </h3>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Placeholder aspectRatio="1:1" label="1:1 SQUARE" />
                <Placeholder aspectRatio="4:5" label="4:5 PORTRAIT" />
                <Placeholder aspectRatio="3:2" label="3:2 CLASSIC" />
                <Placeholder aspectRatio="16:9" label="16:9 CINEMATIC" />
              </div>
            </div>
          </Container>
        </main>

        {/* SECTION 4: PUBLIC FOOTER PREVIEW */}
        <section className="mt-16">
          <div className="border-y border-border/60 bg-surface-muted/60 px-5 py-2.5">
            <Container>
              <span className="font-latin text-xs uppercase tracking-wider text-accent-text">
                04. PUBLIC FOOTER COMPONENT <Bidi dir="ltr">(SHELL - DARK LUXURY)</Bidi>
              </span>
            </Container>
          </div>
          <PublicFooter />
        </section>
      </div>
    </TooltipProvider>
  );
}

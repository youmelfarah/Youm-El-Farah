"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CalendarHeart, X } from "@phosphor-icons/react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { formatArabicDateString } from "@/lib/calendar-dates";
import { setWeddingDate, clearWeddingDate } from "@/lib/wedding-date";
import { WeddingDateCalendar } from "./wedding-date-calendar";
import { cn } from "@/lib/cn";

export interface WeddingDatePickerProps {
  currentDate?: string | null;
  onSelectDate?: (date: string) => void;
  onClearDate?: () => void;
  trigger?: React.ReactNode;
  className?: string;
  variant?: "solid" | "transparent";
}

export function WeddingDatePicker({
  currentDate,
  onSelectDate,
  onClearDate,
  trigger,
  className,
  variant = "solid",
}: WeddingDatePickerProps) {
  const router = useRouter();
  const [openDesktop, setOpenDesktop] = React.useState(false);
  const [openMobile, setOpenMobile] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();

  const handleSelect = (date: string) => {
    setOpenDesktop(false);
    setOpenMobile(false);
    startTransition(async () => {
      try {
        await setWeddingDate(date);
        onSelectDate?.(date);
        router.refresh();
      } catch (err) {
        console.error("Failed to set wedding date:", err);
      }
    });
  };

  const handleClear = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    startTransition(async () => {
      try {
        await clearWeddingDate();
        onClearDate?.();
        router.refresh();
      } catch (err) {
        console.error("Failed to clear wedding date:", err);
      }
    });
  };

  const defaultTrigger = currentDate ? (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-[4px] border px-3 py-1.5 text-xs transition-colors",
        variant === "transparent"
          ? "border-white/20 bg-black/40 text-white hover:bg-black/60"
          : "border-border bg-surface-raised text-text hover:bg-surface-muted",
        className
      )}
    >
      <CalendarHeart className="h-4 w-4 text-accent-text" weight="fill" />
      <span className="font-medium">
        يوم فرحك: {formatArabicDateString(currentDate)}
      </span>
      <button
        type="button"
        onClick={handleClear}
        disabled={isPending}
        aria-label="مسح تاريخ الزفاف"
        className="ms-1 flex h-6 w-6 items-center justify-center rounded-[2px] text-text-muted hover:text-danger hover:bg-surface-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <X className="h-3.5 w-3.5" weight="bold" />
      </button>
    </div>
  ) : (
    <Button
      variant={variant === "transparent" ? "secondary" : "outline"}
      size="sm"
      className={cn("min-h-[44px] gap-2 text-xs", className)}
    >
      <CalendarHeart className="h-4 w-4" weight="light" />
      <span>اختاري يوم فرحك</span>
    </Button>
  );

  return (
    <>
      {/* Desktop Popover (hidden on mobile < 768px) */}
      <div className="hidden md:inline-flex">
        <Popover open={openDesktop} onOpenChange={setOpenDesktop}>
          <PopoverTrigger asChild>
            {trigger ? (
              <div onClick={() => setOpenDesktop(true)} role="button" tabIndex={0}>
                {trigger}
              </div>
            ) : (
              defaultTrigger
            )}
          </PopoverTrigger>
          <PopoverContent align="center" sideOffset={8} className="p-4">
            <div className="mb-2 pb-2 border-b border-border flex items-center justify-between">
              <span className="text-xs font-semibold text-text">حددي تاريخ الزفاف</span>
              {currentDate && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-[11px] text-text-muted hover:text-danger transition-colors"
                >
                  مسح التاريخ
                </button>
              )}
            </div>
            <WeddingDateCalendar
              selectedDate={currentDate}
              onSelectDate={handleSelect}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Mobile Sheet (hidden on desktop >= 768px) */}
      <div className="inline-flex md:hidden">
        <Sheet open={openMobile} onOpenChange={setOpenMobile}>
          <SheetTrigger asChild>
            {trigger ? (
              <div onClick={() => setOpenMobile(true)} role="button" tabIndex={0}>
                {trigger}
              </div>
            ) : (
              defaultTrigger
            )}
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-[12px] p-5 max-h-[90vh] overflow-y-auto">
            <SheetHeader className="pb-3 border-b border-border">
              <SheetTitle className="text-base font-bold font-display text-text">
                اختاري يوم فرحكِ
              </SheetTitle>
            </SheetHeader>
            <div className="flex flex-col items-center justify-center pt-4">
              <WeddingDateCalendar
                selectedDate={currentDate}
                onSelectDate={handleSelect}
              />
              {currentDate && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClear}
                  className="mt-4 text-xs text-danger hover:text-danger min-h-[44px]"
                >
                  مسح التاريخ المحدد
                </Button>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}

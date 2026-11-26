# Task 9 Decisions Log

- **Database migration naming:** Created `0004_task9_core_marketplace` via `prisma migrate diff` and applied with `scripts/apply-sql.mjs`.
- **Rate limits backing:** DB-backed timestamp queries (`createdAt >= 24h ago`) are used for reviews (5/24h), review reports (10/24h), and leads (5/24h total, 1/24h per provider) so limits survive server restarts, while favorites toggle (200/24h soft limit) uses an in-memory sliding-window limiter (`InMemoryRateLimiter`) for low-latency optimistic toggles.
- **Google Maps URL domains:** `mapsUrlSchema` accepts `https://` URLs on `google.com/maps*`, `www.google.com/maps*`, `google.com.eg/maps*`, `maps.google.com*`, `maps.app.goo.gl/*`, and `goo.gl/maps/*`.
- **Opening hours schedule order and time range:** Weekly schedule uses Saturday-first Egyptian week ordering (`saturday` through `friday`) with 24-hour `HH:MM` validation (`open < close`) when open, and stores `null` when all days are disabled or unset.
- **FAQs & Highlights limits:** Providers can add up to 10 FAQs (`question` 5–200 chars, `answer` 5–1000 chars) and up to 8 quick highlight chips (2–40 chars each, deduplicated).
- **Review average rounding:** `averageRating` is rounded to 2 decimal places (`Math.round(avg * 100) / 100`) and set to `0` when `reviewCount === 0`, with `rankScore` recomputed via `computeRankScore()` inside the same Prisma transaction.
- **Lead status mapping:** `LeadStatus` values map in Arabic to: `NEW` ("جديد"), `CONTACTED` ("تم التواصل"), `BOOKED` ("تم الحجز"), `DECLINED` ("لم يتم الاتفاق"), and `SPAM` ("مزعج").

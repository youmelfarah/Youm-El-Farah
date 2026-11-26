import { describe, expect, it } from "vitest";
import {
  addMonthsCairo,
  cairoStartOfDay,
  daysUntil,
  getLastCoveredDateString,
  toCairoDateString,
} from "@/lib/cairo-time";

describe("Cairo time helpers and DST boundaries", () => {
  it("converts UTC instants near midnight to the correct Cairo calendar date", () => {
    // 2026-01-15T22:30:00Z is 2026-01-16 00:30 in Cairo (UTC+2 in winter)
    expect(toCairoDateString(new Date("2026-01-15T22:30:00Z"))).toBe("2026-01-16");
    // 2026-01-15T21:30:00Z is 2026-01-15 23:30 in Cairo (UTC+2 in winter)
    expect(toCairoDateString(new Date("2026-01-15T21:30:00Z"))).toBe("2026-01-15");
  });

  it("handles Egypt spring-forward DST boundary accurately (April 2026)", () => {
    // Egypt DST starts last Friday of April (2026-04-24 00:00 -> 01:00, UTC+2 -> UTC+3)
    const beforeDst = cairoStartOfDay("2026-04-23");
    const onDstDay = cairoStartOfDay("2026-04-24");
    const afterDst = cairoStartOfDay("2026-04-25");

    expect(toCairoDateString(beforeDst)).toBe("2026-04-23");
    expect(toCairoDateString(onDstDay)).toBe("2026-04-24");
    expect(toCairoDateString(afterDst)).toBe("2026-04-25");

    // 2026-04-24T21:30:00Z is 2026-04-25 00:30 in Cairo (UTC+3 during DST)
    expect(toCairoDateString(new Date("2026-04-24T21:30:00Z"))).toBe("2026-04-25");
  });

  it("handles Egypt fall-back DST boundary accurately (October 2026)", () => {
    // End of October transitions back from UTC+3 to UTC+2
    const oct29 = cairoStartOfDay("2026-10-29");
    const oct30 = cairoStartOfDay("2026-10-30");
    const oct31 = cairoStartOfDay("2026-10-31");

    expect(toCairoDateString(oct29)).toBe("2026-10-29");
    expect(toCairoDateString(oct30)).toBe("2026-10-30");
    expect(toCairoDateString(oct31)).toBe("2026-10-31");
  });

  it("computes daysUntil across DST transition correctly", () => {
    const apr23Midday = new Date("2026-04-23T12:00:00Z");
    const apr25Start = cairoStartOfDay("2026-04-25");
    expect(daysUntil(apr25Start, apr23Midday)).toBe(2);
  });

  it("returns last covered calendar day and adds months cleanly", () => {
    const endsAt = cairoStartOfDay("2026-05-01");
    expect(getLastCoveredDateString(endsAt)).toBe("2026-04-30");
    expect(addMonthsCairo("2026-01-31", 1)).toBe("2026-02-28");
  });
});

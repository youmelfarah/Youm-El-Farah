export const DISTRICT_VALUES = [
  "BENI_SUEF_CITY",
  "EL_WASTA",
  "NASSER",
  "IHNASYA",
  "BABA",
  "EL_FASHN",
  "SAMASTA",
] as const;

export type DistrictKey = (typeof DISTRICT_VALUES)[number];

export const DISTRICT_LABELS: Record<DistrictKey, string> = {
  BENI_SUEF_CITY: "بني سويف",
  EL_WASTA: "الواسطى",
  NASSER: "ناصر",
  IHNASYA: "إهناسيا",
  BABA: "ببا",
  EL_FASHN: "الفشن",
  SAMASTA: "سمسطا",
};

export const DISTRICT_OPTIONS: { value: DistrictKey; label: string }[] =
  DISTRICT_VALUES.map((value) => ({
    value,
    label: DISTRICT_LABELS[value],
  }));


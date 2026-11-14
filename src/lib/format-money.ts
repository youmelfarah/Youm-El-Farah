/**
 * Formats a monetary amount using Western digits with thousands separators
 * and the Arabic currency suffix "ج.م" (Egyptian Pound).
 * Example: formatMoney(6500) => "6,500 ج.م"
 */
export function formatMoney(
  amount: number | null | undefined,
  options?: { fallback?: string }
): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return options?.fallback ?? "-";
  }

  // Format with en-US locale to ensure Western digits (0-9) and comma thousands separators
  const formattedNumber = Number(amount).toLocaleString("en-US");
  return `${formattedNumber} ج.م`;
}

/**
 * Formats a user's full name into a privacy-preserving reviewer display name:
 * first name + first letter of last name + period (e.g. "نورا محمد" -> "نورا م.").
 * Never returns an email address.
 */
export function formatReviewerDisplayName(
  fullName: string | null | undefined
): string {
  const trimmed = (fullName ?? "").trim();
  if (!trimmed) {
    return "زائرة";
  }

  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "زائرة";
  }

  const first = parts[0];
  if (parts.length === 1) {
    // Guard against someone's account name being set to an email address
    if (first.includes("@")) {
      const localPart = first.split("@")[0]?.trim();
      return localPart || "زائرة";
    }
    return first;
  }

  const last = parts[parts.length - 1];
  const lastInitial = Array.from(last)[0];
  if (!lastInitial) {
    return first;
  }

  return `${first} ${lastInitial}.`;
}

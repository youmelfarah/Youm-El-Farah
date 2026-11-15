/**
 * Client-side anonymous tracking helpers.
 * Never collects or sends any personal data, IPs, or device info.
 */

export function trackContactClick(
  providerId: string,
  type: "whatsapp" | "call"
) {
  if (typeof window === "undefined") return;

  const payload = JSON.stringify({ providerId, type });

  // Use sendBeacon if available (ideal for outgoing links)
  if (navigator.sendBeacon) {
    try {
      const blob = new Blob([payload], { type: "application/json" });
      const success = navigator.sendBeacon("/api/track", blob);
      if (success) return;
    } catch {
      // Fallback to fetch with keepalive
    }
  }

  fetch("/api/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload,
    keepalive: true,
  }).catch(() => {
    // Ignore tracking errors silently
  });
}

/**
 * Tracks a profile view 2 seconds after mounting to ignore bounces & prefetch.
 */
export function useTrackProfileView(providerId: string) {
  if (typeof window === "undefined") return;

  const timer = setTimeout(() => {
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ providerId, type: "view" }),
      keepalive: true,
    }).catch(() => {});
  }, 2000);

  return () => clearTimeout(timer);
}

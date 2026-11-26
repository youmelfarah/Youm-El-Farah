import { createHmac } from "crypto";

export interface LeadCreatedWebhookPayload {
  event: "lead.created";
  leadId: string;
  providerId: string;
  providerSlug: string;
  providerName: string;
  offerId: string | null;
  offerTitle: string | null;
  weddingDate: string | null;
  createdAt: string;
}

/**
 * Sends a fire-and-forget HMAC-signed webhook notification when a new lead is created.
 * Never throws and never logs visitor PII.
 */
export async function sendLeadCreatedWebhook(
  payload: LeadCreatedWebhookPayload
): Promise<void> {
  const webhookUrl = process.env.LEADS_WEBHOOK_URL?.trim();
  if (!webhookUrl) {
    return;
  }

  let parsed: URL;
  try {
    parsed = new URL(webhookUrl);
  } catch {
    return;
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return;
  }

  const body = JSON.stringify(payload);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-YoumElFarah-Event": payload.event,
  };

  const secret = process.env.LEADS_WEBHOOK_SECRET?.trim();
  if (secret) {
    const signature = createHmac("sha256", secret).update(body).digest("hex");
    headers["X-YoumElFarah-Signature"] = `sha256=${signature}`;
  }

  try {
    await fetch(parsed.toString(), {
      method: "POST",
      headers,
      body,
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    // Non-blocking outbound webhook; ignore delivery errors
  }
}

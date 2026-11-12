export interface SendSmsInput {
  to: string;
  message: string;
}

type SmsProvider = "console" | "twilio" | "webhook";

function resolveSmsProvider(): SmsProvider {
  const configured = process.env.SMS_PROVIDER?.trim().toLowerCase();
  if (configured === "twilio" || configured === "webhook" || configured === "console") {
    return configured;
  }
  return "console";
}

function maskPhone(phone: string): string {
  if (phone.length <= 6) return "***";
  return `${phone.slice(0, 4)}****${phone.slice(-3)}`;
}

async function sendViaTwilio({ to, message }: SendSmsInput): Promise<void> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  const from = process.env.TWILIO_FROM_NUMBER?.trim();

  if (!accountSid || !authToken || !from) {
    throw new Error(
      "TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_FROM_NUMBER must be configured"
    );
  }

  const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(accountSid)}/Messages.json`;
  const credentials = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
  const body = new URLSearchParams({
    To: to,
    From: from,
    Body: message,
  });

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  if (!response.ok) {
    throw new Error(`Twilio SMS delivery failed with status ${response.status}`);
  }
}

async function sendViaWebhook({ to, message }: SendSmsInput): Promise<void> {
  const webhookUrl = process.env.SMS_WEBHOOK_URL?.trim();
  const webhookSecret = process.env.SMS_WEBHOOK_SECRET?.trim();

  if (!webhookUrl) {
    throw new Error("SMS_WEBHOOK_URL must be configured");
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (webhookSecret) {
    headers.Authorization = `Bearer ${webhookSecret}`;
  }

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers,
    body: JSON.stringify({ to, message }),
  });

  if (!response.ok) {
    throw new Error(`Webhook SMS delivery failed with status ${response.status}`);
  }
}

export async function sendSms(input: SendSmsInput): Promise<void> {
  const provider = resolveSmsProvider();

  if (provider === "twilio") {
    await sendViaTwilio(input);
    return;
  }

  if (provider === "webhook") {
    await sendViaWebhook(input);
    return;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "SMS_PROVIDER=console is not permitted in production. Configure twilio or webhook."
    );
  }

  console.info(`[SMS:console] To: ${maskPhone(input.to)} | ${input.message}`);
}

export async function sendOtpSms(phone: string, code: string): Promise<void> {
  const message = `رمز التحقق الخاص بك في يوم الفرح هو: ${code} (صالح لمدة 5 دقائق)`;
  await sendSms({ to: phone, message });
}


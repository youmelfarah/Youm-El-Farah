# إشعارات الطلبات الجديدة (Leads Webhook)

عند استلام طلب عرض سعر جديد (`Lead`) من زائرة مسجلة، تقوم المنصة بإرسال إشعار HTTP `POST` غير حاجب (Non-blocking) إلى عنوان الـ Webhook المحدّد في متغيرات البيئة.

## متغيرات البيئة

- `LEADS_WEBHOOK_URL`: رابط نقطة الاستقبال (يفضّل HTTPS). عند تركه فارغاً يتم تعطيل الإرسال تلقائياً.
- `LEADS_WEBHOOK_SECRET`: مفتاح سري اختياري لتوقيع الطلب عبر `HMAC-SHA256`.

## الترويسات المرسلة (Headers)

- `Content-Type: application/json`
- `X-YoumElFarah-Event: lead.created`
- `X-YoumElFarah-Signature: sha256=<hex_digest>` (تُرسل عند ضبط `LEADS_WEBHOOK_SECRET`)

## شكل البيانات (Payload)

```json
{
  "event": "lead.created",
  "leadId": "clx...",
  "providerId": "clx...",
  "providerSlug": "palace-hall-beni-suef",
  "providerName": "قاعة القصر الملكي",
  "offerId": "clx...",
  "offerTitle": "باقة الفرح الذهبية",
  "weddingDate": "2026-09-18",
  "createdAt": "2026-11-26T20:00:00.000Z"
}
```

> **حماية الخصوصية:** لا يتضمن الإشعار رقم هاتف الزائرة أو بريدها الإلكتروني أو نص رسالتها، وتظل البيانات الشخصية محفوظة داخل لوحة مقدم الخدمة فقط.

## التحقق من التوقيع (Node.js)

```ts
import { createHmac, timingSafeEqual } from "crypto";

function verifySignature(rawBody: string, headerSig: string, secret: string): boolean {
  const expected = `sha256=${createHmac("sha256", secret).update(rawBody).digest("hex")}`;
  const a = Buffer.from(expected);
  const b = Buffer.from(headerSig);
  return a.length === b.length && timingSafeEqual(a, b);
}
```

## المهلة (Timeout)

تنتهي مهلة الطلب بعد `5000` مللي ثانية ولا يؤثر تعذّر وصول الإشعار على نجاح حفظ طلب الزائرة.

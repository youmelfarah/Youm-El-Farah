# سير عمل تعديل قاعدة البيانات (Database Workflow)

## سبب استخدام هذا الأسلوب
على هذا الجهاز لا يتمكن محرك المخطط الخاص بـ Prisma (`schema-engine`) من الاتصال بقاعدة البيانات ويفشل بالخطأ `P1001`، بينما يعمل مشغّل `pg` في Node.js بشكل طبيعي باستخدام `DIRECT_URL`.
لذلك يتم توليد ملفات SQL للمهاجرات (Migrations) دون اتصال عبر `prisma migrate diff` ثم تطبيقها مباشرة على قاعدة البيانات باستخدام السكربت `scripts/apply-sql.mjs`.

> **تنبيه مهم:** تجنّب استخدام أوامر `prisma migrate dev` و`prisma migrate deploy` و`prisma migrate resolve` و`prisma db push` ما دامت مشكلة اتصال `schema-engine` قائمة، لأنها جميعًا تعتمد على `schema-engine`.

---

## الملفات الأساسية
- `prisma/schema.prisma`: المخطط الحالي (المصدر الأساسي للتعديلات).
- `prisma/.applied-schema.prisma`: نسخة احتياطية (Snapshot) تمثل آخر حالة تم تطبيقها فعليًا على قاعدة البيانات.
- `prisma/migrations/`: مجلد المهاجرات المرقّمة بالتسلسل (مثل `0001_init`، `0002_...`).
- `scripts/apply-sql.mjs`: سكربت يطبّق ملف `.sql` داخل معاملة واحدة (Transaction) عبر `pg` و`DIRECT_URL`.

---

## خطوات تطبيق أي تعديل مستقبلي على المخطط

1. **عدّل المخطط** في `prisma/schema.prisma`.
2. **ولّد ملف SQL للفرق** بين آخر نسخة مطبّقة والنسخة الجديدة:
   ```bash
   npx prisma migrate diff --from-schema prisma/.applied-schema.prisma --to-schema prisma/schema.prisma --script
   ```
3. **احفظ الناتج بترميز UTF-8 بدون BOM** داخل مجلد جديد مرقّم تحت `prisma/migrations/` (مثلاً `prisma/migrations/0002_add_field/migration.sql`).
   > **تحذير في PowerShell:** لا تستخدم إعادة التوجيه `>` في PowerShell لأنها تحفظ الملف بترميز UTF-16. استخدم خيار `-o` في Prisma أو أداة/سكربت Node.js يكتب بترميز UTF-8 بدون BOM، وتأكد من عدم تضمين رسائل `stderr` داخل الملف:
   > ```bash
   > npx prisma migrate diff --from-schema prisma/.applied-schema.prisma --to-schema prisma/schema.prisma --script -o prisma/migrations/0002_change_name/migration.sql
   > ```
4. **راجع ملف `migration.sql` الناتج** للتأكد من سلامة الأوامر قبل التنفيذ.
5. **طبّق التعديل على قاعدة البيانات** باستخدام سكربت `db:apply` (مرّر `--force` لأن جدول `User` موجود بالفعل):
   ```bash
   npm run db:apply -- prisma/migrations/0002_change_name/migration.sql --force
   ```
6. **حدّث نسخة المخطط المطبّقة (Snapshot)** بعد نجاح التنفيذ مباشرة:
   - انسخ `prisma/schema.prisma` إلى `prisma/.applied-schema.prisma`.
7. **حدّث Prisma Client** إذا تغيرت النماذج أو الحقول:
   ```bash
   npx prisma generate
   ```

---

## عند إصلاح اتصال `schema-engine` مستقبلاً (Baseline)
إذا أمكن لاحقًا الاتصال عبر `schema-engine` (مثلاً من بيئة أخرى أو بعد حل مشكلة الشبكة)، يجب أولاً تسجيل المهاجرة الأساسية (وكل مهاجرة طُبّقت يدويًا) كمطبّقة في سجل Prisma Migrate قبل تشغيل `migrate deploy` أو `migrate dev`:

```bash
npx prisma migrate resolve --applied 0001_init
```

(وكرر الأمر لأي مهاجرات لاحقة تم تطبيقها يدويًا بالترتيب، مثل `0002_...`، ثم تحقق بالحالة عبر `npx prisma migrate status`).


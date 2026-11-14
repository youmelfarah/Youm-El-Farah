import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import {
  addMonthsCairo,
  cairoStartOfDay,
  toCairoDateString,
} from "../src/lib/cairo-time";

async function main() {
  console.log("🌱 Seeding demo providers and subscriptions...");

  // 1. Find an admin user to attribute created subscriptions and logs to
  let admin = await prisma.user.findFirst({
    where: { role: "ADMIN" },
  });

  if (!admin) {
    admin = await prisma.user.create({
      data: {
        name: "[DEMO] المشرف الإداري",
        email: "demo-admin@example.com",
        role: "ADMIN",
        emailVerified: true,
        isActive: true,
      },
    });
    console.log("Created demo admin user");
  }

  // 2. Fetch categories
  const categories = await prisma.category.findMany({
    where: { isActive: true },
  });

  const photoCat = categories.find((c) => c.slug === "photographer") || categories[0];
  const venueCat = categories.find((c) => c.slug === "venues") || categories[0];
  const makeupCat = categories.find((c) => c.slug === "makeup-artist") || categories[0];
  const atelierCat = categories.find((c) => c.slug === "atelier") || categories[0];

  const now = new Date();
  const todayStr = toCairoDateString(now);

  // Helper dates in Cairo time
  const sixMonthsAgo = cairoStartOfDay(addMonthsCairo(todayStr, -6));
  const oneYearFuture = cairoStartOfDay(addMonthsCairo(todayStr, 12));
  const fifteenDaysFuture = new Date(now.getTime() + 15 * 24 * 3600 * 1000);
  const tenDaysPast = new Date(now.getTime() - 10 * 24 * 3600 * 1000);

  // 3. Demo Provider 1: Approved + Active Subscription (> 30 days)
  const user1 = await prisma.user.upsert({
    where: { email: "demo-photographer@example.com" },
    update: { name: "[DEMO] مصور 1", role: "PROVIDER", isActive: true },
    create: {
      name: "[DEMO] مصور 1",
      email: "demo-photographer@example.com",
      role: "PROVIDER",
      emailVerified: true,
      isActive: true,
    },
  });

  const prov1 = await prisma.provider.upsert({
    where: { userId: user1.id },
    update: {
      name: "[DEMO] استوديو الأهرام للتصوير",
      status: "APPROVED",
      district: "BENI_SUEF_CITY",
      phone: "01001112222",
      whatsapp: "01001112222",
      bio: "استوديو تصوير فوتوغرافي وفيديو لجميع المناسبات السعيدة والأفراح.",
      adminNotes: "تم التحقق من أعمال المصور وهويته، نشاط موثوق ومميز.",
    },
    create: {
      userId: user1.id,
      slug: "demo-ahram-studio",
      name: "[DEMO] استوديو الأهرام للتصوير",
      status: "APPROVED",
      district: "BENI_SUEF_CITY",
      phone: "01001112222",
      whatsapp: "01001112222",
      bio: "استوديو تصوير فوتوغرافي وفيديو لجميع المناسبات السعيدة والأفراح.",
      adminNotes: "تم التحقق من أعمال المصور وهويته، نشاط موثوق ومميز.",
    },
  });

  if (photoCat) {
    await prisma.providerCategory.upsert({
      where: { providerId_categoryId: { providerId: prov1.id, categoryId: photoCat.id } },
      update: { isPrimary: true },
      create: { providerId: prov1.id, categoryId: photoCat.id, isPrimary: true },
    });
  }

  // Active sub
  const sub1 = await prisma.subscription.create({
    data: {
      providerId: prov1.id,
      status: "ACTIVE",
      startsAt: sixMonthsAgo,
      endsAt: oneYearFuture,
      amountPaid: 3500,
      paymentMethod: "INSTAPAY",
      planName: "الباقة السنوية الاحترافية",
      paymentNote: "تحويل إنستاباي رقم 998822",
      createdById: admin.id,
    },
  });

  await prisma.auditLog.create({
    data: {
      adminId: admin.id,
      action: "provider.approve",
      entityType: "Provider",
      entityId: prov1.id,
      providerId: prov1.id,
      details: { status: "APPROVED" },
    },
  });

  await prisma.auditLog.create({
    data: {
      adminId: admin.id,
      action: "subscription.create",
      entityType: "Subscription",
      entityId: sub1.id,
      providerId: prov1.id,
      details: { amountPaid: 3500, planName: "الباقة السنوية الاحترافية" },
    },
  });

  // 4. Demo Provider 2: Approved + Expiring Subscription (ends in 15 days)
  const user2 = await prisma.user.upsert({
    where: { email: "demo-venue@example.com" },
    update: { name: "[DEMO] قاعة 2", role: "PROVIDER", isActive: true },
    create: {
      name: "[DEMO] قاعة 2",
      email: "demo-venue@example.com",
      role: "PROVIDER",
      emailVerified: true,
      isActive: true,
    },
  });

  const prov2 = await prisma.provider.upsert({
    where: { userId: user2.id },
    update: {
      name: "[DEMO] قاعة شهرزاد للأفراح",
      status: "APPROVED",
      district: "EL_WASTA",
      phone: "01012345678",
      whatsapp: "01012345678",
      bio: "قاعة أفراح كبرى تسع حتى 500 فرد مع أحدث أنظمة الإضاءة والصوت.",
    },
    create: {
      userId: user2.id,
      slug: "demo-shahrazad-venue",
      name: "[DEMO] قاعة شهرزاد للأفراح",
      status: "APPROVED",
      district: "EL_WASTA",
      phone: "01012345678",
      whatsapp: "01012345678",
      bio: "قاعة أفراح كبرى تسع حتى 500 فرد مع أحدث أنظمة الإضاءة والصوت.",
    },
  });

  if (venueCat) {
    await prisma.providerCategory.upsert({
      where: { providerId_categoryId: { providerId: prov2.id, categoryId: venueCat.id } },
      update: { isPrimary: true },
      create: { providerId: prov2.id, categoryId: venueCat.id, isPrimary: true },
    });
  }

  const sub2 = await prisma.subscription.create({
    data: {
      providerId: prov2.id,
      status: "ACTIVE",
      startsAt: sixMonthsAgo,
      endsAt: cairoStartOfDay(toCairoDateString(fifteenDaysFuture)),
      amountPaid: 2500,
      paymentMethod: "CASH",
      planName: "باقة 6 أشهر",
      createdById: admin.id,
    },
  });

  await prisma.auditLog.create({
    data: {
      adminId: admin.id,
      action: "subscription.create",
      entityType: "Subscription",
      entityId: sub2.id,
      providerId: prov2.id,
      details: { amountPaid: 2500, note: "اشتراك يوشك على الانتهاء" },
    },
  });

  // 5. Demo Provider 3: Approved + Expired Subscription (ended 10 days ago)
  const user3 = await prisma.user.upsert({
    where: { email: "demo-makeup@example.com" },
    update: { name: "[DEMO] ميك اب 3", role: "PROVIDER", isActive: true },
    create: {
      name: "[DEMO] ميك اب 3",
      email: "demo-makeup@example.com",
      role: "PROVIDER",
      emailVerified: true,
      isActive: true,
    },
  });

  const prov3 = await prisma.provider.upsert({
    where: { userId: user3.id },
    update: {
      name: "[DEMO] بيوتي سنتر الملكة",
      status: "APPROVED",
      district: "NASSER",
      phone: "01198765432",
      whatsapp: "01198765432",
      bio: "خبيرة تجميل وميك اب ارتيست لأجمل إطلالة عروس.",
    },
    create: {
      userId: user3.id,
      slug: "demo-malika-beauty",
      name: "[DEMO] بيوتي سنتر الملكة",
      status: "APPROVED",
      district: "NASSER",
      phone: "01198765432",
      whatsapp: "01198765432",
      bio: "خبيرة تجميل وميك اب ارتيست لأجمل إطلالة عروس.",
    },
  });

  if (makeupCat) {
    await prisma.providerCategory.upsert({
      where: { providerId_categoryId: { providerId: prov3.id, categoryId: makeupCat.id } },
      update: { isPrimary: true },
      create: { providerId: prov3.id, categoryId: makeupCat.id, isPrimary: true },
    });
  }

  await prisma.subscription.create({
    data: {
      providerId: prov3.id,
      status: "ACTIVE",
      startsAt: sixMonthsAgo,
      endsAt: cairoStartOfDay(toCairoDateString(tenDaysPast)),
      amountPaid: 2000,
      paymentMethod: "VODAFONE_CASH",
      planName: "باقة 6 أشهر منتهية",
      createdById: admin.id,
    },
  });

  // 6. Demo Provider 4: Pending Approval + No Subscription
  const user4 = await prisma.user.upsert({
    where: { email: "demo-dj@example.com" },
    update: { name: "[DEMO] دي جي 4", role: "PROVIDER", isActive: true },
    create: {
      name: "[DEMO] دي جي 4",
      email: "demo-dj@example.com",
      role: "PROVIDER",
      emailVerified: true,
      isActive: true,
    },
  });

  await prisma.provider.upsert({
    where: { userId: user4.id },
    update: {
      name: "[DEMO] دي جي النجوم",
      status: "PENDING",
      district: "IHNASYA",
      phone: "01233445566",
    },
    create: {
      userId: user4.id,
      slug: "demo-stars-dj",
      name: "[DEMO] دي جي النجوم",
      status: "PENDING",
      district: "IHNASYA",
      phone: "01233445566",
    },
  });

  // 7. Demo Provider 5: Suspended Provider
  const user5 = await prisma.user.upsert({
    where: { email: "demo-atelier@example.com" },
    update: { name: "[DEMO] أتيليه 5", role: "PROVIDER", isActive: true },
    create: {
      name: "[DEMO] أتيليه 5",
      email: "demo-atelier@example.com",
      role: "PROVIDER",
      emailVerified: true,
      isActive: true,
    },
  });

  const prov5 = await prisma.provider.upsert({
    where: { userId: user5.id },
    update: {
      name: "[DEMO] مصمم أزياء الأميرات",
      status: "SUSPENDED",
      district: "BABA",
      phone: "01555667788",
    },
    create: {
      userId: user5.id,
      slug: "demo-princess-atelier",
      name: "[DEMO] مصمم أزياء الأميرات",
      status: "SUSPENDED",
      district: "BABA",
      phone: "01555667788",
    },
  });

  if (atelierCat) {
    await prisma.providerCategory.upsert({
      where: { providerId_categoryId: { providerId: prov5.id, categoryId: atelierCat.id } },
      update: { isPrimary: true },
      create: { providerId: prov5.id, categoryId: atelierCat.id, isPrimary: true },
    });
  }

  await prisma.auditLog.create({
    data: {
      adminId: admin.id,
      action: "provider.suspend",
      entityType: "Provider",
      entityId: prov5.id,
      providerId: prov5.id,
      details: { reason: "مخالفة معايير الصور وجودة المحتوى" },
    },
  });

  // 8. Demo User 6: Account created but onboarding not completed ("لم يكمل التسجيل")
  await prisma.user.upsert({
    where: { email: "demo-new-account@example.com" },
    update: {
      name: "[DEMO] كوافير العروسة الجديد",
      role: "PROVIDER",
      isActive: true,
      mustChangePassword: true,
    },
    create: {
      name: "[DEMO] كوافير العروسة الجديد",
      email: "demo-new-account@example.com",
      role: "PROVIDER",
      emailVerified: true,
      isActive: true,
      mustChangePassword: true,
    },
  });

  console.log("✅ Demo seed completed successfully!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

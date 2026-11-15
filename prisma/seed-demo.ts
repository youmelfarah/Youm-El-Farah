import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import {
  addMonthsCairo,
  cairoStartOfDay,
  toCairoDateString,
} from "../src/lib/cairo-time";
import {
  dateStringToPrismaDate,
  formatYmd,
  parseDateString,
} from "../src/lib/calendar-dates";
import { computeRankScore } from "../src/lib/ranking";

async function main() {
  console.log("🌱 Seeding comprehensive demo providers, offers, blocked dates, and stats...");

  // 1. Admin user
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

  // 2. Categories
  const categories = await prisma.category.findMany({
    where: { isActive: true },
  });

  const photoCat = categories.find((c) => c.slug === "photographer") || categories[0];
  const venueCat = categories.find((c) => c.slug === "venues") || categories[0];
  const makeupCat = categories.find((c) => c.slug === "makeup-artist") || categories[0];
  const atelierCat = categories.find((c) => c.slug === "atelier") || categories[0];

  const now = new Date();
  const todayStr = toCairoDateString(now);

  const sixMonthsAgo = cairoStartOfDay(addMonthsCairo(todayStr, -6));
  const oneYearFuture = cairoStartOfDay(addMonthsCairo(todayStr, 12));
  const seventyDaysAgo = new Date(now.getTime() - 70 * 24 * 3600 * 1000);
  const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 3600 * 1000);
  const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 3600 * 1000);

  // Helper date for blocked dates (e.g. tomorrow, +7 days, +30 days)
  const tomorrowStr = formatYmd(
    parseDateString(todayStr)!.year,
    parseDateString(todayStr)!.month,
    parseDateString(todayStr)!.day + 1
  );
  const nextWeekStr = addMonthsCairo(todayStr, 1);

  // ─── Provider 1: Studio Ahram (Photographer, Beni Suef City, Approved, Active Sub) ───
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
      bio: "استوديو تصوير فوتوغرافي وسينمائي لجميع المناسبات السعيدة والأفراح.\nنقدم ألبومات حرارية وتصوير طائرة درون وجلسات تصوير خارجية مميزة.",
      adminNotes: "تم التحقق من أعمال المصور وهويته، نشاط موثوق ومميز.",
      averageRating: 4.8,
      reviewCount: 14,
      rankScore: computeRankScore(4.8, 14),
      createdAt: seventyDaysAgo,
      coverUrl: null,
      logoUrl: null,
    },
    create: {
      userId: user1.id,
      slug: "demo-ahram-studio",
      name: "[DEMO] استوديو الأهرام للتصوير",
      status: "APPROVED",
      district: "BENI_SUEF_CITY",
      phone: "01001112222",
      whatsapp: "01001112222",
      bio: "استوديو تصوير فوتوغرافي وسينمائي لجميع المناسبات السعيدة والأفراح.\nنقدم ألبومات حرارية وتصوير طائرة درون وجلسات تصوير خارجية مميزة.",
      adminNotes: "تم التحقق من أعمال المصور وهويته، نشاط موثوق ومميز.",
      averageRating: 4.8,
      reviewCount: 14,
      rankScore: computeRankScore(4.8, 14),
      createdAt: seventyDaysAgo,
    },
  });

  if (photoCat) {
    await prisma.providerCategory.upsert({
      where: { providerId_categoryId: { providerId: prov1.id, categoryId: photoCat.id } },
      update: { isPrimary: true },
      create: { providerId: prov1.id, categoryId: photoCat.id, isPrimary: true },
    });
  }

  await prisma.subscription.create({
    data: {
      providerId: prov1.id,
      status: "ACTIVE",
      startsAt: sixMonthsAgo,
      endsAt: oneYearFuture,
      amountPaid: 3500,
      paymentMethod: "INSTAPAY",
      planName: "الباقة السنوية الاحترافية",
      createdById: admin.id,
    },
  });

  // Offers for prov1
  await prisma.offer.createMany({
    data: [
      { providerId: prov1.id, title: "باقة الخطوبة الأساسية", description: "جلسة تصوير خارجية ساعتين + ألبوم ديجيتال", price: 3500, sortOrder: 0 },
      { providerId: prov1.id, title: "باقة الزفاف الشاملة", description: "تغطية اليوم كامل من أول اليوم حتى نهاية الفرح + تصوير سينمائي 4K + ألبوم حراري فاخر", price: 8500, sortOrder: 1 },
      { providerId: prov1.id, title: "تصوير خارجي مخصص (سيشن VIP)", description: "جلسة تصوير خاصة مع فريق عمل كامل وتجهيز إضاءة احترافية", price: null, sortOrder: 2 },
    ],
  });

  // Blocked dates for prov1
  await prisma.blockedDate.createMany({
    data: [
      { providerId: prov1.id, date: dateStringToPrismaDate(tomorrowStr), note: "حجز فرح قاعة الماسة" },
      { providerId: prov1.id, date: dateStringToPrismaDate(nextWeekStr), note: "حجز خطوبة خاصة" },
    ],
    skipDuplicates: true,
  });

  // ─── Provider 2: Shahrazad Venue (Venues, El Wasta, Approved, Active Sub) ───
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
      bio: "قاعة أفراح كبرى في الواسطى تتسع حتى 500 فرد مع أحدث أنظمة الصوت والإضاءة والضيافة الفندقية.",
      averageRating: 4.6,
      reviewCount: 9,
      rankScore: computeRankScore(4.6, 9),
      createdAt: seventyDaysAgo,
      coverUrl: null,
      logoUrl: null,
    },
    create: {
      userId: user2.id,
      slug: "demo-shahrazad-venue",
      name: "[DEMO] قاعة شهرزاد للأفراح",
      status: "APPROVED",
      district: "EL_WASTA",
      phone: "01012345678",
      whatsapp: "01012345678",
      bio: "قاعة أفراح كبرى في الواسطى تتسع حتى 500 فرد مع أحدث أنظمة الصوت والإضاءة والضيافة الفندقية.",
      averageRating: 4.6,
      reviewCount: 9,
      rankScore: computeRankScore(4.6, 9),
      createdAt: seventyDaysAgo,
    },
  });

  if (venueCat) {
    await prisma.providerCategory.upsert({
      where: { providerId_categoryId: { providerId: prov2.id, categoryId: venueCat.id } },
      update: { isPrimary: true },
      create: { providerId: prov2.id, categoryId: venueCat.id, isPrimary: true },
    });
  }

  await prisma.subscription.create({
    data: {
      providerId: prov2.id,
      status: "ACTIVE",
      startsAt: sixMonthsAgo,
      endsAt: oneYearFuture,
      amountPaid: 6000,
      paymentMethod: "CASH",
      planName: "الباقة السنوية",
      createdById: admin.id,
    },
  });

  await prisma.offer.createMany({
    data: [
      { providerId: prov2.id, title: "حجز القاعة النهاري", description: "شامل الإضاءة والصوتيات وخدمة الكوشة الأساسية لـ 200 فرد", price: 18000, sortOrder: 0 },
      { providerId: prov2.id, title: "باقة ليلة العمر الفندقية", description: "سعة 450 فرد مع بوفيه عشاء مفتوح وزفة إلكترونية وإضاءة سينمائية", price: 38000, sortOrder: 1 },
    ],
  });

  await prisma.blockedDate.createMany({
    data: [
      { providerId: prov2.id, date: dateStringToPrismaDate(tomorrowStr), note: "محجوزة بالكامل" },
    ],
    skipDuplicates: true,
  });

  // ─── Provider 3: Malika Beauty Center (Makeup, Nasser, Approved, NEW provider < 30 days, 0 reviews) ───
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
      bio: "خبيرة تجميل وميك اب ارتيست متخصصة في مكياج العرائس بأفخم الماركات العالمية الأصلية.",
      averageRating: 0,
      reviewCount: 0,
      rankScore: computeRankScore(0, 0),
      createdAt: tenDaysAgo, // NEW < 30 days -> gets "جديد" badge
      coverUrl: null,
      logoUrl: null,
    },
    create: {
      userId: user3.id,
      slug: "demo-malika-beauty",
      name: "[DEMO] بيوتي سنتر الملكة",
      status: "APPROVED",
      district: "NASSER",
      phone: "01198765432",
      whatsapp: "01198765432",
      bio: "خبيرة تجميل وميك اب ارتيست متخصصة في مكياج العرائس بأفخم الماركات العالمية الأصلية.",
      averageRating: 0,
      reviewCount: 0,
      rankScore: computeRankScore(0, 0),
      createdAt: tenDaysAgo,
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
      startsAt: now,
      endsAt: oneYearFuture,
      amountPaid: 3000,
      paymentMethod: "VODAFONE_CASH",
      planName: "باقة سنوية",
      createdById: admin.id,
    },
  });

  await prisma.offer.createMany({
    data: [
      { providerId: prov3.id, title: "ميك اب خطوبة سواريه", description: "مكياج كامل مع تركيب رموش ليزرية وتصفيف شعر", price: 2500, sortOrder: 0 },
      { providerId: prov3.id, title: "باكدج الزفاف الملكي", description: "جلسة عناية بالبشرة + مساج + ميك اب زفاف كامل بأفضل البراندات العالمية", price: 6500, sortOrder: 1 },
    ],
  });

  // ─── Provider 4: Royal Princess Atelier (Atelier, Ihnasya, Approved, Active Sub) ───
  const user4 = await prisma.user.upsert({
    where: { email: "demo-atelier@example.com" },
    update: { name: "[DEMO] أتيليه 4", role: "PROVIDER", isActive: true },
    create: {
      name: "[DEMO] أتيليه 4",
      email: "demo-atelier@example.com",
      role: "PROVIDER",
      emailVerified: true,
      isActive: true,
    },
  });

  const prov4 = await prisma.provider.upsert({
    where: { userId: user4.id },
    update: {
      name: "[DEMO] أتيليه العروسة الملكية",
      status: "APPROVED",
      district: "IHNASYA",
      phone: "01555667788",
      whatsapp: "01555667788",
      bio: "أرقى تصميمات وفساتين الزفاف والخطوبة المستوردة والجاهزة للإيجار والبيع في إهناسيا.",
      averageRating: 4.5,
      reviewCount: 6,
      rankScore: computeRankScore(4.5, 6),
      createdAt: seventyDaysAgo,
      coverUrl: null,
      logoUrl: null,
    },
    create: {
      userId: user4.id,
      slug: "demo-princess-atelier",
      name: "[DEMO] أتيليه العروسة الملكية",
      status: "APPROVED",
      district: "IHNASYA",
      phone: "01555667788",
      whatsapp: "01555667788",
      bio: "أرقى تصميمات وفساتين الزفاف والخطوبة المستوردة والجاهزة للإيجار والبيع في إهناسيا.",
      averageRating: 4.5,
      reviewCount: 6,
      rankScore: computeRankScore(4.5, 6),
      createdAt: seventyDaysAgo,
    },
  });

  if (atelierCat) {
    await prisma.providerCategory.upsert({
      where: { providerId_categoryId: { providerId: prov4.id, categoryId: atelierCat.id } },
      update: { isPrimary: true },
      create: { providerId: prov4.id, categoryId: atelierCat.id, isPrimary: true },
    });
  }

  await prisma.subscription.create({
    data: {
      providerId: prov4.id,
      status: "ACTIVE",
      startsAt: now,
      endsAt: oneYearFuture,
      amountPaid: 3200,
      paymentMethod: "INSTAPAY",
      planName: "باقة سنوية",
      createdById: admin.id,
    },
  });

  await prisma.offer.createMany({
    data: [
      { providerId: prov4.id, title: "إيجار فستان خطوبة", description: "أحدث موديلات الموسم مع الإكسسوارات والطرحة", price: 3000, sortOrder: 0 },
      { providerId: prov4.id, title: "فستان زفاف ملكي أول لبسة", description: "فستان تركي مرصع بكريستال أصلي مع الجيبونة والتاج والطرحة الملكية", price: 9500, sortOrder: 1 },
    ],
  });

  // ─── Provider 5: Fayrouz Palace (Venues, BABA, Approved, Active Sub) ───
  const user5 = await prisma.user.upsert({
    where: { email: "demo-fayrouz@example.com" },
    update: { name: "[DEMO] قصر الفيروز", role: "PROVIDER", isActive: true },
    create: {
      name: "[DEMO] قصر الفيروز",
      email: "demo-fayrouz@example.com",
      role: "PROVIDER",
      emailVerified: true,
      isActive: true,
    },
  });

  const prov5 = await prisma.provider.upsert({
    where: { userId: user5.id },
    update: {
      name: "[DEMO] قصر الفيروز للمناسبات",
      status: "APPROVED",
      district: "BABA",
      phone: "01288990011",
      whatsapp: "01288990011",
      bio: "قصر وقاعة أفراح مفتوحة ومغلقة في ببا مجهزة بالكامل لأجمل ليالي العمر.",
      averageRating: 4.9,
      reviewCount: 22,
      rankScore: computeRankScore(4.9, 22),
      createdAt: seventyDaysAgo,
      coverUrl: null,
      logoUrl: null,
    },
    create: {
      userId: user5.id,
      slug: "demo-fayrouz-palace",
      name: "[DEMO] قصر الفيروز للمناسبات",
      status: "APPROVED",
      district: "BABA",
      phone: "01288990011",
      whatsapp: "01288990011",
      bio: "قصر وقاعة أفراح مفتوحة ومغلقة في ببا مجهزة بالكامل لأجمل ليالي العمر.",
      averageRating: 4.9,
      reviewCount: 22,
      rankScore: computeRankScore(4.9, 22),
      createdAt: seventyDaysAgo,
    },
  });

  if (venueCat) {
    await prisma.providerCategory.upsert({
      where: { providerId_categoryId: { providerId: prov5.id, categoryId: venueCat.id } },
      update: { isPrimary: true },
      create: { providerId: prov5.id, categoryId: venueCat.id, isPrimary: true },
    });
  }

  await prisma.subscription.create({
    data: {
      providerId: prov5.id,
      status: "ACTIVE",
      startsAt: now,
      endsAt: oneYearFuture,
      amountPaid: 5000,
      paymentMethod: "CASH",
      planName: "باقة سنوية",
      createdById: admin.id,
    },
  });

  await prisma.offer.createMany({
    data: [
      { providerId: prov5.id, title: "حجز القاعة الكبرى (مسائي)", description: "شامل تورتة العروسين 5 أدوار ومشروبات ترحيبية", price: 28000, sortOrder: 0 },
    ],
  });

  // ─── Provider 6: Ibdaa Studio (Photographer, El Fashn, Approved, NEW < 30 days) ───
  const user6 = await prisma.user.upsert({
    where: { email: "demo-ibdaa@example.com" },
    update: { name: "[DEMO] ستوديو إبداع", role: "PROVIDER", isActive: true },
    create: {
      name: "[DEMO] ستوديو إبداع",
      email: "demo-ibdaa@example.com",
      role: "PROVIDER",
      emailVerified: true,
      isActive: true,
    },
  });

  const prov6 = await prisma.provider.upsert({
    where: { userId: user6.id },
    update: {
      name: "[DEMO] ستوديو لمسة إبداع للتصوير",
      status: "APPROVED",
      district: "EL_FASHN",
      phone: "01099887766",
      whatsapp: "01099887766",
      bio: "تصوير احترافي بمدينة الفشن مع أحدث كاميرات سوني السينمائية وإخراج مبهر.",
      averageRating: 0,
      reviewCount: 0,
      rankScore: computeRankScore(0, 0),
      createdAt: fiveDaysAgo, // NEW provider
      coverUrl: null,
      logoUrl: null,
    },
    create: {
      userId: user6.id,
      slug: "demo-ibdaa-studio",
      name: "[DEMO] ستوديو لمسة إبداع للتصوير",
      status: "APPROVED",
      district: "EL_FASHN",
      phone: "01099887766",
      whatsapp: "01099887766",
      bio: "تصوير احترافي بمدينة الفشن مع أحدث كاميرات سوني السينمائية وإخراج مبهر.",
      averageRating: 0,
      reviewCount: 0,
      rankScore: computeRankScore(0, 0),
      createdAt: fiveDaysAgo,
    },
  });

  if (photoCat) {
    await prisma.providerCategory.upsert({
      where: { providerId_categoryId: { providerId: prov6.id, categoryId: photoCat.id } },
      update: { isPrimary: true },
      create: { providerId: prov6.id, categoryId: photoCat.id, isPrimary: true },
    });
  }

  await prisma.subscription.create({
    data: {
      providerId: prov6.id,
      status: "ACTIVE",
      startsAt: now,
      endsAt: oneYearFuture,
      amountPaid: 2500,
      paymentMethod: "OTHER",
      planName: "باقة سنوية",
      createdById: admin.id,
    },
  });

  await prisma.offer.createMany({
    data: [
      { providerId: prov6.id, title: "سيشن أوت دور", description: "جلسة تصوير خارجية ساعتين", price: 2000, sortOrder: 0 },
      { providerId: prov6.id, title: "تغطية الفرح الكاملة", description: "فوتو وفيديو مع مونتاج سينمائي كامل", price: 6000, sortOrder: 1 },
    ],
  });

  // ─── Provider 7: Pending Provider (Samasta) ───
  const user7 = await prisma.user.upsert({
    where: { email: "demo-dj@example.com" },
    update: { name: "[DEMO] دي جي 7", role: "PROVIDER", isActive: true },
    create: {
      name: "[DEMO] دي جي 7",
      email: "demo-dj@example.com",
      role: "PROVIDER",
      emailVerified: true,
      isActive: true,
    },
  });

  await prisma.provider.upsert({
    where: { userId: user7.id },
    update: {
      name: "[DEMO] دي جي النجوم الساطعة",
      status: "PENDING",
      district: "SAMASTA",
      phone: "01233445566",
    },
    create: {
      userId: user7.id,
      slug: "demo-stars-dj",
      name: "[DEMO] دي جي النجوم الساطعة",
      status: "PENDING",
      district: "SAMASTA",
      phone: "01233445566",
    },
  });

  // ─── Seed Realistic Daily Stats for the last 15 days ───
  const providersForStats = [prov1, prov2, prov3, prov4, prov5, prov6];
  for (const p of providersForStats) {
    for (let dayOffset = 0; dayOffset < 15; dayOffset++) {
      const dtMs = now.getTime() - dayOffset * 24 * 3600 * 1000;
      const statDateStr = toCairoDateString(new Date(dtMs));
      const statDate = dateStringToPrismaDate(statDateStr);

      const baseViews = (p.name.length * 7 + dayOffset * 3) % 25 + 5;
      const baseWhatsapp = Math.floor(baseViews / 4);
      const baseCalls = Math.floor(baseViews / 6);

      await prisma.providerDailyStat.upsert({
        where: {
          providerId_date: {
            providerId: p.id,
            date: statDate,
          },
        },
        update: {
          views: baseViews,
          whatsappClicks: baseWhatsapp,
          callClicks: baseCalls,
        },
        create: {
          providerId: p.id,
          date: statDate,
          views: baseViews,
          whatsappClicks: baseWhatsapp,
          callClicks: baseCalls,
        },
      });
    }
  }

  console.log("✅ Demo seed completed successfully with diverse providers, offers, and stats!");
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

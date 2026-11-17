import "dotenv/config";
import { prisma } from "../src/lib/prisma";

const CATEGORIES = [
  { slug: "venues", nameAr: "القاعات" },
  { slug: "wedding-planner", nameAr: "ويدنج بلانر" },
  { slug: "photographer", nameAr: "مصور فوتوغرافي" },
  { slug: "videographer", nameAr: "مصور فيديو" },
  { slug: "media-coverage", nameAr: "ميديا كفريج" },
  { slug: "makeup-artist", nameAr: "ميك اب ارتيست" },
  { slug: "hair-artist", nameAr: "هير ارتيست" },
  { slug: "mazoon", nameAr: "المأذون" },
  { slug: "hotels", nameAr: "الفنادق" },
  { slug: "photo-session-locations", nameAr: "أماكن السيشنز" },
  { slug: "atelier", nameAr: "الأتيليه" },
  { slug: "decorations", nameAr: "الديكورات" },
  { slug: "dress-accessories", nameAr: "اكسسوارات الفستان" },
  { slug: "flowers", nameAr: "بيكيهات" },
  { slug: "wedding-car", nameAr: "عربية العرس" },
];

async function main() {
  const rawAdminEmail = process.env.ADMIN_EMAIL;
  const adminName = process.env.ADMIN_NAME?.trim();

  if (!rawAdminEmail?.trim() || !adminName) {
    throw new Error(
      "ADMIN_EMAIL and ADMIN_NAME must be set in environment variables"
    );
  }

  const adminEmail = rawAdminEmail.trim().toLowerCase();

  // Upsert initial verified ADMIN user matching Better Auth + Prisma schema
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: adminName,
      role: "ADMIN",
      emailVerified: true,
      isActive: true,
      banned: false,
      banReason: null,
      banExpires: null,
      mustChangePassword: false,
    },
    create: {
      email: adminEmail,
      name: adminName,
      role: "ADMIN",
      emailVerified: true,
      isActive: true,
      banned: false,
      banReason: null,
      banExpires: null,
      mustChangePassword: false,
    },
  });

  console.log(`✅ Admin user upserted: ${adminName} <${adminEmail}>`);

  // Upsert categories
  for (let i = 0; i < CATEGORIES.length; i++) {
    const cat = CATEGORIES[i];
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {
        nameAr: cat.nameAr,
        sortOrder: i,
        isActive: true,
      },
      create: {
        slug: cat.slug,
        nameAr: cat.nameAr,
        sortOrder: i,
        isActive: true,
      },
    });
  }

  // Remove deprecated categories if they have no providers
  const activeSlugs = CATEGORIES.map((c) => c.slug);
  const toDelete = await prisma.category.findMany({
    where: {
      slug: { notIn: activeSlugs },
      providers: { none: {} },
    },
  });
  if (toDelete.length > 0) {
    await prisma.category.deleteMany({
      where: { id: { in: toDelete.map((c) => c.id) } },
    });
    console.log(
      `🗑️ Removed ${toDelete.length} deprecated categories: ${toDelete
        .map((c) => c.slug)
        .join(", ")}`
    );
  }

  console.log(`✅ ${CATEGORIES.length} categories upserted`);
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

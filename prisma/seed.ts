import "dotenv/config";
import { prisma } from "../src/lib/prisma";

const CATEGORIES = [
  { slug: "venues", nameAr: "القاعات" },
  { slug: "wedding-planner", nameAr: "ويدنج بلانر" },
  { slug: "photographer", nameAr: "مصور فوتوغرافي" },
  { slug: "videographer", nameAr: "مصور فيديو" },
  { slug: "media-coverage", nameAr: "ميديا كفريج" },
  { slug: "makeup-artist", nameAr: "ميك اب ارتيست" },
  { slug: "skin-care", nameAr: "سكين كير" },
  { slug: "body-care", nameAr: "بودي كير" },
  { slug: "hair-artist", nameAr: "هير ارتيست" },
  { slug: "lashes-brows", nameAr: "رموش وحواجب" },
  { slug: "hotels", nameAr: "الفنادق" },
  { slug: "photo-session-locations", nameAr: "أماكن السيشنز" },
  { slug: "atelier", nameAr: "الأتيليه" },
  { slug: "decorations", nameAr: "الديكورات" },
  { slug: "dress-accessories", nameAr: "اكسسوارات الفستان" },
  { slug: "flowers", nameAr: "بيكيهات" },
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
      },
      create: {
        slug: cat.slug,
        nameAr: cat.nameAr,
        sortOrder: i,
      },
    });
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

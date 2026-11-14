import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("🧹 Cleaning demo data from database...");

  // 1. Find demo providers
  const demoProviders = await prisma.provider.findMany({
    where: {
      OR: [
        { name: { startsWith: "[DEMO]" } },
        { slug: { startsWith: "demo-" } },
      ],
    },
    select: { id: true, userId: true },
  });

  const demoProviderIds = demoProviders.map((p) => p.id);

  // 2. Find demo users
  const demoUsers = await prisma.user.findMany({
    where: {
      OR: [
        { name: { startsWith: "[DEMO]" } },
        { email: { startsWith: "demo-" } },
        { id: { in: demoProviders.map((p) => p.userId) } },
      ],
    },
    select: { id: true },
  });

  const demoUserIds = demoUsers.map((u) => u.id);

  console.log(
    `Found ${demoProviderIds.length} demo providers and ${demoUserIds.length} demo users to clean up.`
  );

  // 3. Delete in safe relational order
  if (demoProviderIds.length > 0) {
    const deletedDates = await prisma.blockedDate.deleteMany({
      where: { providerId: { in: demoProviderIds } },
    });
    const deletedMedia = await prisma.media.deleteMany({
      where: { providerId: { in: demoProviderIds } },
    });
    const deletedOffers = await prisma.offer.deleteMany({
      where: { providerId: { in: demoProviderIds } },
    });
    const deletedReviews = await prisma.review.deleteMany({
      where: { providerId: { in: demoProviderIds } },
    });
    const deletedFavorites = await prisma.favorite.deleteMany({
      where: { providerId: { in: demoProviderIds } },
    });
    const deletedPC = await prisma.providerCategory.deleteMany({
      where: { providerId: { in: demoProviderIds } },
    });
    const deletedSubs = await prisma.subscription.deleteMany({
      where: { providerId: { in: demoProviderIds } },
    });

    console.log(
      `Deleted relations: ${deletedSubs.count} subscriptions, ${deletedPC.count} categories, ${deletedOffers.count} offers, ${deletedMedia.count} media.`
    );
  }

  // 4. Delete Audit Logs relating to demo providers or created by demo users
  const deletedLogs = await prisma.auditLog.deleteMany({
    where: {
      OR: [
        { providerId: { in: demoProviderIds } },
        { adminId: { in: demoUserIds } },
      ],
    },
  });
  console.log(`Deleted ${deletedLogs.count} demo audit log entries.`);

  // 5. Delete demo providers
  if (demoProviderIds.length > 0) {
    const deletedProviders = await prisma.provider.deleteMany({
      where: { id: { in: demoProviderIds } },
    });
    console.log(`Deleted ${deletedProviders.count} demo providers.`);
  }

  // 6. Delete demo sessions, accounts, and users
  if (demoUserIds.length > 0) {
    await prisma.session.deleteMany({
      where: { userId: { in: demoUserIds } },
    });
    await prisma.account.deleteMany({
      where: { userId: { in: demoUserIds } },
    });
    const deletedUsers = await prisma.user.deleteMany({
      where: { id: { in: demoUserIds } },
    });
    console.log(`Deleted ${deletedUsers.count} demo users.`);
  }

  console.log("✨ Demo cleanup completed successfully!");
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

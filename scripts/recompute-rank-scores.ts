import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { recomputeAllProviderRankScores } from "../src/lib/ranking";

async function main() {
  console.log("Recalculating rank scores for all providers...");
  const { updatedCount } = await recomputeAllProviderRankScores(prisma);
  console.log(`Successfully updated rank scores for ${updatedCount} providers.`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (err) => {
    console.error("Error updating rank scores:", err);
    await prisma.$disconnect();
    process.exit(1);
  });

import "dotenv/config";
import pg from "pg";

const { Client } = pg;

function maskSecrets(text) {
  if (!text) return "";
  let masked = String(text);
  for (const key of ["DIRECT_URL", "DATABASE_URL"]) {
    const val = process.env[key];
    if (val) {
      masked = masked.split(val).join(`[${key}_MASKED]`);
    }
  }
  masked = masked.replace(/(postgres(?:ql)?:\/\/)([^:@\s]+)(?::([^@\s]*))?@/gi, "$1***:***@");
  return masked;
}

async function main() {
  const directUrl = process.env.DIRECT_URL;
  if (!directUrl) {
    console.error("Error [MISSING_ENV]: DIRECT_URL is not set");
    process.exit(1);
  }

  const client = new Client({
    connectionString: directUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();

    // Check if category already exists
    const checkRes = await client.query(
      `SELECT id, slug, "nameAr", "sortOrder", "isActive" FROM "Category" WHERE slug = $1`,
      ["wedding-car"]
    );

    if (checkRes.rows.length > 0) {
      await client.query(
        `UPDATE "Category" SET "nameAr" = $1, "isActive" = true WHERE slug = $2`,
        ["عربية العرس", "wedding-car"]
      );
      console.log("Category 'wedding-car' already existed. Updated nameAr to 'عربية العرس' and isActive to true.");
    } else {
      const maxOrderRes = await client.query(
        `SELECT COALESCE(MAX("sortOrder"), 0) AS max_order FROM "Category"`
      );
      const nextOrder = Number(maxOrderRes.rows[0]?.max_order ?? 0) + 1;
      const cuidLikeId = `cat_wedding_car_${Date.now()}`;

      await client.query(
        `INSERT INTO "Category" (id, slug, "nameAr", "sortOrder", "isActive") VALUES ($1, $2, $3, $4, true)`,
        [cuidLikeId, "wedding-car", "عربية العرس", nextOrder]
      );
      console.log(`Category 'wedding-car' created successfully with sortOrder ${nextOrder}.`);
    }

    const allCategories = await client.query(
      `SELECT slug, "nameAr", "sortOrder", "isActive" FROM "Category" ORDER BY "sortOrder" ASC`
    );
    console.log(`Current categories in database (${allCategories.rows.length}):`);
    for (const c of allCategories.rows) {
      console.log(`  - ${c.slug}: ${c.nameAr} (sortOrder: ${c.sortOrder}, active: ${c.isActive})`);
    }
  } catch (err) {
    console.error(`Error: ${maskSecrets(err?.message || String(err))}`);
    process.exitCode = 1;
  } finally {
    await client.end().catch(() => {});
  }
}

main();

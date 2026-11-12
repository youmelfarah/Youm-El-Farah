import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
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
  // Also mask any postgres URI credentials
  masked = masked.replace(/(postgres(?:ql)?:\/\/)([^:@\s]+)(?::([^@\s]*))?@/gi, "$1***:***@");
  return masked;
}

function parseArgs(argv) {
  let force = false;
  let sqlPath = null;

  for (const arg of argv) {
    if (arg === "--force") {
      force = true;
    } else if (!arg.startsWith("-") && !sqlPath) {
      sqlPath = arg;
    } else {
      throw new Error(`Unknown or unexpected argument: ${arg}`);
    }
  }

  if (!sqlPath) {
    throw new Error("Usage: node scripts/apply-sql.mjs <path-to-sql-file> [--force]");
  }

  return { force, sqlPath };
}

async function main() {
  let args;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (err) {
    console.error(`Error [INVALID_ARGS]: ${maskSecrets(err.message)}`);
    process.exit(1);
  }

  const directUrl = process.env.DIRECT_URL;
  if (!directUrl) {
    console.error("Error [MISSING_ENV]: DIRECT_URL is not set");
    process.exit(1);
  }

  const resolvedPath = path.resolve(process.cwd(), args.sqlPath);
  if (!fs.existsSync(resolvedPath)) {
    console.error(`Error [ENOENT]: SQL file not found: ${args.sqlPath}`);
    process.exit(1);
  }

  const sql = fs.readFileSync(resolvedPath, "utf8").replace(/^\uFEFF/, "");

  const client = new Client({
    connectionString: directUrl,
    ssl: { rejectUnauthorized: false },
  });

  let inTransaction = false;
  try {
    await client.connect();

    const existsRes = await client.query(
      `SELECT EXISTS (
         SELECT 1
         FROM information_schema.tables
         WHERE table_schema = 'public' AND table_name = 'User'
       ) AS "exists"`
    );

    if (existsRes.rows[0]?.exists && !args.force) {
      console.error('Error [TABLE_EXISTS]: Table "User" already exists. Pass --force to run anyway.');
      process.exitCode = 1;
      return;
    }

    await client.query("BEGIN");
    inTransaction = true;
    await client.query(sql);
    await client.query("COMMIT");
    inTransaction = false;

    console.log(`Success: applied ${args.sqlPath}`);
  } catch (err) {
    if (inTransaction) {
      await client.query("ROLLBACK").catch(() => {});
    }
    const code = err?.code || "ERROR";
    const msg = maskSecrets(err?.message || String(err));
    console.error(`Error [${code}]: ${msg}`);
    process.exitCode = 1;
  } finally {
    await client.end().catch(() => {});
  }
}

main();


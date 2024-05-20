import { Database } from "https://deno.land/x/sqlite3@0.11.1/mod.ts";
import { join } from "std/path/mod.ts";

const __dirname = new URL(".", import.meta.url).pathname;
const db = new Database(join(__dirname, "..", "data", "application.db"), {
  create: true,
});

const runMigrations = db.transaction((migrations: string[]) => {
  for (const migration of migrations) db.exec(migration);
});

// Highest Prefix will be last in the migrations array
// Prefix 5 digits: 00023
const ascendingPrefix = (a: string, b: string) =>
  Number(a.match(/^(\d{5})/)?.[0] || 0) - Number(b.match(/^(\d{5})/)?.[0] || 0);
const latestMigration = db.transaction((migrations: string[]) => {
  const latest = migrations[migrations.length - 1];
  db.exec(latest);
});

const migrationsPath = join(__dirname, "..", "model", "migrations");

async function readDir(path: string) {
  const entries = [];
  for await (const entry of Deno.readDir(path)) {
    entries.push(entry);
  }
  return entries;
}

const allMigrations = (await readDir(migrationsPath))
  .sort((a, b) => ascendingPrefix(a.name, b.name));

const up = await Promise.all(
  allMigrations
    .filter((file) => file.name.endsWith(".up.sql"))
    .map((file) => Deno.readTextFile(join(migrationsPath, file.name))),
);

const down = await Promise.all(
  allMigrations
    .filter((file) => file.name.endsWith(".down.sql"))
    .map((file) => Deno.readTextFile(join(migrationsPath, file.name))),
);

if (Deno.env.get("DB_MIGRATIONS")) { // DB_MIGRATIONS can be "UP" or "DOWN"
  switch (Deno.env.get("DB_MIGRATIONS")) {
    case "UP":
      runMigrations(up);
      db.close();
      break;
    case "DOWN":
      console.log("[DB MIGRATIONS] Down - Rolling back latest migration");
      latestMigration(down);
      db.close();
      break;
    default:
      throw new Error(
        `Unknown DB_MIGRATIONS: ${Deno.env.get("DB_MIGRATIONS")}\nCan be either "UP" or "DOWN"`,
      );
  }
}

export { db };

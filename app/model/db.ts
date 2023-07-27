import { Database } from "https://deno.land/x/sqlite3@0.9.1/mod.ts";
import { join } from "std/path/mod.ts";

const __dirname = new URL('.', import.meta.url).pathname;
const db = new Database(join(__dirname, "..", "data", "application.db"));

// const runMigrations = db.transaction((migrations: string[]) => {
//   for (const migration of migrations) db.exec(migration);
// });

// Highest Prefix will be last in the migrations array
// Prefix 5 digits: 00023
// const ascendingPrefix = (a: string, b: string) => Number(a.match(/^(\d{5})/)?.[0] || 0) - Number(b.match(/^(\d{5})/)?.[0] || 0);
// const latestMigration = db.transaction((migrations: string[]) => {
//   const latest = migrations[migrations.length - 1];
//   db.exec(latest);
// });

// const migrationsPath = join(__dirname, "migrations");
// const allMigrations = readdirSync(migrationsPath).sort(ascendingPrefix);
// const up = allMigrations.filter((file) => file.endsWith(".up.sql")).map((
//   file,
// ) => readFileSync(join(migrationsPath, file)).toString());
// const down = allMigrations.filter((file) => file.endsWith(".down.sql")).map((
//   file,
// ) => readFileSync(join(migrationsPath, file)).toString());

// if (Object.keys(process.env).includes('DB_MIGRATIONS')) { // DB_MIGRATIONS can be "UP" or "DOWN"
//   switch (process.env.DB_MIGRATIONS) {
//     case "UP":
//       runMigrations(up);
//       db.close();
//       break;
//     case "DOWN":
//       console.log("[DB MIGRATIONS] Down - Rolling back latest migration");
//       latestMigration(down);
//       db.close();
//       break;
//     default:
//       throw Error(`Unknown DB_MIGRATIONS: ${process.env.DB_MIGRATIONS}\nCan be either "UP" or "DOWN"`);
//   }
// }

export { db };

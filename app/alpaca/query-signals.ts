import { db } from "../model/db.ts";

const selectSignals = db.prepare(
  "SELECT COUNT(*) FROM signals_alpaca WHERE symbol = ?",
);
const args = Deno.args.slice(2);

// npm run cli:query-signals -- --symbols AAPL AMZN V ZS
const endSymbolsIndex = args.findIndex((arg) => arg !== "--symbols" && arg.startsWith("--")) > -1
  ? args.findIndex((arg) => arg !== "--symbols" && arg.startsWith("--"))
  : undefined;
const symbols: string[] = args.indexOf("--symbols") > -1
  ? args.slice(args.indexOf("--symbols") + 1, endSymbolsIndex)
  : [];
console.log(symbols);

for (const symbol of symbols) {
  const rows = selectSignals.all(symbol.toUpperCase());
  console.log("#Signals", rows);
}

db.close();

import { type DailyCandle } from "../alpaca/transformation.ts";
import { seriesPath } from "../alpaca/utils.ts";
import { db } from "../db.ts";

const insertStatement = db.prepare(
  `INSERT INTO daily_change (date, symbol, open, close, previousClose) VALUES (:date, :symbol, :open, :close, :previousClose)`,
);

export async function writeDailyChange(numberOfLatestDays?: number) {
  for await (const dirEntry of Deno.readDir(seriesPath())) {
    if (!dirEntry.isFile) continue;
    try {
      console.log("Reading DailyCandle Data from", dirEntry.name);
      const fileContent = await Deno.readTextFile(seriesPath(dirEntry.name));
      const json: DailyCandle[] = numberOfLatestDays
        ? (JSON.parse(fileContent) as DailyCandle[]).slice(-numberOfLatestDays)
        : JSON.parse(fileContent);

      for (let i = 1; i < json.length; i++) {
        const previousCandle = json[i - 1];
        const dailyCandle = json[i];

        const _numberOfChanges = insertStatement.run({
          date: dailyCandle.date,
          symbol: dailyCandle.symbol,
          open: dailyCandle.o,
          close: dailyCandle.c,
          previousClose: previousCandle.c,
        });
      }
    } catch (e) {
      console.error("Reading DailyCandle Data: ", e);
    }
  }
}

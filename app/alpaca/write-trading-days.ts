import { join } from "std/path/mod.ts";
import { type DailyCandle } from "./transformation.ts";

const __dirname = new URL(".", import.meta.url).pathname;

type TradingDays = string[];

export async function writeTradingDays() {
  try {
    const fileContent = await Deno.readTextFile(
      join(__dirname, "..", "data", "series", "alpaca", "AAPL.json"),
    );
    const candles: DailyCandle[] = JSON.parse(fileContent);

    const tradingDays: TradingDays = candles.map((candle) => candle.date)
      .reverse(); // sort from latest date descending e.g. ["2023-08-11","2023-08-10","2023-08-09", ...]

    await Deno.writeTextFile(
      join(__dirname, "..", "data", "trading-days.json"),
      JSON.stringify(tradingDays),
    );
    console.log("Written data/trading-days.json");
  } catch (e) {
    throw new Error(
      "Error reading/decoding/parsing series AAPL.json" + e.toString(),
    );
  }
}

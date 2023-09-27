import { type DailyCandle } from "./transformation.ts";
import { seriesPath } from "./utils.ts";

type TradingDays = string[];

export async function writeTradingDays() {
  try {
    const fileContent = await Deno.readTextFile(seriesPath("AAPL.json"));
    const candles: DailyCandle[] = JSON.parse(fileContent);

    const tradingDays: TradingDays = candles.map((candle) => candle.date)
      .reverse(); // sort from latest date descending e.g. ["2023-08-11","2023-08-10","2023-08-09", ...]

    await Deno.writeTextFile(
      seriesPath("..", "..", "trading-days.json"),
      JSON.stringify(tradingDays),
    );
    console.log("Written data/trading-days.json");
  } catch (e) {
    throw new Error(
      "Error reading/decoding/parsing series AAPL.json" + e.toString(),
    );
  }
}

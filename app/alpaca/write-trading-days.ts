import { join } from "std/path/mod.ts";
import { type DailyCandle } from "./transformation.ts";

const textDecoder = new TextDecoder("utf-8");
const textEncoder = new TextEncoder();
const __dirname = new URL(".", import.meta.url).pathname;

type TradingDays = string[]; 

export async function writeTradingDays() {
  try {
    const data = await Deno.readFile(
      join(__dirname, "..", "data", "series", "alpaca", "AAPL.json"),
    );
    const fileContent = textDecoder.decode(data);
    const candles: DailyCandle[] = JSON.parse(fileContent);

    const tradingDays: TradingDays = candles.map((candle) => candle.date)
      .reverse(); // sort from latest date descending e.g. ["2023-08-11","2023-08-10","2023-08-09", ...]

    await Deno.writeFile(
      join(__dirname, "..", "data", "trading-days.json"),
      textEncoder.encode(JSON.stringify(tradingDays)),
    );
    console.log("Written data/trading-days.json");
  } catch (e) {
    throw new Error(
      "Error reading/decoding/parsing series AAPL.json" + e.toString(),
    );
  }
}

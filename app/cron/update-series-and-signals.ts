import "std/dotenv/load.ts"; // load env vars from .env
import { fetchDailySeries } from "../alpaca/fetch-daily-series.ts";
import { writeTradingDays } from "../alpaca/write-trading-days.ts";
import { addElderColor } from "../alpaca/add-elder-color.ts";
import { writeSignals } from "../alpaca/write-signals.ts";

await fetchDailySeries();

await writeTradingDays();

await addElderColor();

await writeSignals();

console.log(new Date(), "Sucessfully updated series and signals");

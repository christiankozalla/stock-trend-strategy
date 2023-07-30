import "std/dotenv/load.ts"; // load env vars from .env
import { fetchDailySeries } from "../alpaca/fetch-daily-series.ts";
import { addElderColor } from "../alpaca/add-elder-color.ts";
import { writeSignals } from "../alpaca/write-signals.ts";

await fetchDailySeries();

await addElderColor();

await writeSignals();

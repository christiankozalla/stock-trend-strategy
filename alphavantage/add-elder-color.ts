import { alphavantage } from "@/alphavantage/client";
import { type DailyCandle } from "@/alphavantage/transformation";
import { seriesPath } from "./utils";
import { readdir, readFile, writeFile } from "node:fs/promises";

const addElderColor = async (
  candles: Omit<DailyCandle, "elder">[],
): Promise<DailyCandle[]> => {
  const symbol = candles[0].symbol;
  const macd = await alphavantage.indicators.get(symbol, { indicator: "MACD" });
  const ema = await alphavantage.indicators.get(symbol, {
    indicator: "EMA",
    period: 13,
  });

  if (macd === undefined) {
    throw Error(
      "Error addElderColor: MACD not found - AlphaVantage API Limit Reached",
    );
  }
  if (ema === undefined) {
    throw Error(
      "Error addElderColor: EMA not found - AlphaVantage API Limit Reached",
    );
  }
  const macdValues = macd["Technical Analysis: MACD"];
  const emaValues = ema["Technical Analysis: EMA"];

  // candles is sorted by date
  // example: candles[0].date "today"; candles[1].date is "yesterday"
  for (let i = candles.length - 2; i >= 0; i--) {
    const day = candles[i].date;
    const beforeDay = candles[i + 1].date;

    try {
      const elderBullish = Number(macdValues[day].MACD_Hist) >
          Number(macdValues[beforeDay].MACD_Hist) &&
        Number(emaValues[day].EMA) > Number(emaValues[beforeDay].EMA);
      const elderBearish = Number(macdValues[day].MACD_Hist) <
          Number(macdValues[beforeDay].MACD_Hist) &&
        Number(emaValues[day].EMA) < Number(emaValues[beforeDay].EMA);

      // mutate candles array
      (candles as DailyCandle[])[i].elder = elderBullish
        ? "green"
        : elderBearish
        ? "red"
        : "blue";
    } catch (e) {
      console.error("Error addElderColor: ", e);
    }
  }
  return candles as DailyCandle[];
};

(async () => {
  let waitInterval = 25000;
  const files = await readdir(seriesPath());
  for (let j = 0; j < files.length; j++) {
    const file = files[j];
    try {
      console.log("Adding Elder Color to", file);
      const withElder = await addElderColor(
        JSON.parse(
          await readFile(seriesPath(file), { encoding: "utf-8" }),
        ),
      );

      await writeFile(
        seriesPath(file),
        JSON.stringify(withElder),
      );
      await new Promise((resolve) => setTimeout(resolve, waitInterval)); // wait to respect limit of 5 API calls per minute
    } catch (e) {
      console.error("Error Adding Elder Color", e);
      waitInterval += 5000;
      j--; // retry last symbol
      continue;
    }
  }
})();

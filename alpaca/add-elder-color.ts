import { type DailyCandle } from "@/alpaca/transformation";
import { seriesPath } from "./utils";
import { readdir, readFile, writeFile } from "node:fs/promises";

function sum(...summands: number[]) {
  return summands.reduce((sum, summand) => sum + Math.abs(summand), 0);
}

function isObject(something: unknown): something is object {
  return typeof something === "object" && !Array.isArray(something) &&
    something !== null;
}

/**
 * addEma takes in an array of closing prices { c: number } and mutates the input array!
 * @param input: The array of candles to which the EMA will be added
 * @param periods: The number of periods to use for the EMA
 */
const addEma = (
  input: { c: number; ema?: Record<number, number> }[],
  periods: number,
): { c: number; ema: Record<number, number> }[] => {
  let initialSma = sum(...input.slice(0, periods).map((candle) => candle.c)) /
    periods;
  const k = 2 / (periods + 1);

  for (let i = periods; i < input.length; i++) {
    let ema: number | undefined;
    const price = input[i].c;
    const previousEma = input[i - 1].ema?.[periods] ?? initialSma;
    if (typeof price === "number") {
      if (typeof previousEma !== "undefined") {
        ema = price * k + previousEma * (1 - k);
      } else {
        ema = price * k + initialSma * (1 - k);
      }
      if (isObject(input[i].ema)) {
        input[i].ema![periods] = ema;
      } else {
        input[i].ema = {
          [periods]: ema,
        };
      }
    }
  }
  return input as { c: number; ema: Record<number, number> }[];
};

/**
 * addMacd takes in an array of closing prices { c: number }
 * and mutates the incoming array
 * and adds MACD
 * { c: number; macd: { value: number; signal: number; hist: number;}}
 * @param input: The input array to which the MACD will be added 
 */
const addMacd = (
  candles: DailyCandle[],
) => {
  // const macd = ema12 - ema26;
  // const macdSignal = ema(macd, PERIODS = 9)
  // const macdHist = macd - macdSignal

  addEma(candles, 26);
  addEma(candles, 12);

  const k_signal = 2 / 10;

  for (let i = Math.max(12, 26) + 1; i < candles.length; i++) {
    const macd = candles[i].ema![12] - candles[i].ema![26];
    // signal is an EMA(macd, 9)
    const signal = i - Math.max(12, 26) + 1 === 9
      ? sum(
        ...candles.slice(Math.max(12, 26), i).map((c) => c.macd?.value || 0),
      ) / 9
      : candles[i - 1].macd?.signal !== undefined
      ? (k_signal * macd + (1 - k_signal) * candles[i - 1].macd?.signal!)
      : undefined;

    candles[i].macd = {
      value: macd,
      signal,
      hist: signal ? macd - signal : undefined,
    };
  }

  return candles;
};

const addElderColor = async (
  candles: DailyCandle[],
): Promise<DailyCandle[]> => {
  const symbol = candles[0].symbol;

  addEma(candles, 13);
  addMacd(candles);

  for (let i = Math.max(12, 26) + 1; i < candles.length; i++) {
    try {
      const elderBullish = candles[i].macd?.hist! >
          candles[i - 1].macd?.hist! &&
        // @ts-ignore
        candles[i].ema[13] > candles[i - 1].ema[13];

      const elderBearish = candles[i].macd?.hist! <
          candles[i - 1].macd?.hist! &&
        // @ts-ignore
        candles[i].ema[13] < candles[i - 1].ema[13];

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
  const files = await readdir(seriesPath());
  for (let j = 0; j < files.length; j++) {
    const file = files[j];
    try {
      console.log("Adding Elder Color to", file);
      const withElder = await addElderColor(
        JSON.parse(
          await readFile(seriesPath(file), {
            encoding: "utf-8",
          }),
        ),
      );

      await writeFile(
        seriesPath(file),
        JSON.stringify(withElder),
      );
    } catch (e) {
      console.error("Error Adding Elder Color", e);
    }
  }
})();

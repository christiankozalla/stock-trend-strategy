import { type AlpacaBarsResponse } from "./client.ts";

export type DailyCandle = {
  symbol: string;
  date: string; // YYYY-MM-DD
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
  elder: "green" | "blue" | "red";
  ema?: Record<number, number>;
  macd?: {
    value: number;
    signal?: number;
    hist?: number;
  }
};

export function transform(
  serie: AlpacaBarsResponse,
): Omit<DailyCandle, "elder" | 'ema'>[] {
  const result = [];

  for (const bar of serie.bars) {
    const date = bar.t.match(/^\d{4}-\d{2}-\d{2}/);
    result.push({
      symbol: serie.symbol,
      date: date !== null ? date[0] : "",
      o: bar.o,
      h: bar.h,
      l: bar.l,
      c: bar.c,
      v: bar.v,
    });
  }

  return result;
}

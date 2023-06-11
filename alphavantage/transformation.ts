import { type AVSeriesResponse } from "./client";

export type DailyCandle = {
  symbol: string;
  date: string; // YYYY-MM-DD
  o: string;
  h: string;
  l: string;
  c: string;
  v: string;
  elder: "green" | "blue" | "red";
};
export function transform(
  serie: AVSeriesResponse["TIME_SERIES_DAILY_ADJUSTED"],
): Omit<DailyCandle, "elder">[] {
  const result = [];
  for (const date in serie["Time Series (Daily)"]) {
    result.push({
      symbol: serie["Meta Data"]["2. Symbol"],
      date: date,
      o: serie["Time Series (Daily)"][date]["1. open"],
      h: serie["Time Series (Daily)"][date]["2. high"],
      l: serie["Time Series (Daily)"][date]["3. low"],
      c: serie["Time Series (Daily)"][date]["5. adjusted close"], // or ["4. close"] ?
      v: serie["Time Series (Daily)"][date]["6. volume"],
    });
  }

  return result;
}

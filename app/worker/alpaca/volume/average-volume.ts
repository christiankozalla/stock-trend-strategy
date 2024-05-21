// 1. Volume definitions
// 1.1 volume = number of stock traded in a day
// 1.2 cash volume = volume * avg. daily price
// 2.1 calculate average volume AV30, AV20, AV15, AV05
// 2.2 calculate average cash volume - ACV30, ACV20, ACV15, ACV05 in Dollar
// 3. write everything to sqlite3

// 4. Run analytics on volume data
// 4.1 configurable alerts / rules -> daily email report

// table volume

// rule base alerts
// Example 1: is the current volume 50% higher than AV20 ?

// Example 2: Was yesterdays volume also 50% higher than AV20 ?

// Display of data
// line chart of AV20 vs time for AAPL
// table of all recent alerts
// alerts highlighted in OHLC chart
import { db } from "../../db.ts";
import { seriesPath } from "../utils.ts";
import { type DailyCandle } from "../transformation.ts";
import stockSymbols from "../symbols.json" with { type: "json" };

const TIMESPANS = [5, 10, 15, 20, 30] as const;

type VolumeRecord = {
  date: string;
  symbol: string;
  volume: number;
  AV30: number;
  AV20: number;
  AV15: number;
  AV10: number;
  AV5: number;
  ACV30: number;
  ACV20: number;
  ACV15: number;
  ACV10: number;
  ACV5: number;
};

const insertVolumeRecordStatement = db.prepare(
  "INSERT INTO volume (date, symbol, volume, AV30, AV20, AV15, AV10, AV5, ACV30, ACV20, ACV15, ACV10, ACV5) VALUES (:date, :symbol, :volume, :AV30, :AV20, :AV15, :AV10, :AV5, :ACV30, :ACV20, :ACV15, :ACV10, :ACV5)"
);

export async function writeAvgVolumeOfSeriesToDb(currentDate?: Date) {
  for (const symbol of stockSymbols) {
    try {
      console.log(`\nStart writing volume record for ${symbol}`);
      const series = await readSeries(symbol);
      const record = calculateVolumeRecord(series, currentDate);
      insertVolumeRecordStatement.run(record);
      console.log(
        `\nFinished writing volume record for ${symbol}`
      );
    } catch (err) {
      if (err instanceof SeriesNotFoundError || err instanceof VolumeMissingError) {
        console.log(err.message);
      } else {
        console.log("Unexpected error: ", err?.message);
      }
      continue;
    }
  }
}

async function readSeries(symbol: string): Promise<Partial<DailyCandle>[]> {
  return JSON.parse(await Deno.readTextFile(seriesPath(`${symbol}.json`)));
}

class SeriesNotFoundError extends Error {
  constructor(message: string) {
    super(message);
  }
}

class VolumeMissingError extends Error {
  constructor(message: string) {
    super(message);
  }
}

function calculateVolumeRecord(
  series: Partial<DailyCandle>[],
  currentDate: Date = new Date()
): Partial<VolumeRecord> {
  // the series records are sorted by date - lower indices are older
  const currentDateString = currentDate.toISOString().slice(0, 10);
  const currentSeriesIndex = series.findIndex(
    (s) => s.date === currentDateString
  );
  if (currentSeriesIndex < 0) {
    throw new SeriesNotFoundError(
      `Series for currentDate ${currentDateString} not found`
    );
  }
  const seriesRecordForCurrentDate = series[currentSeriesIndex];

  const record: Partial<VolumeRecord> = {
    symbol: seriesRecordForCurrentDate.symbol,
    date: currentDateString,
    volume: seriesRecordForCurrentDate.v || 0
  };

  for (const timespan of TIMESPANS) {
    if (currentSeriesIndex - timespan < 0) {
      throw new Error(
        `Insufficient data for calculating average volume ${JSON.stringify(
          seriesRecordForCurrentDate
        )} AV${timespan}`
      );
    }
    const relevantSeries = series.slice(
      currentSeriesIndex - timespan,
      currentSeriesIndex
    );
    record[`AV${timespan}`] = calculateAverageVolume(
      ...relevantSeries.map((s) => {
        if (!s.v || typeof s.v !== "number") {
          throw new VolumeMissingError("No volume data!");
        } else return s.v;
      })
    );
    record[`ACV${timespan}`] = calculateAverageCashVolume(
      ...relevantSeries.map((s) => {
        if (!s.v || !s.h || !s.o || !s.c || !s.l) {
          throw new Error("No volume data!");
        } else return { v: s.v, o: s.o, h: s.h, l: s.l, c: s.c };
      })
    );
  }

  return record;
}

function calculateAverageVolume(...volumes: number[]): number {
  const total = volumes.reduce((acc, volume) => acc + volume, 0);
  return volumes.length ? total / volumes.length : 0;
}

function calculateAverageCashVolume(
  ...record: { v: number; o: number; h: number; l: number; c: number }[]
): number {
  const dailyCashVolume = record.map(
    (r) => r.v * ((r.o + r.h + r.c + r.l) / 4)
  );
  return calculateAverageVolume(...dailyCashVolume);
}

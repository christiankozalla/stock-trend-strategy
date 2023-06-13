import { db } from "../model/db";
import type { Signal } from "../model/types";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { seriesPath } from "./utils";
import { DailyCandle } from "./transformation";
// 1. Query the DB for all signals of a given symbol
// 2. Read series data for symbol
// 3. Get first signal, submit a virtual "Order", see if the order gets filled withing 3 days

type BacktestRow = {
  symbol: string;
  signalId: number;
  performance: number;
  riskRewardRatio: number;
  status: "open" | "active" | "cancelled" | "target" | "stop";
};

interface BacktestStatement {
  run(
    symbol: string,
    signalId: number,
    performance: number,
    riskRewardRatio: number,
    status: string,
  ): { changes: number; lastInsertRowid: number };
}

const selectSignals = db.prepare("SELECT * FROM signals WHERE symbol = ?");
const writeBacktest = db.prepare(
  "INSERT INTO backtest (symbol, signalId, performance, riskRewardRatio, status) VALUES (?, ?, ?, ?, ?)",
);

class OrderPosition {
  signal: Signal;
  series: DailyCandle[];
  status: "open" | "active" | "cancelled" | "stop" | "target";
  signalTarget: number;
  exitCandle: DailyCandle | undefined;
  riskRewardRatio: number;

  constructor(signal: Signal, riskRewardRatio: number, series: DailyCandle[]) {
    this.signal = signal;
    this.series = series;
    this.status = "open";
    this.riskRewardRatio = riskRewardRatio;
    this.signalTarget = signal.open +
      Math.abs(signal.open - signal.stop) / riskRewardRatio;

    if (
      this.series.findIndex((dailyCandle) =>
        dailyCandle.date === this.signal.date
      ) === -1
    ) {
      throw new Error(`Signal has not matching start date ${this.signal.date}`);
    }
  }

  private canBeFilled(dailyCandle: DailyCandle): boolean {
    return this.signal.open >= Number(dailyCandle.l) &&
      this.signal.open <= Number(dailyCandle.h);
  }

  private triggersStop(dailyCandle: DailyCandle): boolean {
    return this.signal.stop >= Number(dailyCandle.l) &&
      this.signal.stop <= Number(dailyCandle.h);
  }

  private canBeSold(dailyCandle: DailyCandle): boolean {
    return this.signalTarget >= Number(dailyCandle.l) &&
      this.signalTarget <= Number(dailyCandle.h);
  }

  backtest(): void {
    const startIndex =
      this.series.findIndex((dailyCandle) =>
        dailyCandle.date === this.signal.date
      ) - 1;
    for (
      let i = startIndex;
      i >= 0;
      i--
    ) {
      if (this.status === "cancelled") {
        console.log(
          `Order has been cancelled after ${
            this.series.findIndex((dailyCandle) =>
              dailyCandle.date === this.signal.date
            ) - i
          } trading days.`,
          this.signal,
        );
        break;
      }
      if (this.status === "open") {
        if (Math.abs(startIndex - i) > 4) {
          console.log(
            `Cancelling the order ${this.signal.symbol} on day ${
              this.series[i].date
            }`,
            this.signal,
          );
          this.status = "cancelled";
          break;
        }
        if (this.canBeFilled(this.series[i])) {
          console.log(
            `Filling the order ${this.signal.symbol} after ${
              Math.abs(startIndex + 1 - i)
            } trading days`,
          );
          this.status = "active";
          continue;
        }
      }
      if (this.status === "active" && this.triggersStop(this.series[i])) {
        console.log("Selling position at stop loss", this.signal.stop);
        this.status = "stop";
        this.exitCandle = this.series[i];
        break;
      }
      if (this.status === "active" && this.canBeSold(this.series[i])) {
        console.log(
          "Selling position at target price",
          this.signalTarget,
          this.signal,
        );

        this.status = "target";
        this.exitCandle = this.series[i];
        break;
      }
    }
    // console.log(`Backtest for symbol ${this.signal.symbol} results:`);
    // console.log("OrderPosition Status", this.status);
    // console.log("OrderPosition Performance:", this.calculatePerformance());
  }

  private calculatePerformance(): number {
    if (this.status === "cancelled") {
      return 0;
    }
    if (this.status === "target") {
      return this.signalTarget / this.signal.open - 1;
    }
    if (this.status === "stop") {
      return this.signal.stop / this.signal.open - 1;
    }
    if (this.status === "active") {
      // Position is still open
      // return current performance based on latest candle
      return (Number(this.series[0].o) + Number(this.series[0].c)) / 2 /
          this.signal.open - 1;
    }
    throw new Error(
      `Status: ${this.status} (Error: Sollte nicht vorkommen! Status muss am Ende immer 'cancelled' 'stop' oder 'target' sein.`,
    );
  }

  writeBacktestToDb(statement: BacktestStatement): void {
    const backtestData = [
      this.signal.symbol,
      this.signal.id,
      this.calculatePerformance(),
      this.riskRewardRatio,
      this.status,
    ] as const;
    try {
      const info = statement.run(...backtestData);
      console.log(
        `Inserted rowid: ${info.lastInsertRowid} - changes: ${info.changes}`,
      );
    } catch (e) {
      console.log(
        "Error inserting Backtest into DB",
        this.signal.symbol,
        "Signal ID",
        this.signal.id,
      );
    }
  }
}

(async () => {
  const args = process.argv.slice(2);
  if (args.includes("--symbol")) {
    // node -r @swc-node/register alphavantage/backtest.ts --symbol AAPL
    const symbolIndex = args.indexOf("--symbol");
    if (symbolIndex === -1 || args[symbolIndex + 1] === undefined) {
      console.error("Please provide a symbol e.g. --symbol AAPL");
      process.exit(1);
    }

    const symbol = args[symbolIndex + 1].toUpperCase();
    const signals = selectSignals.all(symbol) as Signal[];
    let series: DailyCandle[] = JSON.parse(
      await readFile(join(seriesPath, `${symbol}.json`), {
        encoding: "utf-8",
      }).catch(() => {
        console.log("No series data for ", symbol);
        process.exit(1);
      }),
    );
    const riskReward = 1 / 2;
    const orderPositions = signals.map((signal) =>
      new OrderPosition(signal, riskReward, series)
    );
    for (const orderPosition of orderPositions) {
      orderPosition.backtest();
      orderPosition.writeBacktestToDb(writeBacktest as BacktestStatement);
    }
  } else if (args.includes("--all-symbols")) {
    // node -r @swc-node/register alphavantage/backtest.ts --all-symbols
    const files = await readdir(seriesPath);
    for (let j = 0; j < files.length; j++) {
      const file = files[j];
      const symbol = file.replace(".json", "");

      try {
        console.log("Backtesting...", file);
        const signals = selectSignals.all(symbol) as Signal[];
        const series: DailyCandle[] = JSON.parse(
          await readFile(join(seriesPath, file), { encoding: "utf-8" }),
        );

        const riskReward = 1 / 2;
        const orderPositions = signals.map((signal) =>
          new OrderPosition(signal, riskReward, series)
        );
        for (const orderPosition of orderPositions) {
          orderPosition.backtest();
          orderPosition.writeBacktestToDb(writeBacktest as BacktestStatement);
        }
      } catch (e) {
        console.error("Backtest Error", e);
        continue;
      }
    }
  }
})();

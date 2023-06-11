import { type RSIBasis, type RSIResponse } from "./indicators";
import { type Database } from "sqlite";

export type MatcherResponse<T extends string> = {
  accept: boolean;
  data: {
    table: string;
    columns: { [K in T]: string };
  };
};

export type Matcher<T extends string> = (
  basis: RSIBasis[],
) => MatcherResponse<T>;

export const signals = {
  write(
    input: RSIResponse,
    matcher: Matcher<string>,
    db: Database,
  ) {
    const basis: RSIBasis[] = Object.entries(input["Technical Analysis: RSI"])
      .slice(-5) // the first values in the input array are the oldest, so we want the last 5
      .map(([date, data]) => ({ [date]: data }));
    const { accept, data } = matcher(basis);
    if (accept) {
      const symbol = input["Meta Data"]["2. Symbol"];
      const columns = Object.keys(data.columns);

      db.exec(
        `CREATE TABLE IF NOT EXISTS ${data.table} (symbol TEXT, date TEXT, ${
          columns.map((c) => `${c} TEXT`).join(", ")
        });`,
      );

      const stmt = db.prepare(
        `INSERT INTO ${data.table} (symbol, date, ${
          columns.join(", ")
        }) VALUES (:symbol, :date, ${columns.map((c) => `:${c}`).join(", ")});`,
      );
      stmt.run({ symbol, date: new Date().toISOString(), ...data.columns });
      console.log(stmt.expandedSql);
      stmt.finalize();
    }
  },
};

type SignalTableCols = "data_basis";
export type DataBasis = {
  RSI: number;
  SMA: number;
  Date: string;
  Diff: number;
};

export const match =
  (matchFn: (v: DataBasis[]) => boolean) => (basis: RSIBasis[]) => {
    let accept = false;
    const data_basis = basis.slice(-5).map((b) => {
      const Date = Object.keys(b)[0];
      const { RSI, SMA } = b[Date];
      const Diff = (RSI / SMA) - 1;
      return { RSI, SMA, Date, Diff };
    });
    accept = matchFn(data_basis);
    return {
      accept,
      data: {
        table: "signals",
        columns: {
          data_basis: JSON.stringify(data_basis),
        },
      },
    };
  };

import { db } from "./model/db.ts";
import { type RequestWithContext, ServerResponse } from "./server.ts";

function byDateHandler(req: RequestWithContext) {
  const date = req.search.get("date");
  if (!date) {
    return new ServerResponse(null, {
      status: 400,
      statusText: "Please enter a date",
    });
  }
  const result = getSignalsByDate(date);
  const body = result.data !== null ? JSON.stringify(result.data) : null;

  return new ServerResponse(body, {
    status: result.status,
    statusText: result.statusText,
  });
}

const signalStmtByDate = db.prepare(
  `SELECT * FROM signals_alpaca WHERE date = ?`,
);

function getSignalsByDate(date: string) {
  try {
    const data = signalStmtByDate.all(date);
    return {
      status: 200,
      statusText: "",
      data,
    };
  } catch (_e) {
    return {
      status: 400,
      statusText: `DB Error querying for latest signals`,
      data: null,
    };
  }
}

export const signalsByDate = ["/api/signals", byDateHandler] as const;

function bySymbolHandler(
  req: RequestWithContext,
) {
  const { symbol } = req.params;
  const result = getSignalsBySymbol(symbol?.toUpperCase() ?? "");
  const body = result.data !== null ? JSON.stringify(result.data) : null;

  return new ServerResponse(body, {
    status: result.status,
    statusText: result.statusText,
  });
}

const signalStmtBySymbol = db.prepare(
  `SELECT * FROM signals_alpaca WHERE symbol = ?`,
);

function getSignalsBySymbol(symbol: string) {
  try {
    const data = signalStmtBySymbol.all(symbol);
    return { status: 200, statusText: "", data };
  } catch (_e) {
    return {
      status: 400,
      statusText: `DB Error querying symbol ${symbol}`,
      data: null,
    };
  }
}

export const signalsBySymbol = [
  "/api/signals/:symbol",
  bySymbolHandler,
] as const;

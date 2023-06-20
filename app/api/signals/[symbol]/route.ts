import { db } from "@/model/db";

type Context = {
  params: { symbol: string };
};

export async function GET(
  req: Request,
  { params }: Context,
) {
  const { symbol } = params;
  const result = await getSignals(symbol.toUpperCase());
  const body = result.data !== null ? JSON.stringify(result.data) : null;

  return new Response(body, {
    status: result.status,
    statusText: result.statusText,
  });
}

const signalStmt = db.prepare(`SELECT * FROM signals WHERE symbol = ?`);

async function getSignals(symbol: string) {
  try {
    const data = signalStmt.all(symbol);
    return { status: 200, statusText: "", data };
  } catch (e) {
    return {
      status: 400,
      statusText: `DB Error querying symbol ${symbol}`,
      data: null,
    };
  }
}

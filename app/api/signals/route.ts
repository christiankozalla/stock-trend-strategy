import { db } from "@/model/db";


export async function GET(req: Request) {
  const date = new URLSearchParams(new URL(req.url).search).get("date");
  if (!date) {
    return new Response(null, {
      status: 400,
      statusText: "Please enter a date",
    });
  }
  const result = await getSignalsByDate(date);
  const body = result.data !== null ? JSON.stringify(result.data) : null;

  return new Response(body, {
    status: result.status,
    statusText: result.statusText,
  });
}

const signalStmt = db.prepare(`SELECT * FROM signals_alpaca WHERE date = ?`);

async function getSignalsByDate(date: string) {
  try {
    const data = signalStmt.all(date);
    return {
      status: 200,
      statusText: "",
      data,
    };
  } catch (e) {
    return {
      status: 400,
      statusText: `DB Error querying for latest signals`,
      data: null,
    };
  }
}

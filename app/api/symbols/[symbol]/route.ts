import { readFile } from "node:fs/promises";
import { seriesPath } from "@/alphavantage/utils";
import { db } from "@/model/db";

type Context = {
  params: { symbol: string };
};

export async function GET(
  req: Request,
  { params }: Context,
) {
  const { symbol } = params;
  if (typeof symbol !== "string") {
    return new Response(
      null,
      {
        status: 400,
        statusText: "Please enter a symbol",
      },
    );
  }
  const result = await getSeries(symbol.toUpperCase());

  return new Response(result.data, {
    status: result.status,
    statusText: result.statusText,
  });
}

async function getSeries(symbol: string) {
  const data = await readFile(seriesPath(`${symbol}.json`), "utf-8")
    .then((data) => {
      return { status: 200, statusText: "", data };
    }).catch((e) => {
      if (typeof e.code === "string" && e.code === "ENOENT") {
        return {
          status: 404,
          statusText: `Could not find ${symbol}`,
          data: null,
        };
      } else {
        return {
          status: 400,
          statusText: "Please enter a valid symbol",
          data: null,
        };
      }
    });
  return data;
}

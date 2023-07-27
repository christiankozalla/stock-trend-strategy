import { join } from "std/path/mod.ts";
import { ServerResponse, type RequestWithContext } from "./server.ts";

const textDecoder = new TextDecoder("utf-8");

const path = "/api/symbols/:symbol";

const __dirname = new URL('.', import.meta.url).pathname;

async function GET(
  req: RequestWithContext,
) {
  const { symbol } = req.params;
  if (typeof symbol !== "string") {
    return new ServerResponse(
      null,
      {
        status: 400,
        statusText: "Please enter a symbol",
      },
    );
  }
  const result = await getSeries(symbol.toUpperCase());

  return new ServerResponse(result.data, {
    status: result.status,
    statusText: result.statusText,
  });
}

async function getSeries(symbol: string) {
  const data = await Deno.readFile(
    join(__dirname, "data", "series", "alpaca", `${symbol}.json`),
  )
    .then((data) => {
      return { status: 200, statusText: "", data: textDecoder.decode(data) };
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

export const getSymbol = [path, GET] as const;
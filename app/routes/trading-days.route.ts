import { join } from "std/path/mod.ts";
import { type RequestWithContext, ServerResponse } from "./server.ts";

export const tradingDays = ["/api/trading-days", tradingDaysHandler] as const;

async function tradingDaysHandler(_req: RequestWithContext) {
    const result = await getTradingDays();

    return new ServerResponse(result.data, {
        status: result.status,
        statusText: result.statusText
    });
}

const textDecoder = new TextDecoder("utf-8");
const __dirname = new URL(".", import.meta.url).pathname;

async function getTradingDays() {
    const data = await Deno.readFile(
      join(__dirname, "..", "data", "trading-days.json"),
    )
      .then((data) => {
        return { status: 200, statusText: "", data: textDecoder.decode(data) };
      }).catch((e) => {
        if (typeof e.code === "string" && e.code === "ENOENT") {
          return {
            status: 404,
            statusText: `Could not find file 'trading-days.json'`,
            data: null,
          };
        } else {
          return {
            status: 500,
            statusText: "getTradingDays: Internal Server Error",
            data: null,
          };
        }
      });
    return data;
  }
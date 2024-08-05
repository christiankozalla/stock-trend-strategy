import { join } from "@std/path";

// use __dirname, not Deno.cwd() because __dirname is not affected by different locations the main script may be invoked from
const __dirname = (new URL(".", import.meta.url)).pathname;
export const seriesPath = (...fileOrPath: string[]) =>
  join(__dirname, "..", "..", "data", "series", "alpaca", ...fileOrPath);

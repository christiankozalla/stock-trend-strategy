import { alpaca } from "./client.ts";
import { join } from "std/path/mod.ts";
import { type DailyCandle, transform } from "./transformation.ts";
import stockSymbols from "./symbols.json" assert { type: "json" };

const __dirname = new URL(".", import.meta.url).pathname;

const textDecoder = new TextDecoder("utf-8");
const textEncoder = new TextEncoder();

export async function fetchDailySeries() {
  Deno.mkdir(
    join(
      __dirname,
      "..",
      "data",
      "series",
      "alpaca",
    ),
    { recursive: true },
  );

  for (let i = 0; i < stockSymbols.length; i++) {
    const symbol = stockSymbols[i];
    console.log("Fetching symbol: ", symbol);
    const serie = await alpaca.series(symbol);

    if (typeof serie === "undefined") {
      console.log("No data for", symbol);
      console.log("Response", serie);
      i--; // retry last symbol
      continue;
    }

    const dataModelConformSerie = transform(serie);

    try {
      const existingSerie: Partial<DailyCandle>[] = JSON.parse(
        textDecoder.decode(
          await Deno.readFile(
            join(
              __dirname,
              "..",
              "data",
              "series",
              "alpaca",
              `${symbol}.json`,
            ),
          ),
        ),
      );
      // add dates that did not exist before to the beginning of existing series
      existingSerie.push(
        ...dataModelConformSerie.filter((serie) =>
          !existingSerie.find((existingSerie) =>
            existingSerie.date === serie.date
          )
        ),
      );

      await Deno.writeFile(
        join(
          __dirname,
          "..",
          "data",
          "series",
          "alpaca",
          `${symbol}.json`,
        ),
        textEncoder.encode(JSON.stringify(existingSerie)),
      );
    } catch (e) {
      console.log(
        "Error trying to merge with existing series data.\nSaving to new file: ",
        symbol + ".json",
      );
      console.error(e);
      await Deno.writeFile(
        join(
          __dirname,
          "..",
          "data",
          "series",
          "alpaca",
          `${symbol}.json`,
        ),
        textEncoder.encode(JSON.stringify(dataModelConformSerie)),
      );
    }
  }
}

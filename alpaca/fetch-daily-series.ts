import { alpaca } from "@/alpaca/client";
import { type DailyCandle, transform } from "./transformation";
import stockSymbols from "./symbols.json" assert { type: "json" };
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { seriesPath } from "./utils";

(async () => {
  let waitInterval = 300;
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
        await readFile(
          seriesPath(`${symbol}.json`),
          { encoding: "utf-8" },
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

      await writeFile(
        seriesPath(`${symbol}.json`),
        JSON.stringify(existingSerie),
      );
    } catch (e) {
      console.log(
        "Error trying to merge with existing series data.\nSaving to new file: ",
        symbol + ".json",
      );
      console.error(e);
      await writeFile(
        seriesPath(`${symbol}.json`),
        JSON.stringify(dataModelConformSerie),
      );
    }
  }
})();

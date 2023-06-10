import { alphavantage } from "../alphavantage/client";
import { type DailyCandle, transform } from "../alphavantage/transformation";
import stockSymbols from "../symbols.json" assert { type: "json" };
import { join } from "node:path";
import { mkdir, readFile, writeFile } from "node:fs/promises";

(async () => {
  let waitInterval = 12000;
  // const date = new Date().toISOString().split("T")[0];
  const directory = join(process.cwd(), "data", "series");
  await mkdir(directory, { recursive: true });
  for (let i = 0; i < stockSymbols.length; i++) {
    const symbol = stockSymbols[i];
    await new Promise((resolve) => setTimeout(resolve, waitInterval));
    console.log("Fetching symbol: ", symbol);
    const serie = await alphavantage.series(symbol, "TIME_SERIES_DAILY_ADJUSTED");

    if (typeof serie === "undefined" || Object.keys(serie).length < 2) {
      console.log("No data for", symbol);
      console.log("Response", serie);
      await new Promise((resolve) => setTimeout(resolve, waitInterval));
      waitInterval += 2000;
      i--; // retry last symbol
      continue;
    }

    const dataModelConformSerie = transform(serie);
    // add Elder color

    try {
      const existingSerie: Partial<DailyCandle>[] = JSON.parse(
        await readFile(
          join(directory, `${symbol}.json`),
          { encoding: "utf-8" },
        ),
      );
      // add dates that did not exist before to the beginning of existing series
      existingSerie.unshift(
        ...dataModelConformSerie.filter((serie) =>
          !existingSerie.find((existingSerie) =>
            existingSerie.date === serie.date
          )
        ),
      );

      await writeFile(
        join(directory, `${symbol}.json`),
        JSON.stringify(existingSerie),
      );
    } catch (e) {
      console.log(
        "Error trying to merge with existing series data.\nSaving to new file: ",
        symbol + ".json",
      );
      console.error(e);
      await writeFile(
        join(directory, `${symbol}.json`),
        JSON.stringify(dataModelConformSerie),
      );
    }
  }
})();

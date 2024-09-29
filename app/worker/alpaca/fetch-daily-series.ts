import { alpaca } from "./client.ts";
import { type DailyCandle, transform } from "./transformation.ts";
import stockSymbols from "./symbols.json" with { type: "json" };
import { seriesPath } from "./utils.ts";

export async function fetchDailySeries() {
  Deno.mkdir(
    seriesPath(),
    { recursive: true },
  );

  for (let i = 0; i < stockSymbols.length; i++) {
    const symbol = stockSymbols[i];
    console.log("Fetching symbol: ", symbol);
    const serie = await alpaca.series(symbol);

    // Respect Alpacas API rate limit of 200 calls/min
    await new Promise((resolve) => setTimeout(resolve, 330));

    if (typeof serie === "undefined") {
      console.log("No data for", symbol);
      i--; // retry last symbol
      continue;
    }

    const dataModelConformSerie = transform(serie);

    try {
      const existingSerie: Partial<DailyCandle>[] = JSON.parse(
        await Deno.readTextFile(
          seriesPath(`${symbol}.json`),
        ),
      );
      // add dates that did not exist before to the beginning of existing series
      existingSerie.push(
        ...dataModelConformSerie.filter((serie) =>
          !existingSerie.find((existingSerie) => existingSerie.date === serie.date)
        ),
      );

      await Deno.writeTextFile(
        seriesPath(`${symbol}.json`),
        JSON.stringify(existingSerie),
      );
    } catch (e) {
      console.log(
        `Error trying to merge with existing series data.\nSaving to new file: ${symbol}.json`,
      );
      console.error(e);
      await Deno.writeTextFile(
        seriesPath(`${symbol}.json`),
        JSON.stringify(dataModelConformSerie),
      );
    }
  }
}

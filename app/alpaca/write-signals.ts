/**
Ein “Signal” ist ein Set von 3 klar definierten Orders

Signal-Open: Einstiegsorder

Signal-Stop: Ausstiegsorder zur Risikobegrenzung (alternative Namen: Signal-Risk, Signal-Exit)

Signal-Target: Ausstiegsorder zu Gewinnmitnahme



Signal-Open ist eine Stop-Buy Order

Voraussetzung: Nutzer hat keine offene Position

Signalgeber: Grüne Kerze folgt auf blaue oder rote Kerze: High der grünen Kerze ist Kaufpreis der Stop-Buy Order an folgenden Tagen

Gültigkeit der Order: Canceln der Order nach Auftreten einer roten Kerze



Signal-Stop ist eine Stop-Sell Order

Signalgeber: Low der ersten vorherigen roten Kerze

Regeln zum “Nachziehen” des Stop-Sell Verkaufspreis?



Signal-Target ist eine Limit-Sell Order

Grundlage ist ein “Risk” / “Reward” Verhältnis - Beispiel 2.5 / 5

Das RR-Verhältnis ist hier 0.5 (kurz: “RR”)

Beispiel:

Signal-Open Preis 100 $

Signal-Stop Preis 92 $

Signal-Target Preis = 100 $ + (100 $ - 92 $ )  / RR ) = 100 $ + 8 $ * 2 = 116 $

Oder (Äquivalent)

Signal-Target Preis = SOP + ( SOP - SSP ) / RR



Signal-Volume: Anzahl der Aktien in einem Signal

Die Anzahl der Aktien wird anhand des RR berechnet - Beispiel 2.5 / 5

Gesamter Max-Drawdown: SOP - SSP

Portfolio: P

Risk 2.5 bedeutet: 2.5 % vom gesamten Portfolio ist das Risiko des Signals

Anzahl der Aktien im Signal: V

V = P \ *Risk / 100 /  Max-Drawdown = P * Risk / ( 100 * ( SOP - SSP ) )
*/

import { db } from "../model/db.ts";
import { join } from "std/path/mod.ts";
import { type DailyCandle } from "./transformation.ts";

// Loop over all DailyCandles from oldest to latest
// Keep track of red DailyCanle and wait for next green DailyCandle
// Condition: red(low) < green(low)
// Match a Signal and write it to DB
const textDecoder = new TextDecoder("utf-8");
const __dirname = new URL(".", import.meta.url).pathname;
const seriesPath = (fileOrPath = "") =>
  join(__dirname, "..", "data", "series", "alpaca", fileOrPath);
globalThis.addEventListener("beforeunload", () => db.close());

export async function writeSignals() {
  for await (const dirEntry of Deno.readDir(seriesPath())) {
    if (!dirEntry.isFile) continue;
    try {
      console.log("Adding Elder Color to", dirEntry.name);
      const data = await Deno.readFile(seriesPath(dirEntry.name));
      const fileContent = textDecoder.decode(data);
      const candles: DailyCandle[] = JSON.parse(fileContent);

      writeSignalsToSeries(candles);
      console.log(`Finished Writing Signals for ${dirEntry.name}`);
    } catch (e) {
      console.log("Error reading series or writing signals", e);
    }
  }
}

const insertSignal = db.prepare(
  "INSERT INTO signals_alpaca (symbol, date, open, stop) VALUES (?, ?, ?, ?)",
);

function writeSignalsToSeries(candles: DailyCandle[]) {
  let redCandle: DailyCandle | undefined = undefined; //  is always the latest red candle
  let greenCandle: DailyCandle | undefined = undefined;
  for (let i = 0; i < candles.length; i++) {
    const candle = candles[i];
    if (candle.elder === "red") {
      redCandle = candle;
      continue;
    } else if (candle.elder === "blue") continue;
    else if (candle.elder === "green") {
      greenCandle = candle;
      if (redCandle !== undefined) {
        if (Number(redCandle.l) < Number(greenCandle.l)) {
          console.log("writeSignal for ", candle.symbol);
          const open = Number(greenCandle.h);
          const stop = Number(redCandle.l);
          try {
            insertSignal.run(candle.symbol, candle.date, open, stop);
          } catch (e) {
            console.log("DB Error: searchys", e);
          }
          redCandle = undefined;
          continue;
        } else {
          console.log(
            "Matching red and green candle, BUT green candle is LOWER",
          );
        }
      } else {
        // console.log(
        //   "writeSignal - Green Candle without matching Red Candle! Continueing...",
        // );
        continue;
      }
    }
  }
}

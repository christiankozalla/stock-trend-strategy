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

import { db } from "../model/db";
import { readdirSync, readFileSync } from "fs";
import { seriesPath } from "./utils";
import { DailyCandle } from "./transformation";

// Loop over all DailyCandles from oldest to latest
// Keep track of red DailyCanle and wait for next green DailyCandle
// Condition: red(low) < green(low)
// Match a Signal and write it to DB
const seriesFiles = readdirSync(seriesPath());

const insertSignal = db.prepare(
  "INSERT INTO signals (symbol, date, open, stop) VALUES (?, ?, ?, ?)",
);

for (const fileName of seriesFiles) {
  console.log(`Processing file: ${fileName}`);
  try {
    const candles: DailyCandle[] = JSON.parse(
      readFileSync(seriesPath(fileName)).toString(),
    );
    writeSignals(candles).then(() => {
      console.log(`Finished Writing Signals for ${fileName}`);
    });
  } catch (e) {
    console.error("Error Write Signals", e);
  }
}

process.on("beforeExit", () => db.close());

async function writeSignals(candles: DailyCandle[]) {
  let redCandle: DailyCandle | undefined = undefined; //  is always the latest red candle
  let greenCandle: DailyCandle | undefined = undefined;
  for (let i = candles.length - 1; i >= 0; i--) {
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
          insertSignal.run(candle.symbol, candle.date, open, stop);
          redCandle = undefined;
          continue;
        } else {
          console.log(
            "Matching red and green candle, BUT green candle is LOWER",
          );
        }
      } else {
        console.log(
          "writeSignal - Green Candle without matching Red Candle! Continueing...",
        );
        continue;
      }
    }
  }
}

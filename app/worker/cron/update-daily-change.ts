import { writeDailyChange } from "../heat-map-extension/write-daily-change-to-db.ts";

await writeDailyChange(7);

console.log(new Date(), "Sucessfully updated daily change DB table");

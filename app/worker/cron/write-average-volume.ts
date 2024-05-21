import { writeAvgVolumeOfSeriesToDb } from "../alpaca/volume/average-volume.ts";

for (let daysBefore = 1; daysBefore < 60; daysBefore++) {
  const date = new Date();
  date.setDate(date.getDate() - daysBefore);
  await writeAvgVolumeOfSeriesToDb(date);
}

import { join } from "node:path";

export const seriesPath = (file = '') => join(process.cwd(), "data", "series", file);

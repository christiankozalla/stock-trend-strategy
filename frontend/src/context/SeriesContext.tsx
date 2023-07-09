import React, { Dispatch, SetStateAction, createContext, useState } from "react";
import { type DailyCandle } from "../../../app/alpaca/transformation.ts";
import { type Signal } from "../../../app/model/types.ts";


type Series = { symbol: string, data: DailyCandle[], signals: Signal[] };

export const SeriesContext = createContext<{ series: Series, setSeries: Dispatch<SetStateAction<Series>> }>({
    series: { symbol: "", data: [], signals: [] },
    setSeries: () => { }
});

export function SeriesProvider({ children }: { children: React.ReactNode }) {
    const [series, setSeries] = useState<Series>({ symbol: "", data: [], signals: [] })
    return <SeriesContext.Provider value={{
        series,
        setSeries
    }}>{children}</SeriesContext.Provider>;
}
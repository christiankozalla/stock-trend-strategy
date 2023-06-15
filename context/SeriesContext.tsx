"use client";
import React, { Dispatch, SetStateAction, createContext, useState } from "react";
import { type DailyCandle } from "@/alphavantage/transformation";


type Series = { symbol: string, data: DailyCandle[] };

export const SeriesContext = createContext<{ series: Series, setSeries: Dispatch<SetStateAction<Series>> }>({
    series: { symbol: "", data: [] },
    setSeries: () => { }
});

export function SeriesProvider({ children }: { children: React.ReactNode }) {
    const [series, setSeries] = useState<Series>({ symbol: "", data: [] })
    return <SeriesContext.Provider value={{
        series,
        setSeries
    }}>{children}</SeriesContext.Provider>;
}
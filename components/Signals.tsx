"use client";
import { useContext } from "react";
import { SeriesContext } from "@/context/SeriesContext";
import { SignalsList } from "./SignalsList";


export function Signals() {
    const { series } = useContext(SeriesContext);
    return (
        <section>
            {series.symbol && <h3>Signals for {series.symbol}</h3>}
            <SignalsList signals={series.signals} />
        </section>
    )
}

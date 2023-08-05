import { useContext } from "react";
import { SeriesContext } from "../context/SeriesContext.tsx";
import { SignalsList } from "./SignalsList.tsx";


export function Signals() {
    const { series } = useContext(SeriesContext);
    return (
        <section>
            {series.symbol && <h3>Signals for {series.symbol}</h3>}
            <SignalsList signals={series.signals} type="symbol" />
        </section>
    )
}

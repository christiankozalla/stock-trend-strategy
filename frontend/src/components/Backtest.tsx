import { useContext, useState, useEffect } from "react";
import { SeriesContext } from "../context/SeriesContext.tsx";
import { useBacktest } from "../lib/hooks/useBacktest.ts";

export function Backtest() {
    useEffect(() => {
        console.log("rendering backtest");
    });
    const [rRR, setRRR] = useState(0.3);
    const { series } = useContext(SeriesContext);
    const orderPositions = useBacktest({ series, riskRewardRatio: rRR });

    function performance() {
        const overall = (orderPositions || []).reduce((acc, op) => acc + (op.performance ?? 0), 0) * 100;
        const gains = (orderPositions || []).filter((op) => op.performance && op.performance > 0).reduce((acc, op) => acc + (op.performance ?? 0), 0) * 100;
        const losses = (orderPositions || []).filter((op) => op.performance && op.performance < 0).reduce((acc, op) => acc + (op.performance ?? 0), 0) * 100;
        return {
            gains,
            losses,
            overall,
        }
    }

    return (
        <div>
            <section>
                Risk Reward Ratio: {rRR}
                <br />
                <input type="range" min="0.1" max="1" step="0.1" value={rRR} onChange={(e) => setRRR(Number(e.target.value))} />
            </section>
            <section>
                Overall performance: {performance().overall.toFixed(1)} %
                <br />
                Gains: {performance().gains.toFixed(1)} %
                <br />
                Losses: {performance().losses.toFixed(1)} %
            </section>
            <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr" }}>
                {orderPositions.map((op) => (
                    <span key={op.signal.date}>{op.signal.symbol} | {op.signal.date} | {op.status} | {typeof op.performance === "number" ? (op.performance * 100).toFixed(1) + " %" : "No Performance!"}</span>
                ))}
            </section>
        </div>
    )
}
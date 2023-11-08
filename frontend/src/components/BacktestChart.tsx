import { useContext, useState, useRef } from "react";
import { SeriesContext } from "../context/SeriesContext.tsx";
import { useBacktest } from "../lib/hooks/useBacktest.ts";
import { useGoogleCharts } from "../lib/hooks/useGoogleCharts.ts";

const colorMap = {
    "red": "#ff0000", // hex-code red
    "blue": "#0000ff", // hex-code blue
    "green": "#00ff00", // hex-code green
} as const;

export function BacktestChart() {
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

    const chartEl = useRef<HTMLDivElement | null>(null);

    useGoogleCharts(() => {
        if (chartEl.current && Array.isArray(series.data) && series.data.length > 0) {
            if (new Date(series.data[0].date) > new Date(series.data[1].date)) series.data.reverse();

            const base: any[] = series.data.map((candle) => {
                const backtestItem = orderPositions.find((op) => op.signal.date === candle.date);
                const performance = backtestItem?.performance ? Number(backtestItem.performance) * 100 : null;
                return [candle.date, performance, performance === null ? "" : performance > 0 ? `fill-color: ${colorMap["green"]}; stroke-width: 5; stroke-color: ${colorMap["green"]}` : `fill-color: ${colorMap["red"]}; stroke-width: 5; stroke-color: ${colorMap["red"]}`];
            });

            base.unshift(["Date", "Performance", { role: "style" }]);

            const data = window.google.visualization.arrayToDataTable(base);
            const chart = new window.google.visualization.ColumnChart(chartEl.current);
            chart.draw(data, {
                bar: {
                    groupWidth: "50%"
                },
                vAxis: {
                    title: 'Performance in %'
                }, legend: 'none'
            });
        }
    }, { 'packages': ['corechart'] }, [series.data, orderPositions]);

    return (
        <div style={{ paddingLeft: "6px", paddingRight: "6px", marginTop: "12px" }}>
            <h2>Backtest of calculated Signals</h2>
            <div style={{ display: "flex", gap: "6px" }}>
                Current Risk-Reward-Ratio: {rRR}
                <input type="range" min="0.1" max="1" step="0.1" value={rRR} onChange={(e) => setRRR(Number(e.target.value))} />
                <span>Overall: {performance().overall.toFixed(1)} %</span>
                <span>Gains: {performance().gains.toFixed(1)} %</span>
                <span>Losses: {performance().losses.toFixed(1)} %</span>
            </div>
            <div ref={chartEl}></div>
        </div>
    );
}
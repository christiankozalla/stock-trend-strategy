import { useContext, useRef } from "react";
import { SeriesContext } from "../context/SeriesContext.tsx";
import { useGoogleCharts } from "../lib/hooks/useGoogleCharts.ts";

const colorMap = {
    "red": "#ff0000", // hex-code red
    "blue": "#0000ff", // hex-code blue
    "green": "#00ff00", // hex-code green
} as const;

export function SeriesChart() {
    const { series } = useContext(SeriesContext);
    const chartEl = useRef<HTMLDivElement | null>(null);

    useGoogleCharts(() => {
        if (chartEl.current && Array.isArray(series.data) && series.data.length > 0) {
            if (new Date(series.data[0].date) > new Date(series.data[1].date)) series.data.reverse();

            const base: any[] = series.data.map((candle) => [candle.date, Number(candle.l), Number(candle.o), Number(candle.c), Number(candle.h), `fill-color: ${colorMap[candle.elder as keyof typeof colorMap]};`]);
            base.unshift(["Date", "Low", "Open", "Close", "High", { role: "style" }]);

            // Add "marker" for a signal
            if (Array.isArray(series.signals) && series.signals.length > 0) {
                series.signals.forEach((signal) => {
                    const index = base.findIndex((data) => data[0] === signal.date);
                    if (index > -1) {
                        base[index][5] = base[index][5] + "stroke-width: 5; stroke-color: #000"; // marker for a signal
                    }
                });
            }

            const data = window.google.visualization.arrayToDataTable(base);
            const chart = new window.google.visualization.CandlestickChart(chartEl.current);
            chart.draw(data, { vAxis: { title: 'Price in USD' }, legend: 'none', tooltip: { trigger: 'none' } });
        }
    }, { 'packages': ['corechart'] }, [series.data]);

    return (
        <div ref={chartEl} style={{ height: "70vh" }}></div>
    );
}
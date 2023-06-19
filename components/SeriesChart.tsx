"use client";
import { useContext, useRef } from "react";
import { SeriesContext } from "@/context/SeriesContext";
import { useGoogleCharts } from "@/lib/hooks/useGoogleCharts";

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

            const base: any[] = series.data.map((candle, i) => [candle.date, Number(candle.l), Number(candle.o), Number(candle.c), Number(candle.h), `${colorMap[candle.elder]}`]);
            base.unshift(["Date", "Low", "Open", "Close", "High", { role: "style" }]);

            const data = google.visualization.arrayToDataTable(base);
            const chart = new google.visualization.CandlestickChart(chartEl.current);
            chart.draw(data, { title: series.symbol, legend: 'none', tooltip: { trigger: 'none' } });
        }

    }, { 'packages': ['corechart'] }, [series.data]);
    return (
        <div style={{ backgroundColor: "lightblue", height: "600px" }}>
            <div ref={chartEl} style={{ minHeight: "100%" }}></div>
        </div>
    );
}
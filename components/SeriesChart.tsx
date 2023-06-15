"use client";
import { useContext } from "react";
import { SeriesContext } from "@/context/SeriesContext";

export function SeriesChart() {
    const { series } = useContext(SeriesContext);
    return (
        <div style={{ backgroundColor: "lightblue" }}>
            <pre>
                {JSON.stringify(series.data)}
            </pre>
        </div>
    )
}
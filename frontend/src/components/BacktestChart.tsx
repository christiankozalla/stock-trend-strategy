import { useContext, useState, useMemo } from "react";
import { scaleTime, scaleLinear } from "@visx/scale";
import { AxisLeft, Axis, type TickFormatter } from "@visx/axis";
import { Bar } from "@visx/shape";
import { SeriesContext } from "../context/SeriesContext.tsx";
import { useBacktest, type OrderPosition } from "../lib/hooks/useBacktest.ts";
// import { mq } from "./css/breakpoints.ts";

const colorMap = {
    "red": "#ff0000", // hex-code red
    "blue": "#0000ff", // hex-code blue
    "green": "#00ff00", // hex-code green
} as const;

type ChartProps = {
    width: number;
    height: number;
    margin?: { top: number; right: number; bottom: number; left: number };
};


// const containerStyles = {
//     ...mq({ max: "640px" })({
//         fontSize: "9px",
//         ".container h2": {
//             fontSize: "1em"
//         },
//         input: {
//             width: "64px"
//         }
//     })
// };
// accessors
const performanceInPercent = (op: OrderPosition) => op?.performance ? op.performance * 100 : 0;

export function BacktestChart({
    width,
    height,
    margin = { top: 6, right: 0, bottom: 0, left: 60 },
}: ChartProps) {
    const [rRR, setRRR] = useState(0.3);
    const { series } = useContext(SeriesContext);
    const orderPositions = useBacktest({ series, riskRewardRatio: rRR });

    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

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

    const dateTickFormat: TickFormatter<Date | { valueOf(): number }> = (date) => new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(new Date(date.valueOf()));
    const dateTickValues: Date[] = series.data.length > 0
        ? [new Date(series.data[0].date), ...series.data.map((d, i) => i % 60 === 0 ? new Date(d.date) : undefined).filter(Boolean) as Date[]]
        : [];

    // scales
    const dateScale = useMemo(
        () => {
            const dates = series.data.map((candle) => +new Date(candle.date));
            return scaleTime({
                range: [margin.left, innerWidth + margin.left],
                domain: [new Date(Math.min(...dates)), new Date(Math.max(...dates))],
            })
        },
        [margin, series],
    );

    const performanceScale = useMemo(
        () => {
            const performances = orderPositions.map(performanceInPercent)
            return scaleLinear({
                range: [height - margin.bottom, margin.top], // flipped because svg coordinates increase top to bottom
                domain: [Math.min(...performances), Math.max(...performances)],
            });
        },
        [margin, orderPositions],
    );

    return (
        <div style={{ padding: "12px 6px" }}> {/* css={containerStyles} */}
            <h2>Backtest of calculated Signals</h2>
            <div className="container" style={{ display: "flex", gap: "6px" }}>
                RRR: {rRR}
                <input type="range" min="0.1" max="1" step="0.1" value={rRR} onChange={(e) => setRRR(Number(e.target.value))} />
                <div>
                    <span>Overall: {performance().overall.toFixed(1)} %</span>
                    <span>Gains: {performance().gains.toFixed(1)} %</span>
                    <span>Losses: {performance().losses.toFixed(1)} %</span>
                </div>
            </div>
            <svg width={width} height={height}>
                {orderPositions.map((op) => {
                    const percent = performanceInPercent(op);
                    const barHeight = Math.abs(performanceScale(0) - performanceScale(percent)); // Math.abs(performanceScale(14) - performanceScale(0));
                    return (
                        <Bar
                            key={op.signal.id}
                            x={dateScale(new Date(op.signal.date))}
                            y={percent > 0 ? performanceScale(0) - barHeight : performanceScale(0)}
                            height={barHeight}
                            width={9}
                            fill={percent > 0 ? colorMap.green : colorMap.red}
                        />
                    )
                })}
                <AxisLeft scale={performanceScale} left={margin.left} top={margin.top} orientation="left" label="Performance %" tickFormat={(p) => p.valueOf().toFixed(0)} />
                <Axis scale={dateScale} top={performanceScale(0) || innerHeight} label="Time" tickValues={dateTickValues} tickFormat={dateTickFormat} />
            </svg>
        </div>
    );
}
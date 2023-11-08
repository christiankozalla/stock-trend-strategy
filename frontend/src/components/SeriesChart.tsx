import { useMemo, useContext } from 'react';
import { SeriesContext } from "../context/SeriesContext";
import { scaleTime, scaleLinear } from '@visx/scale';
import { AxisBottom, AxisLeft, type TickFormatter } from '@visx/axis';
import { DailyCandle } from '../../../app/worker/alpaca/transformation';
import { SvgCandle } from './SvgCandle';


type ChartProps = {
    width: number;
    height: number;
    margin?: { top: number; right: number; bottom: number; left: number };
};

export function SeriesChart({
    width,
    height,
    margin = { top: 0, right: 0, bottom: 40, left: 60 },
}: ChartProps) {
    if (width < 10) return null;

    const { series } = useContext(SeriesContext);

    // bounds
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    const dateTickFormat: TickFormatter<Date | { valueOf(): number }> = (date) => new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(new Date(date.valueOf()));
    const dateTickValues: Date[] = series.data.length > 0 ? [new Date(series.data[0].date), ...series.data.map((d, i) => i % 60 === 0 ? new Date(d.date) : undefined).filter(Boolean) as Date[]] : [];

    // scales
    const dateScale = useMemo(
        () =>{
            const dates = series.data.map((candle) => +new Date(candle.date));
            return scaleTime({
                range: [margin.left, innerWidth + margin.left],
                domain: [new Date(Math.min(...dates)), new Date(Math.max(...dates))],
            })},
        [margin, series],
    );
    const priceScale = useMemo(
        () => {
            const highs = series.data.map((candle) => candle.h);
            return scaleLinear({
                range: [height - margin.bottom, margin.top], // flipped because svg coordinates increase top to bottom
                domain: [Math.min(...highs), Math.max(...highs)],
                nice: true,
            });
        },
        [margin, series],
    );

    const scaleCandle = (d: DailyCandle) => ({ o: priceScale(d.o), h: priceScale(d.h), l: priceScale(d.l), c: priceScale(d.c), date: dateScale(new Date(d.date)) });

    return (
        <svg width={width} height={height}>
            {series.data.map(scaleCandle).map((scaled) => (
                <SvgCandle key={scaled.date} {...scaled} x={scaled.date} />
            ))}
            <AxisLeft scale={priceScale} left={margin.left} top={margin.top} orientation="left" label="Price" tickFormat={(p) => `$ ${p.valueOf().toFixed(0)}`} />
            <AxisBottom scale={dateScale} top={innerHeight + 2*margin.top } label="Time" tickValues={dateTickValues} tickFormat={dateTickFormat} />
        </svg>
    );
};
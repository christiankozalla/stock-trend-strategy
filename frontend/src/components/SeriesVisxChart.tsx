import { useMemo, useContext } from 'react';
import { SeriesContext } from "../context/SeriesContext";
import { scaleTime, scaleLinear } from '@visx/scale';
import { extent } from '@visx/vendor/d3-array';
import { DailyCandle } from '../../../app/worker/alpaca/transformation';
import { SvgCandle } from './SvgCandle';


type ChartProps = {
    width: number;
    height: number;
    margin?: { top: number; right: number; bottom: number; left: number };
};

export function SeriesVisxChart({
    width,
    height,
    margin = { top: 0, right: 0, bottom: 0, left: 0 },
}: ChartProps) {
    if (width < 10) return null;

    const { series } = useContext(SeriesContext);
    // bounds
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // scales
    const dateScale = useMemo(
        () =>
            scaleTime({
                range: [margin.left, innerWidth + margin.left],
                domain: extent(series.data, (d) => new Date(d.date)) as [Date, Date],
            }),
        [innerWidth, margin.left, series],
    );
    const priceScale = useMemo(
        () => {
            return scaleLinear({
                range: [innerHeight, 0], // flipped because svg coordinates increase top to bottom
                domain: extent(series.data, (d) => d.h) as [number, number],
                nice: true,
            });
        },
        [margin.top, innerHeight, series],
    );

    const scaleCandle = (d: DailyCandle) => ({ o: priceScale(d.o), h: priceScale(d.h), l: priceScale(d.l), c: priceScale(d.c), date: d.date });

    if (series.data.length === 0) return null;

    return (
        <svg width={width} height={height}>
            {series.data.map(scaleCandle).map((scaledCandle) => (
                <SvgCandle key={scaledCandle.date} {...scaledCandle} x={dateScale(new Date(scaledCandle.date)) ?? 0} />
            ))}
        </svg>
    );
};
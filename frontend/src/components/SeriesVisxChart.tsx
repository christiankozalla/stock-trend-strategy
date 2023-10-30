import { useMemo, useContext } from 'react';
import { SeriesContext } from "../context/SeriesContext";
import { scaleTime, scaleLinear } from '@visx/scale';
import { AxisBottom, AxisLeft, type TickFormatter } from '@visx/axis';
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
        () =>
            scaleTime({
                range: [margin.left, innerWidth + margin.left],
                domain: extent(series.data, (d) => new Date(d.date)) as [Date, Date],
            }),
        [margin, series],
    );
    const priceScale = useMemo(
        () => {
            return scaleLinear({
                range: [height - margin.bottom, margin.top], // flipped because svg coordinates increase top to bottom
                domain: extent(series.data, (d) => d.h) as [number, number],
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
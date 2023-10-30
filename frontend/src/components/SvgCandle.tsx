import type { DailyCandle } from "../../../app/worker/alpaca/transformation";

type SvgCandleProps = Pick<DailyCandle, "o" | "h" | "l" | "c"> & { x: number }; 

/**
 * @example
 * <SvgCandle {...{ o: 100, h: 125, l: 88, c: 120, x: 10 }} />
 * 
 */
export function SvgCandle({ o, h, l, c, x }: SvgCandleProps) {
    // o,h,l,c values are scaled before being passed here, scaling flippes the prices
    // Flipped prices example
    // flipped o (open) 100 $ -> 230px
    // flipped c (close) 125 $ -> 185px
    const strokeColor = o > c ? "green" : "red"; // flipped because svg coordinates increase top to bottom
    const length = 2;
    const strokeWidth = 1.8;
    return (
        <g stroke={strokeColor} strokeWidth={strokeWidth}>
            <line y1={o} y2={o} x1={x} x2={x - (0.5*strokeWidth + length)} />
            <line y1={l} y2={h} x1={x} x2={x} />
            <line y1={c} y2={c} x1={x} x2={x + 0.5*strokeWidth + length} />
        </g>
    );
}

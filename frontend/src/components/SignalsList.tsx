import type { Signal } from "../context/SeriesContext";
import { List } from "@mui/joy";

type Props = {
    signals: Signal[];
    type: "date" | "symbol";
}

export function SignalsList({ signals, type }: Props) {
    return <List size="sm"  sx={{ fontSize: 10, overflowY: "scroll", maxHeight: 200, '&::-webkit-scrollbar': { width: "4px" }, '&::-webkit-scrollbar-thumb': { background: "grey", } }}>
        {signals
            .sort((a, b) => +new Date(b.date) - +new Date(a.date))
            .map((signal) => (
                <li style={{ marginBottom: "12px" }} key={signal.id}>
                    {type === "symbol" ? <span>{signal.date}</span> : <span>{signal.symbol}</span>}<br />
                    Open {signal.open} <br />
                    Stop {signal.stop} <br />
                    Risk {(calculateRisk(signal.open, signal.stop) * 100).toFixed(1)} % Target {((calculateRisk(signal.open, signal.stop) * 2 + 1) * signal.open).toFixed(1)}
                </li>
            ))}
    </List>

}

function calculateRisk(open: number | string, stop: number | string): number {
    open = Number(open);
    stop = Number(stop);

    return Math.abs(open - stop) / open;
}

import type { Signal } from "../context/SeriesContext";
import styles from "./css/SignalsList.module.css";

type Props = {
    signals: Signal[];
    type: "date" | "symbol";
    expanded: boolean;
}

export function SignalsList({ signals, type, expanded }: Props) {
    return <ul className={styles.scrollbar} style={{ color: expanded ? "initial" : "white", fontSize: 10, overflowY: "scroll", maxHeight: 200, height: expanded ? "initial" : 0 }}>
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
    </ul>

}

function calculateRisk(open: number | string, stop: number | string): number {
    open = Number(open);
    stop = Number(stop);

    return Math.abs(open - stop) / open;
}

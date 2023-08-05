import type { Signal } from "../../../app/model/types.ts";
import styles from "./css/SignalsList.module.css"

type Props = {
    signals: Signal[];
    type: "date" | "symbol";
}

export function SignalsList({ signals, type }: Props) {
    return <ul className={styles.ul}>
        {signals
            .sort((a, b) => +new Date(b.date) - +new Date(a.date))
            .map((signal) => (
                <li style={{ marginBottom: "12px" }} key={signal.id}>
                    {type === "symbol" ? <span>Date {signal.date}</span> : <span>Symbol {signal.symbol}</span>}<br />
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

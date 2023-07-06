import type { Signal } from "@/model/types";
import styles from "@/components/css/SignalsList.module.css"

type Props = {
    signals: Signal[];
}

export function SignalsList({ signals }: Props) {
    return <ul className={styles.ul}>
        {signals
            .sort((a, b) => +new Date(b.date) - +new Date(a.date))
            .map((signal) => (
                <li style={{ marginBottom: "12px" }}>
                    Date {signal.date} <br />
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

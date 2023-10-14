import { type Series, type Signal } from "../../context/SeriesContext";
import { type DailyCandle } from "../../../../app/worker/alpaca/transformation";


export function useBacktest({ series, riskRewardRatio }: { series: Series, riskRewardRatio: number }) {
    if (!series.symbol) return [];

    const orderPositions = series.signals
        .map((signal) => (new OrderPosition(signal, riskRewardRatio, series.data).backtest()));

    return orderPositions;
}

const FIVE_DAYS_THRESHOLD_MILLISECONDS = 5 * 24 * 60 * 60 * 1000;

class OrderPosition {
    signal: Signal;
    series: DailyCandle[];
    riskRewardRatio: number;
    status: "open" | "active" | "cancelled" | "stop" | "target";
    signalTarget: number;
    performance?: number;
    buyCandle?: DailyCandle;
    exitCandle?: DailyCandle;

    constructor(signal: Signal, riskRewardRatio: number, series: DailyCandle[]) {
        this.signal = signal;
        this.series = series;
        this.status = "open";
        this.riskRewardRatio = riskRewardRatio;
        this.signalTarget = signal.open +
            Math.abs(signal.open - signal.stop) / riskRewardRatio;

        if (
            this.series.findIndex((dailyCandle) => dailyCandle.date === this.signal.date) === -1
        ) {
            throw new Error(`Signal has not matching start date ${this.signal.date}`);
        }
    }

    private canBeFilled(dailyCandle: DailyCandle): boolean {
        return dailyCandle.h > this.signal.open;
    }

    private triggersStop(dailyCandle: DailyCandle): boolean {
        console.log("triggers");
        if (this.buyCandle && +new Date(dailyCandle.date) - +new Date(this.buyCandle.date) > FIVE_DAYS_THRESHOLD_MILLISECONDS) {
            return dailyCandle.l <= this.averagePrice(this.buyCandle);
        }
        return dailyCandle.l <= this.signal.stop
    }

    private canBeSold(dailyCandle: DailyCandle): boolean {
        return dailyCandle.h >= this.signalTarget
    }

    backtest() {
        const startIndex =
            this.series.findIndex((dailyCandle) => dailyCandle.date === this.signal.date);
        try {
            for (
                let i = startIndex + 1;
                i < this.series.length;
                i++
            ) {
                if (this.status === "open") {
                    if (Math.abs(startIndex - i) > 4 || this.triggersStop(this.series[i])) {
                        this.status = "cancelled";
                        this.exitCandle = this.series[i];
                        break;
                    }

                    if (this.canBeFilled(this.series[i])) {
                        this.buyCandle = this.series[i];
                        this.status = "active";
                        continue;
                    }
                }
                if (this.status === "active") {
                    if (this.triggersStop(this.series[i])) {
                        this.status = "stop";
                        this.exitCandle = this.series[i];
                        break;
                    }

                    if (this.canBeSold(this.series[i])) {
                        this.status = "target";
                        this.exitCandle = this.series[i];
                        break;
                    }
                }
            }
        } catch (e) {
            console.error("fatal", e);
        }
        // console.log(`Backtest for symbol ${this.signal.symbol} results:`);
        // console.log("OrderPosition Status", this.status);
        // console.log("OrderPosition Performance:", this.calculatePerformance());

        this.performance = this.calculatePerformance();

        return this;
    }

    private calculatePerformance(): number {
        if (this.status === "cancelled") {
            return 0;
        }
        if (this.buyCandle) { // status "active" | "target" | "stop"
            const sellPrice = this.exitCandle ? this.averagePrice(this.exitCandle) : this.averagePrice(this.series[this.series.length - 1]);
            return sellPrice / this.averagePrice(this.buyCandle) - 1;
        }
        throw new Error(
            `Status: ${this.status} (Error: Sollte nicht vorkommen! Status muss am Ende immer 'cancelled' 'stop' oder 'target' sein.`,
        );
    }

    private averagePrice(dailyCandle: DailyCandle): number {
        return (Number(dailyCandle.o) + Number(dailyCandle.c) + Number(dailyCandle.h) + Number(dailyCandle.l)) / 4;
    }
}
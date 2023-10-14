import { useState } from "react";
import { Layout } from "./components/Layout";
import { SeriesChart } from "./components/SeriesChart";
import { SeriesForm } from "./components/SeriesForm";
import { Signals } from "./components/Signals";
import styles from "./App.module.css";
import { SignalsList } from "./components/SignalsList";
import { type Signal } from "./context/SeriesContext";
import { useTradingDays } from "./lib/hooks/useTradingDays";
import { BacktestChart } from "./components/Backtest";

function App() {
  const tradingDays = useTradingDays();
  const [latestSignals, setLatestSignals] = useState<Signal[]>([]);
  const handleFetchSignals = async (date?: string) => {
    if (typeof date !== "string" || !date.split("-")[0]?.startsWith("202")) return;
    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/signals?date=${date}`);
    if (response.status === 400) {
      return;
    } else if (response.status === 404) {
      return;
    }
    const data = await response.json();
    setLatestSignals(data);
  }

  return (
    <Layout>
      <main className={styles.main}>
        <section className={styles.chart}>
          <SeriesChart />
          <BacktestChart />
        </section>
        <section className={styles.sidebar}>
          <h2>Symbol Lookup</h2>
          <SeriesForm />
          <Signals />

          <section>
          {/* Not Clean: Must be refactored */}
          <h2>Latest Signals</h2>
          <pre>{JSON.stringify(tradingDays.latest, null, 2)}</pre>
          <button onClick={() => handleFetchSignals(tradingDays.latest)}>Display Latest Signals</button>
          <SignalsList signals={latestSignals} type="date" />
        </section>
        </section>
      </main>
    </Layout>
  )
}

export default App

import { Layout } from "./components/Layout";
import { BacktestChart } from "./components/BacktestChart";
import { SeriesChart } from "./components/SeriesChart";
import styled from "@emotion/styled";
// import { type Signal } from "./context/SeriesContext";
// import { Signals } from "./components/Signals";
// import { SignalsList } from "./components/SignalsList";
// import { useState } from "react";
// import { useTradingDays } from "./lib/hooks/useTradingDays";
// import styles from "./App.module.css";

const ChartContainer = styled.div({
  paddingLeft: "6px",
  paddingRight: "6px",
})

function App() {
  // const tradingDays = useTradingDays();
  // const [latestSignals, setLatestSignals] = useState<Signal[]>([]);
  // const handleFetchSignals = async (date?: string) => {
  //   if (typeof date !== "string" || !date.split("-")[0]?.startsWith("202")) return;
  //   const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/signals?date=${date}`);
  //   if (response.status === 400) {
  //     return;
  //   } else if (response.status === 404) {
  //     return;
  //   }
  //   const data = await response.json();
  //   setLatestSignals(data);
  // }

  return (
    <Layout>
      <main>
        <ChartContainer>
          <SeriesChart width={window.innerWidth - 24} height={window.innerHeight * 0.65} />
        </ChartContainer>
        <BacktestChart width={window.innerWidth - 24} height={window.innerHeight * 0.3} />

        {/* <h2>Latest Signals</h2>
          <pre>{JSON.stringify(tradingDays.latest, null, 2)}</pre>
          <button onClick={() => handleFetchSignals(tradingDays.latest)}>Display Latest Signals</button>
          <SignalsList signals={latestSignals} type="date" /> */}
      </main>
    </Layout>
  )
}

export default App

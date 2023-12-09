import { Layout } from "./components/Layout";
import { BacktestChart } from "./components/BacktestChart";
import { SeriesChart } from "./components/SeriesChart";
import { Signals } from "./components/Signals.tsx";
import { useScreen } from "./lib/hooks/useScreen";
import styled from "@emotion/styled";

const ChartContainer = styled.div({
  paddingLeft: "6px",
  paddingRight: "6px",
})

function App() {
  const { screenWidth } = useScreen();

  return (
    <Layout>
      <main>
        <ChartContainer>
          <SeriesChart width={screenWidth - 24} height={window.innerHeight * 0.65} />
        </ChartContainer>
        <BacktestChart width={screenWidth - 24} height={window.innerHeight * 0.3} />
        <Signals screenWidth={screenWidth} />
      </main>
    </Layout>
  )
}

export default App

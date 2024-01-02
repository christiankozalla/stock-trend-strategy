import { Layout } from "./components/Layout.tsx";
import { BacktestChart } from "./components/BacktestChart.tsx";
import { SeriesChart } from "./components/SeriesChart.tsx";
import { Signals } from "./components/Signals.tsx";
import { useScreen } from "./lib/hooks/useScreen.ts";
import styled from "@emotion/styled";
import { AuthProvider } from "./context/AuthContext.tsx";

const ChartContainer = styled.div({
  paddingLeft: "6px",
  paddingRight: "6px",
})

function App() {
  const { screenWidth } = useScreen();


  return (
    <AuthProvider>
      <Layout>
        <main>
          <ChartContainer>
            <SeriesChart width={screenWidth - 24} height={window.innerHeight * 0.65} />
          </ChartContainer>
          <BacktestChart width={screenWidth - 24} height={window.innerHeight * 0.3} />
          <Signals screenWidth={screenWidth} />
        </main>
      </Layout>
    </AuthProvider>
  )
}

export default App

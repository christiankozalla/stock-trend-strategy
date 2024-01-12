import { Layout } from "./components/Layout.tsx";
import { BacktestChart } from "./components/BacktestChart.tsx";
import { SeriesChart } from "./components/SeriesChart.tsx";
import { Signals } from "./components/Signals.tsx";
import { useScreen } from "./lib/hooks/useScreen.ts";
import { AuthProvider } from "./context/AuthContext.tsx";

function App() {
  const { screenWidth } = useScreen();

  return (
    <AuthProvider>
      <Layout>
        <main>
          <div style={{ padding: "0 6px" }}>
            <SeriesChart width={screenWidth - 24} height={window.innerHeight * 0.65} />
          </div>
          <BacktestChart width={screenWidth - 24} height={window.innerHeight * 0.3} />
          <Signals screenWidth={screenWidth} />
        </main>
      </Layout>
    </AuthProvider>
  )
}

export default App

import React from "react";
import { Layout } from "./components/Layout";
import { SeriesChart } from "./components/SeriesChart";
import { SeriesForm } from "./components/SeriesForm";
import { Signals } from "./components/Signals";
import styles from "./App.module.css";
function App() {

  return (
    <Layout>
      <main className={styles.main}>
        <section className={styles.chart}>
          <SeriesChart />
        </section>
        <section className={styles.sidebar}>
          <h2>Symbol Lookup</h2>
          <SeriesForm />
          <Signals />
        </section>
      </main>
    </Layout>
  )
}

export default App

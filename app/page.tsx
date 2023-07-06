import { SeriesChart } from "@/components/SeriesChart";
import { SeriesForm } from "@/components/SeriesForm";
import { Signals } from "@/components/Signals";
import styles from "./page.module.css";

export default function Home() {

  return (
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
  );
}

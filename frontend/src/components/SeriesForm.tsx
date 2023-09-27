"use client";
import { ChangeEventHandler, useState, useContext } from "react";
import { SeriesContext } from "../context/SeriesContext";
import { debounce } from "../lib/utils.ts";
import styles from "./css/SeriesForm.module.css";

export function SeriesForm() {
  const { setSeries } = useContext(SeriesContext);
  const [error, setError] = useState("");

  const submitSymbol: ChangeEventHandler<HTMLInputElement> = async (e) => {
    const symbol = e.target.value;
    if (!symbol) {
      return setError("");
    }
    const [seriesRes, signalsRes] = await Promise.allSettled([fetch(`${import.meta.env.VITE_BACKEND_URL}/api/symbols/${symbol.toUpperCase()}.json`), fetch(`${import.meta.env.VITE_BACKEND_URL}/api/signals/${symbol}`)]);

    if (seriesRes.status === 'fulfilled') {
      if (seriesRes.value.status === 200) {
        setError("");
        
        const data = await seriesRes.value.json();
        const signals = signalsRes.status === 'fulfilled' ? await signalsRes.value.json() : [];

        setSeries({ symbol, data, signals });
      } else if (seriesRes.value.status === 404) {
        setError(seriesRes.value.statusText);
      } else {
        setError("");
      }
    } else {
      setError("Service Error. Please try again later.")
    }


  };

  return (
    <section>
      <input
        className={styles.uppercase}
        type="text"
        name="symbol"
        placeholder="Symbol"
        onChange={debounce(submitSymbol, 300)}
      />
      <span>{error}</span>
    </section>
  );
}

"use client";
import { ChangeEventHandler, useState, useContext } from "react";
import { SeriesContext } from "@/context/SeriesContext";
import { debounce } from "@/lib/utils";
import styles from "./css/SeriesForm.module.css";

export function SeriesForm() {
  const { setSeries } = useContext(SeriesContext);
  const [error, setError] = useState("");

  const submitSymbol: ChangeEventHandler<HTMLInputElement> = async (e) => {
    const symbol = e.target.value;
    if (!symbol) {
      return setError("");
    }
    const response = await fetch(`api/symbols/${symbol}`);
    if (response.status === 200) {
      setError("");
      const data = JSON.parse(await response.json());
      setSeries({ symbol, data });
    } else if (response.status === 404) {
      setError(response.statusText);
    } else {
      setError("");
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

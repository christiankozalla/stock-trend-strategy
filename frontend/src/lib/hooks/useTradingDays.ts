import { useEffect, useState } from "react";

export function useTradingDays() {
  const [tradingDays, setTradingDays] = useState<string[]>([]);

  useEffect(() => {
    try {
      fetch(`${import.meta.env.VITE_BACKEND_URL}/api/trading-days`)
        .then((res) => res.json(), (err) => console.error("Network error:\n", err))
        .then((data) => setTradingDays(data));
    } catch (err) {
      console.error("Error fetching trading days:\n", err);
    }
  }, []);

  return {
    latest: tradingDays[0],
  };
}

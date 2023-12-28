import { useEffect, useState } from "react";
export function useTradingDays() {
  const [tradingDays, setTradingDays] = useState<string[]>([]);

  useEffect(() => {
    fetch(`/api/trading-days`)
      .then((res) => res.json())
      .then((data) => setTradingDays(data))
      .catch((e) => { console.log('Error fetching trading-days', e); });
  }, []);

  return {
    latestTradingDay: tradingDays[0],
  };
}

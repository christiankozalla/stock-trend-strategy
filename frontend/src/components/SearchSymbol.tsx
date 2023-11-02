import { SyntheticEvent, useContext } from "react";
import { SeriesContext } from "../context/SeriesContext";
import { Autocomplete } from "@mui/joy";
import symbols from "../../../app/worker/alpaca/symbols.json";

export function SearchSymbol() {
  const { setSeries } = useContext(SeriesContext);

  const submitSymbol = async (_event: SyntheticEvent, symbol: string | null) => {
    if (!symbol) {
      return;
    }
    const [seriesRes, signalsRes] = await Promise.allSettled([fetch(`${import.meta.env.VITE_BACKEND_URL}/api/symbols/${symbol.toUpperCase()}.json`), fetch(`${import.meta.env.VITE_BACKEND_URL}/api/signals/${symbol}`)]);

    if (seriesRes.status === 'fulfilled') {
      if (seriesRes.value.status === 200) {
        const data = await seriesRes.value.json();
        const signals = signalsRes.status === 'fulfilled' ? await signalsRes.value.json() : [];

        setSeries({ symbol, data, signals });
      } else if (seriesRes.value.status === 404) {
      }
    }
  };

  const filterOptions = (options: string[], { inputValue }: { inputValue: string }) => {
    const input = inputValue.toUpperCase();
    const extactMatch = options.find((o) => o === input);
    if (extactMatch) return [extactMatch];
    else return options.filter((o) => o.includes(input)).sort((a) => a.startsWith(input) ? -1 : 1);
  };

  return (
    <Autocomplete
      type="text"
      placeholder="Symbol e.g. AAPL"
      options={symbols}
      onChange={submitSymbol}
      size="sm"
      filterOptions={filterOptions}
      autoFocus
      sx={{ maxWidth: 300 }} />
  );
}

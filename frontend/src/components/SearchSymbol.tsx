import { type CSSProperties, SyntheticEvent, useContext } from "react";
import { SeriesContext } from "../context/SeriesContext";
import { AuthContext } from "../context/AuthContext";
import { useFetch } from "../lib/hooks/useFetch";
import { AutoComplete } from "primereact/autocomplete";
import symbols from "../../../app/worker/alpaca/symbols.json";

export function SearchSymbol({ style }: { style: CSSProperties }) {
  const { setSeries } = useContext(SeriesContext);
  const authContext = useContext(AuthContext);
  const { fetch } = useFetch(authContext);

  const submitSymbol = async (_event: SyntheticEvent, symbol: string | null) => {
    if (!symbol) {
      return;
    }
    const [seriesRes, signalsRes] = await Promise.allSettled([fetch(`/api/symbols/${symbol.toUpperCase()}.json`), fetch(`/api/signals/${symbol}`)]);

    if (seriesRes.status === 'fulfilled') {
      if (seriesRes.value?.status === 200) {
        const data = await seriesRes.value.json();
        const signals = signalsRes.status === 'fulfilled' ? await signalsRes.value?.json() : [];

        setSeries({ symbol, data, signals });
      } else if (seriesRes.value?.status === 404) {
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
    <AutoComplete
      type="text"
      placeholder="Symbol e.g. AAPL"
      suggestions={symbols}
      onChange={submitSymbol}
      filterOptions={filterOptions}
      autoFocus
      style={style}
      sx={{ maxWidth: 300 }} />
  );
}

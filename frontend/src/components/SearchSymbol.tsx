import { type CSSProperties, useContext, useState } from "react";
import { SeriesContext } from "../context/SeriesContext";
import { AuthContext } from "../context/AuthContext";
import { useFetch } from "../lib/hooks/useFetch";
import { AutoComplete } from "primereact/autocomplete";
import symbols from "../../../app/worker/alpaca/symbols.json";

export function SearchSymbol({ style }: { style: CSSProperties }) {
  const { setSeries } = useContext(SeriesContext);
  const authContext = useContext(AuthContext);
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const [suggestedSymbols, setSuggestedSymbols] = useState<string[]>([]);
  const { fetch } = useFetch(authContext);

  const submitSymbol = async (symbol: string | null) => {
    if (!symbol) {
      return;
    }

    const [seriesRes, signalsRes] = await Promise.allSettled([
      fetch(`/api/symbols/${symbol.toUpperCase()}.json`),
      fetch(`/api/signals/${symbol}`),
    ]);

    if (seriesRes.status === 'fulfilled') {
      if (seriesRes.value?.status === 200) {
        const data = await seriesRes.value.json();
        const signals = signalsRes.status === 'fulfilled' ? await signalsRes.value?.json() : [];

        setSeries({ symbol, data, signals });
      } else if (seriesRes.value?.status === 404) {
        // Handle not found
      }
    }
  };

  return (<AutoComplete
    value={selectedSymbol}
    onChange={(e) => setSelectedSymbol(e.value)}
    suggestions={suggestedSymbols}
    completeMethod={(event) => {
      const input = event.query.toUpperCase();
      const exactMatch = symbols.find((o) => o === input);

      if (exactMatch) setSuggestedSymbols([exactMatch]);
      else
        setSuggestedSymbols(symbols
          .filter((o) => o.includes(input))
          .sort((a, b) => (a.startsWith(input) ? -1 : b.startsWith(input) ? 1 : 0)));
    }}
    onSelect={(e) => submitSymbol(e.value)}
    placeholder="Symbol e.g. AAPL"
    autoFocus
    style={style}
  />);
}

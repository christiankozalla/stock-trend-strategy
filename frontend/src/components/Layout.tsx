import { type ReactNode } from "react";
import "./css/Layout.css";
import { Stack } from "@mui/joy";
import { SeriesProvider } from "../context/SeriesContext.tsx";
import { SearchSymbol } from "./SearchSymbol.tsx";
import { Signals } from "./Signals.tsx";
import { css } from "@emotion/react"
import { mq } from "./css/breakpoints.ts"

const headerStyles = css({
  paddingLeft: "6px",
  paddingRight: "6px",
  ...mq({ max: "420px" })({
    h1: {
      fontSize: "10px",
      lineHeight: "2.4"
    }
  })
});


export function Layout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <SeriesProvider>
      <header css={headerStyles}>
        <Stack direction="row" spacing={2} sx={{ my: 1 }} useFlexGap>
          <h1>StockTrends</h1>
          <SearchSymbol />
        </Stack>
      </header>
      {children}
      <Signals />
    </SeriesProvider>
  );
}

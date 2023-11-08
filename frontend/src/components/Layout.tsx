import { type ReactNode } from "react";
import "./css/Layout.css";
import { Stack, Link, Button } from "@mui/joy";
import { Link as RouterLink } from 'react-router-dom';
import { SeriesProvider } from "../context/SeriesContext.tsx";
import { SearchSymbol } from "./SearchSymbol.tsx";
import { Signals } from "./Signals.tsx";
import { css } from "@emotion/react"
import { mq } from "./css/breakpoints.ts"

const headerStyles = css({
  padding: "0 12px",
  ...mq({ max: "640px" })({
    padding: "0 6px",
    h1: {
      display: "block",
      height: "min-content",
      fontSize: "12px",
      margin: "auto"
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
          <Button variant="solid" sx={{ marginLeft: "auto" }}>
            <RouterLink to="/sign-up">Sign Up</RouterLink>
          </Button>
          <Button variant="outlined">
            <RouterLink to="/log-in">Log In</RouterLink>
          </Button>
        </Stack>
      </header>
      {children}
      <Signals />
    </SeriesProvider>
  );
}

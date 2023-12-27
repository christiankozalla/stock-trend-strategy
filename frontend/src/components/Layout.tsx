import { type ReactNode } from "react";
import "./css/Layout.css";
import { Button } from "@mui/joy";
import { Link as RouterLink } from 'react-router-dom';
import { SeriesProvider } from "../context/SeriesContext.tsx";
import { SearchSymbol } from "./SearchSymbol.tsx";
import { css } from "@emotion/react"
import { mq } from "./css/breakpoints.ts"
import { AuthProvider } from "../context/AuthContext.tsx";

const headerStyles = css({
  display: "flex",
  padding: "0 12px",
  margin: "6px 0 ",
  gap: "12px",
  ...mq({ max: "640px" })({
    display: "grid",
    gridTemplateRows: "auto 36px",
    gridTemplateColumns: "44vw  28vw 28vw",
    gridTemplateAreas: "'headline headline headline' 'search sign-up log-in'",
    padding: "0 6px",
    gap: "6px",
    h1: {
      gridArea: "headline",
      display: "block",
      height: "min-content",
      fontSize: "12px",
      width: "100vw"
    }
  })
});

const buttonStyles = css({
  ...mq({ max: "640px" })({ maxWidth: "100px" }),
});

export function Layout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <AuthProvider>
      <SeriesProvider>
        <header css={headerStyles}>
          <h1>StockTrends</h1>
          <SearchSymbol style={{ gridArea: "search" }} />
          <Button style={{ gridArea: "sign-up" }} css={{
            ...buttonStyles, ...css({
              ...mq({ min: "641px" })({ marginLeft: "auto" })
            })
          }} variant="solid">
            <RouterLink to="/sign-up">Sign Up</RouterLink>
          </Button>
          <Button style={{ gridArea: "log-in" }} css={buttonStyles} variant="outlined">
            <RouterLink to="/log-in">Log In</RouterLink>
          </Button>
        </header>
        {children}
      </SeriesProvider>
    </AuthProvider>
  );
}

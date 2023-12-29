import { type ReactNode, useContext, useEffect } from "react";
import "./css/Layout.css";
import { Button } from "@mui/joy";
import { Link as RouterLink } from 'react-router-dom';
import { SeriesProvider } from "../context/SeriesContext.tsx";
import { SearchSymbol } from "./SearchSymbol.tsx";
import { css } from "@emotion/react";
import { mq } from "./css/breakpoints.ts";
import { AuthContext } from "../context/AuthContext.tsx";
import { useFetch } from "../lib/hooks/useFetch.ts";

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
  const authContext = useContext(AuthContext);
  const { fetch } = useFetch(authContext);

  useEffect(() => {
    console.log("Trying to authenticate with refresh-token");
    console.log("auth", authContext);
    fetch("/api/secured") // fetch wrapper shadowing globalThis.fetch
      .then((res) => console.log("[Layout] Auth by Refresh Token Cookie: ", res))
      .catch((e) => console.error("[Layout] Auth by Refresh Token Cookie:", e));
  }, []);

  return (
    <SeriesProvider>
      <header css={headerStyles}>
        <h1>StockTrends</h1>
        <SearchSymbol style={{ gridArea: "search" }} />
        {authContext?.auth && authContext.auth?.hasAccessToken()
          ? <div style={{ margin: "6px 12px 6px auto" }}>Hello {authContext.auth.getUsername()}</div>
          : (
            <>
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
            </>
          )}
      </header>
      {children}
    </SeriesProvider>
  );
}

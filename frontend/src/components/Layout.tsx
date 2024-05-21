import { type ReactNode, useContext, useEffect } from "react";
import styles from "./css/Layout.module.css";
import { Button } from "primereact/button";
import { Link as RouterLink } from 'react-router-dom';
import { SeriesProvider } from "../context/SeriesContext.tsx";
import { SearchSymbol } from "./SearchSymbol.tsx";
import { AuthContext } from "../context/AuthContext.tsx";
import { useFetch } from "../lib/hooks/useFetch.ts";

export function Layout({
  children,
}: {
  children: ReactNode;
}) {
  const authContext = useContext(AuthContext);
  const { fetchNewAccessToken } = useFetch(authContext);

  useEffect(() => {
    console.log("Trying to authenticate with refresh-token");
    console.log("auth", authContext);
    fetchNewAccessToken()
      .then((res) => console.log("[Layout] Auth by Refresh Token Cookie: ", res))
      .catch((e) => console.error("[Layout] Auth by Refresh Token Cookie:", e));
  }, [authContext, fetchNewAccessToken]);

  return (
    <SeriesProvider>
      <header className={styles.header}>
        <h1>StockTrends</h1>
        <SearchSymbol style={{ gridArea: "search" }} />
        {authContext?.auth && authContext.auth?.hasAccessToken
          ? <div style={{ margin: "6px 12px 6px auto" }}>Hello {authContext.auth.username}</div>
          : (
            <>
              <Button style={{ gridArea: "sign-up" }} className={[styles.button, styles.leftButton].join(" ")}>
                <RouterLink to="/sign-up">Sign Up</RouterLink>
              </Button>
              <Button style={{ gridArea: "log-in" }} className={styles.button} outlined>
                <RouterLink to="/log-in">Log In</RouterLink>
              </Button>
            </>
          )}
      </header>
      {children}
    </SeriesProvider>
  );
}

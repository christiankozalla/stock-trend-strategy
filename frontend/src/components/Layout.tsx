import { type ReactNode } from "react";
import "./css/Layout.css";
import { Stack } from "@mui/joy";
import { SeriesProvider } from "../context/SeriesContext.tsx";
import { SearchSymbol } from "./SearchSymbol.tsx";
import styled from "@emotion/styled";

const Header = styled.header({
  paddingLeft: "6px",
  paddingRight: "6px",
});


export function Layout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <SeriesProvider>
      <Header>
        <Stack direction="row" spacing={2} sx={{ my: 1 }} useFlexGap>
          <h1>StockTrends</h1>
          <SearchSymbol />
        </Stack>
      </Header>
      {children}
    </SeriesProvider>
  );
}

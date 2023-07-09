import { type ReactNode } from "react";
import "./css/Layout.css";
import { SeriesProvider } from "../context/SeriesContext.tsx";


export function Layout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <SeriesProvider>
      {children}
    </SeriesProvider>
  );
}

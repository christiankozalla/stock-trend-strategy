import "./globals.css";
import { Inter } from "next/font/google";
import { SeriesProvider } from "@/context/SeriesContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Signals",
  description: "Scan Stocks for Trading Signals based on Elder",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={inter.className}>
        <SeriesProvider>
          {children}
        </SeriesProvider>
      </body>
    </html >
  );
}

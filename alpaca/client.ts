import 'dotenv/config';

const barsExample = {
  "bars": [{
    "t": "2021-06-01T04:00:00Z",
    "o": 229.44,
    "h": 230.08,
    "l": 226.28,
    "c": 226.63,
    "v": 5091507,
    "n": 79254,
    "vw": 227.377007,
  }],
  "symbol": "V",
  "next_page_token": "VnxEfDIwMjEtMDYtMDFUMDQ6MDA6MDAuMDAwMDAwMDAwWg==",
};

export type AlpacaBarsResponse = typeof barsExample;

if (
  process.env.ALPACA_SANDBOX_KEY === undefined ||
  process.env.ALPACA_SANDBOX_SECRET === undefined
) {
  throw new Error(
    "Please set ALPACA_SANDBOX_KEY and/or ALPACA_SANDBOX_SECRET as environment variable.",
  );
}

const alpacaAuthHeader = {
  Authorization: "Basic " +
    Buffer.from(
      `${process.env.ALPACA_SANDBOX_KEY}:${process.env.ALPACA_SANDBOX_SECRET}`,
    ).toString("base64"),
};

const START_DATE = "2022-01-01";

export const alpaca = {
  async series(
    symbol: string,
  ): Promise<AlpacaBarsResponse | undefined> {
    try {
      const url =
        `https://data.sandbox.alpaca.markets/v2/stocks/${symbol}/bars?start=${START_DATE}&timeframe=1D&adjustment=all&feed=iex&currency=USD`;
      const response = await fetch(url, {
        headers: {
          ...alpacaAuthHeader,
          accept: "application/json",
        },
      });
      if (response.status === 200) {
        const json: AlpacaBarsResponse = await response.json();
        return json;
      } else {
        throw new Error(
          `API responded with non-200 status code: ${response.status}`,
        );
      }
    } catch (e) {
      console.error("Error Alpaca Client 'alpaca.series': ", e);
    }
  },
};

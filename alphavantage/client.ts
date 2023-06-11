const ALPHAVANTAGE_API_KEY = process.env.ALPHAVANTAGE_API_KEY;

type AVSeries =
  | "TIME_SERIES_DAILY_ADJUSTED"
  | "TIME_SERIES_WEEKLY_ADJUSTED";

type PeriodData = {
  "1. open": string;
  "2. high": string;
  "3. low": string;
  "4. close": string;
  "5. adjusted close": string;
  "6. volume": string;
  "7. dividend amount": string;
};

type AVMetaData = {
  "1. Information": string;
  "2. Symbol": string;
  "3. Last Refreshed": string;
  "5. Time Zone": string;
};

export type AVSeriesResponse = {
  "TIME_SERIES_DAILY_ADJUSTED": {
    "Meta Data": AVMetaData & {
      "4. Output Size": string;
    };
    "Time Series (Daily)": {
      [date: string]: PeriodData;
    };
  };
  "TIME_SERIES_WEEKLY_ADJUSTED": {
    "Meta Data": AVMetaData;
    "Weekly Adjusted Time Series": {
      [date: string]: PeriodData & {
        "8. split coefficient": string;
      };
    };
  };
};

type AVIndicators = "SMA" | "EMA" | "MACD" | "RSI";

type SMAResponse = {
  "Meta Data": AVMetaData;
  "Technical Analysis: SMA": {
    [date: string]: {
      "SMA": string;
    };
  };
};

type EMAResponse = {
  "Meta Data": AVMetaData;
  "Technical Analysis: EMA": {
    [date: string]: {
      "EMA": string;
    };
  };
};

type MACDResponse = {
  "Meta Data": AVMetaData;
  "Technical Analysis: MACD": {
    [date: string]: {
      "MACD": string;
      "MACD_Hist": string;
      "MACD_Signal": string;
    };
  };
};

const rsiKey = "Technical Analysis: RSI";

export type RSIBasis = {
  [date: string]: {
    RSI: number;
    SMA: number;
  };
};

export type RSIResponse = {
  "Meta Data": AVMetaData;
  [rsiKey]: RSIBasis;
};

function isDailySeries(
  input: AVSeriesResponse[AVSeries],
): input is AVSeriesResponse["TIME_SERIES_DAILY_ADJUSTED"] {
  return "Time Series (Daily)" in input;
}

type CalculateRSIParams = {
  period: number;
};

function sum(...summands: number[]) {
  return summands.reduce((sum, summand) => sum + Math.abs(summand), 0);
}

// Calculate RSI
// Usage:
// import { alphavantage } from '../alphavantage/client';
// const rsi = await alphavantage.indicators.get("AAPL", { indicator: 'RSI' })
const calculate = {
  rsi<T extends AVSeries>(
    input: AVSeriesResponse[T],
    {
      period = 14,
    }: CalculateRSIParams,
  ): RSIResponse {
    let entries;
    const result: RSIResponse = {
      "Meta Data": input["Meta Data"],
      [rsiKey]: {},
    };
    if (isDailySeries(input)) {
      entries = Object.entries(input["Time Series (Daily)"]);
    } else {
      entries = Object.entries(input["Weekly Adjusted Time Series"]);
    }
    const differences = [];
    const pastRSIs = [];
    let prevRSUp;
    let prevRSDown;
    for (let n = entries.length - 2; n >= 0; n--) {
      const [_date, data] = entries[n];
      const { "4. close": close } = data;
      const previous = entries[n + 1];
      const { "4. close": previousClose } = previous[1];
      const difference = Number(close) - Number(previousClose);
      differences.push(difference);
      if (differences.length > period) {
        throw new Error("Error: Differences array is too long");
      } else if (differences.length < period) {
        // Fill up differences array with period length
        continue;
      } else {
        const gains = differences.filter((d) => d >= 0);
        const losses = differences.filter((d) => d < 0);
        if (gains.length + losses.length !== period) {
          console.log("WRONG SUM", gains.length + losses.length);
        }
        const gain = difference > 0 ? difference : 0;
        const loss = difference < 0 ? Math.abs(difference) : 0;
        const RSUp: number = prevRSUp
          ? ((prevRSUp * (period - 1) + gain) / period)
          : sum(...gains) / gains.length;
        const RSDown: number = prevRSDown
          ? ((prevRSDown * (period - 1) + loss) / period)
          : sum(...losses) / losses.length;

        prevRSUp = RSUp;
        prevRSDown = RSDown;

        const RS = RSUp / RSDown;
        const RSI = 100 - (100 / (1 + RS));
        const [date, _] = entries[n];

        pastRSIs.push(RSI);
        differences.shift();
        if (pastRSIs.length === period) {
          const SMA = pastRSIs.reduce((sum, summand) => sum + summand, 0) /
            period;
          result[rsiKey][date] = { RSI, SMA };
          pastRSIs.shift();
        } else {
          // Fill up pastRSIs array with period length
          continue;
        }
      }
    }
    return result;
  },
};

type AVIndicatorsResponse = {
  "SMA": SMAResponse;
  "EMA": EMAResponse;
  "MACD": MACDResponse;
  "RSI": RSIResponse;
};

type AVErrorResponse = {
  Note:
    "Thank you for using Alpha Vantage! Our standard API call frequency is 5 calls per minute and 500 calls per day. Please visit https://www.alphavantage.co/premium/ if you would like to target a higher API call frequency.";
};

function isAVErrorResponse(json: any): json is AVErrorResponse {
  return "Note" in json;
}

export const alphavantage = {
  async series<T extends AVSeries>(
    symbol: string,
    series: T,
  ): Promise<AVSeriesResponse[T] | undefined> {
    try {
      const url =
        `https://www.alphavantage.co/query?function=${series}&symbol=${symbol}&apikey=${ALPHAVANTAGE_API_KEY}`;
      const response = await fetch(url);
      const json: AVSeriesResponse[T] | AVErrorResponse = await response.json();
      if (isAVErrorResponse(json)) return;
      return json;
    } catch (e) {
      console.error("Error AlphaVantage Client 'alphavantage.series': ", e);
    }
  },
  indicators: {
    async get<T extends AVIndicators>(
      symbol: string,
      { indicator, period = 14, interval = "daily" }: {
        indicator: T;
        period?: number;
        interval?: "daily" | "weekly";
      },
    ): Promise<AVIndicatorsResponse[T] | undefined> {
      if (indicator === "RSI") {
        try {
          const seriesData = await alphavantage.series(
            symbol,
            interval === "daily"
              ? "TIME_SERIES_DAILY_ADJUSTED"
              : "TIME_SERIES_WEEKLY_ADJUSTED",
          );
          if (!seriesData) return;
          return calculate.rsi(seriesData, {
            period,
          }) as AVIndicatorsResponse[T];
        } catch (e) {
          console.error("Error AlphaVantage Client 'indicators.get': ", e);
        }
      } else {
        try {
          const url = new URL(
            `https://www.alphavantage.co/query?function=${indicator}&symbol=${symbol}&interval=${interval}&time_period=${period}&series_type=close&apikey=${ALPHAVANTAGE_API_KEY}`,
          );

          if (indicator === "MACD") {
            // set default values explicitly
            url.searchParams.set("fastperiod", "12");
            url.searchParams.set("slowperiod", "26");
            url.searchParams.set("signalperiod", "9");

            url.searchParams.delete("time_period");
          }

          const response = await fetch(url);
          const json: AVIndicatorsResponse[T] | AVErrorResponse = await response
            .json();
          if (isAVErrorResponse(json)) return;
          return json;
        } catch (e) {
          console.error("Error AlphaVantage Client 'indicators.get': ", e);
        }
      }
    },
  },
};

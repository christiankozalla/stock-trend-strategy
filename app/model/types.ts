export type Signal = {
  id: number;
  symbol: string;
  date: string;
  open: number;
  stop: number;
};

export type Backtest = {
  id: number;
  symbol: string;
  signalId: number;
  performance: number;
  riskRewardRatio: number;
  status: "open" | "active" | "cancelled" | "target" | "stop";
};
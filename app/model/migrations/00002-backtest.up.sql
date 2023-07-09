CREATE TABLE IF NOT EXISTS backtest (
    id              INTEGER PRIMARY KEY,
    symbol          TEXT NOT NULL,
    signalId        INTEGER NOT NULL REFERENCES signals(id),
    performance     REAL NOT NULL,
    riskRewardRatio REAL NOT NULL,
    status          TEXT NOT NULL -- "active" | "cancelled" | "target" | "stop"
);
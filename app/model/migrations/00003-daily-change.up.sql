CREATE TABLE IF NOT EXISTS daily_change (
    id INTEGER PRIMARY KEY,
    date DATE NOT NULL,
    symbol TEXT NOT NULL,
    open REAL NOT NULL,
    close REAL NOT NULL,
    previousClose REAL NOT NULL,
    UNIQUE (symbol, date) ON CONFLICT IGNORE
);

CREATE INDEX IF NOT EXISTS idx_date ON daily_change(date);
CREATE INDEX IF NOT EXISTS idx_symbol ON daily_change(symbol);
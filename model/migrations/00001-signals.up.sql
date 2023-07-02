CREATE TABLE IF NOT EXISTS signals
(
    id          INTEGER PRIMARY KEY,
    symbol      TEXT NOT NULL,
    date        DATE NOT NULL,
    open        REAL NOT NULL,
    stop        REAL NOT NULL,
    UNIQUE (symbol, date) ON CONFLICT IGNORE
);

CREATE TABLE IF NOT EXISTS signals_alpaca
(
    id          INTEGER PRIMARY KEY,
    symbol      TEXT NOT NULL,
    date        DATE NOT NULL,
    open        REAL NOT NULL,
    stop        REAL NOT NULL,
    UNIQUE (symbol, date) ON CONFLICT IGNORE
);
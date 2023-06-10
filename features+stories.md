# Features & Stories

1. Data Feed - Daily OHLC + Volume data available via a REST API
1.1 Contraints - The Data Feed should satisfy the needs of the TradingView Chart component (self-hosted)
1.2 Persistence - The Data Feed should be updated before each trading session and persisted in files

2. Scan For Signals - Scanner Results - Specific Orders (Buy/Sell - Stop - Target)
2.1 Elder Strategy - Candle Colors (Red, Blue, Green) + How to propagate Elder Indicator to TradingView Chart (PineScript)
2.2 Persistence of Candle Colors (in a Database? or in Files?)
2.3 Algorithm for Specific Orders Output (Buy/Sell - Stop - Target Thresholds)
2.3 UI for Configuration & Displaying Scanner Results

3. User Authentication

4. Hosting + Continous Deployment
4.1 GitHub Actions + own VPS Server

Tech Stack
- Nextjs
- Alphavantage API (Stock Data Feed, persisted in files / SQLite)
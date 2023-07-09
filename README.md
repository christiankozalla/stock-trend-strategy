# Stock Trend Strategy

Part 1: Deno Server in `./app`

- Fetches daily stock data from Alpaca
- Calculates signals based on Elder Force Indicator
- Can run backtests on signals
- Exposes stock data (series) and signals as JSON via a REST API
- Authentication & Authorization

Part 2: React Frontend in `./frontend`

- Displays chart and signals with data from Deno Server

## Develop

A multi-root VSCode Workspace is configured, so that the Deno VSCode extension can be scoped to only the `./app` directory.

Open workspace with

```bash
code stock-trend-strategy.vscode-workspace
```
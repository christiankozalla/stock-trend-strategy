# Stock Trend Strategy

Part 1: Deno Worker + FastAPI Application in `./app`

- Deno Worker fetches daily stock data from Alpaca
- Calculates signals based on Elder Force Indicator
- Can run backtests on signals
- FastAPI exposes stock data (series) and signals as JSON via a REST API
- (Authentication & Authorization)

Part 2: React Frontend in `./frontend`

- Displays chart and signals with data served by FastAPI.

## Develop

A multi-root VSCode Workspace is configured, so that the Deno VSCode extension can be scoped to only the `./app` directory.

Open workspace with

```bash
code stock-trend-strategy.vscode-workspace
```
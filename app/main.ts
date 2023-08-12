import "std/dotenv/load.ts"; // load env vars from .env
import { Server } from "./routes/server.ts";
import { getSymbol } from "./routes/symbols.route.ts";
import { signalsByDate, signalsBySymbol } from "./routes/signals.route.ts";
import { tradingDays } from "./routes/trading-days.route.ts";
import { ServerAuth, type ServerAuthConfig } from "./routes/auth.route.ts";
import { dynamodbAdapter } from "./auth/db-adapter.ts";
import { emailProvider } from "./auth/email-provider.ts";

const server = new Server();

server.get(...getSymbol);

server.get(...signalsBySymbol);

server.get(...signalsByDate);

server.get(...tradingDays);

const authConfig: ServerAuthConfig = {
  prefix: "/api/auth",
  session: {
    strategy: "jwt",
  },
  adapter: dynamodbAdapter,
  providers: [
    emailProvider,
    //     Providers.GitHub({
    //       clientId: Deno.env.get("GITHUB_ID"),
    //       clientSecret: Deno.env.get("GITHUB_SECRET"),
    //     }),
  ],
};

const authHandler = ServerAuth(authConfig);

server.get("/api/auth/*", authHandler);
server.post("/api/auth/*", authHandler);

// server.use((req, next) => {
//   console.log("search req", req.search);
//   req.extraProp = "hey";
//   return next(); // new Response("From first middleware");
// });

server.listen(({ port, hostname }) => {
  console.log(`Running on ${hostname}:${port}`);
  if (Deno.env.get("PRODUCTION_BACKEND_URL")) {
    console.log(`Reverse proxy routes traffic from '${Deno.env.get("PRODUCTION_BACKEND_URL")}/api/*' to '${hostname}:${port}'`);
  }
});

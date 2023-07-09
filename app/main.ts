import "https://deno.land/std@0.193.0/dotenv/load.ts"; // load env vars from .env
import { Server } from "./server.ts";
import { getSymbol } from "./symbols.route.ts"
import { bySymbol, byDate } from "./signals.route.ts";

const server = new Server();

server.get(...getSymbol);

server.get(...bySymbol);

server.get(...byDate);

// server.use((req, next) => {
//   console.log("search req", req.search);
//   req.extraProp = "hey";
//   return next(); // new Response("From first middleware");
// });

server.listen(({ port, hostname }) => console.log(`Running on ${hostname}:${port}`));

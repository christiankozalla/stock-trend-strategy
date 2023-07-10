import "https://deno.land/std@0.193.0/dotenv/load.ts"; // load env vars from .env
import { Server } from "./server.ts";
import { getSymbol } from "./symbols.route.ts";
import { signalsByDate, signalsBySymbol } from "./signals.route.ts";
import { ServerAuth, type ServerAuthConfig } from "./auth.route.ts";
import CredentialsProvider from "npm:@auth/core/providers/credentials";

const server = new Server();

server.get(...getSymbol);

server.get(...signalsBySymbol);

server.get(...signalsByDate);

const authConfig: ServerAuthConfig = {
  prefix: "/api/auth",
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
        // The name to display on the sign in form (e.g. 'Sign in with...')
        name: 'Credentials',
        // The credentials is used to generate a suitable form on the sign in page.
        // You can specify whatever fields you are expecting to be submitted.
        // e.g. domain, username, password, 2FA token, etc.
        // You can pass any HTML attribute to the <input> tag through the object.
        credentials: {
          username: { label: "Username", type: "text", placeholder: "jsmith" },
          password: { label: "Password", type: "password" }
        },
        async authorize(credentials, req) {
            console.log("CREDENTIALS", credentials);
            console.log("authorize req", req);
          // You need to provide your own logic here that takes the credentials
          // submitted and returns either a object representing a user or value
          // that is false/null if the credentials are invalid.
          // e.g. return { id: 1, name: 'J Smith', email: 'jsmith@example.com' }
          // You can also use the `req` object to obtain additional parameters
          // (i.e., the request IP address)
          const res = await fetch("/your/endpoint", {
            method: 'POST',
            body: JSON.stringify(credentials),
            headers: { "Content-Type": "application/json" }
          })
          const user = await res.json()
    
          // If no error and we have user data, return it
          if (res.ok && user) {
            return user
          }
          // Return null if user data could not be retrieved
          return null
        }
      })
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

server.listen(({ port, hostname }) =>
  console.log(`Running on ${hostname}:${port}`)
);

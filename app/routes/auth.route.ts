import { Auth } from "npm:@auth/core";
import type { AuthAction, AuthConfig, Session } from "npm:@auth/core/types";
import { ServerResponse } from "./server.ts";

export interface ServerAuthConfig extends AuthConfig {
  /**
   * Defines the base path for the auth routes.
   * @default '/api/auth'
   */
  prefix?: string;
}

const actions: AuthAction[] = [
  "providers",
  "session",
  "csrf",
  "signin",
  "signout",
  "callback",
  "verify-request",
  "error",
];

function AuthHandler(prefix: string, authOptions: ServerAuthConfig) {
  return async (request: Request) => {
    const url = new URL(request.url);
    const action = url.pathname
      .slice(prefix.length + 1)
      .split("/")[0] as AuthAction;

    if (!actions.includes(action) || !url.pathname.startsWith(prefix + "/")) {
      return new ServerResponse(null, { status: 400 });
    }

    return await Auth(request, authOptions);
  };
}

export function ServerAuth(config: ServerAuthConfig) {
  const { prefix = "/api/auth", ...authOptions } = config;
  authOptions.secret ??= Deno.env.get("AUTH_SECRET");
  authOptions.trustHost ??= !!(
    Deno.env.get("AUTH_TRUST_HOST") ??
      Deno.env.get("VERCEL") ??
      Deno.env.get("DENO_ENV") !== "production"
  );
  const handler = AuthHandler(prefix, authOptions);
  return async function (request: Request) {
    return await handler(request);
  };
}

export type GetSessionResult = Promise<Session | null>;

export async function getSession(
  req: Request,
  options: AuthConfig,
): GetSessionResult {
  options.secret ??= Deno.env.get("AUTH_SECRET");
  options.trustHost ??= true;

  const url = new URL("/api/auth/session", req.url);
  const response = await Auth(
    new Request(url, { headers: req.headers }),
    options,
  );

  const { status = 200 } = response;

  const data = await response.json();

  if (!data || !Object.keys(data).length) return null;
  if (status === 200) return data;
  throw new Error(data.message);
}

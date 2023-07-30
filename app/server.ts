export class ServerResponse extends Response {
  constructor(body?: BodyInit | null, init?: ResponseInit) {
    super(body, init);
    this.headers.set("Content-Type", "application/json");
    this.headers.set(
      "Access-Control-Allow-Origin",
      Deno.env.get("PROD_FRONTEND_ORIGIN") ?? "*",
    );
  }
}

type HandlerResponse = ServerResponse | Promise<ServerResponse>;

interface Route {
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  handler: (
    req: RequestWithContext,
  ) => HandlerResponse;
  pattern: URLPattern;
}

interface Middleware {
  // path: string; middleware runs before all existing routes
  handler(
    req: RequestWithContext,
    next: () => true,
  ):
    | true
    | Promise<true>
    | ServerResponse
    | Promise<ServerResponse>
    | undefined
    | Promise<undefined>;
}

export interface RequestWithContext extends Request {
  params: Record<string, string | undefined>;
  search: URLSearchParams | Record<string, never>;
}
interface ServerOptions {
  port?: number;
  hostname?: string;
}
export class Server {
  port: number;
  hostname: string;
  baseUrl: string;
  routes: Record<Route["method"], Route[]> = {
    "GET": [],
    "POST": [],
    "PUT": [],
    "DELETE": [],
  };
  middleware: Middleware[] = [];
  constructor(options?: ServerOptions) {
    this.port = options?.port ||
      Number(Deno.env.get("SERVER_PORT")) || 3000;

    this.hostname = options?.hostname ?? "localhost";
    this.baseUrl = `http://${this.hostname}:${this.port}`;
  }
  get(
    path: string,
    handler: Route["handler"],
  ) {
    this.routes["GET"].push({
      method: "GET",
      path,
      handler,
      pattern: this.#urlPattern(path),
    });
    return this;
  }

  post(
    path: string,
    handler: Route["handler"],
  ) {
    this.routes["POST"].push({
      method: "POST",
      path,
      handler,
      pattern: this.#urlPattern(path),
    });
    return this;
  }

  use(handler: Middleware["handler"]) {
    this.middleware.push({
      handler,
    });
    return this;
  }

  #urlPattern(path: string) {
    return new URLPattern({
      pathname: path,
      baseURL: this.baseUrl,
      search: "*",
    }); // new URLPattern(path, this.baseUrl); //
  }

  #rootHandler() {
    return async (req: Request) => {
      if (req.method.toUpperCase() === "HEAD") return new ServerResponse(null);
      if (req.method.toUpperCase() === "OPTIONS") {
        return new ServerResponse(null, {
          status: 204,
          headers: { "Allow": "OPTIONS, GET, HEAD, POST" },
        });
      }

      // run middleware
      const middlewareReqContext = this.#withContext(
        req,
        this.#urlPattern("*").exec(req.url),
      );
      for (let j = 0; j < this.middleware.length; j++) {
        const result = await this.middleware[j].handler(
          middlewareReqContext,
          () => true,
        );
        if (result === true || result === undefined) continue;
        else return result; // return ServerResponse from middleware prematurely, prevent route matchers from running
      }

      // run a matching route handler
      let route: Route | undefined;
      let match: URLPatternResult | undefined | null;
      const matchingRoutes =
        this.routes[req.method.toUpperCase() as Route["method"]] ?? [];

      for (let i = 0; i < matchingRoutes.length; i++) {
        if (
          matchingRoutes[i].pattern.test(req.url)
        ) {
          route = matchingRoutes[i];
          match = matchingRoutes[i].pattern.exec(req.url);
          break;
        }
      }

      if (route) {
        const requestWithContext = this.#withContext(req, match);
        return route.handler(requestWithContext);
      }
      return new ServerResponse("Not found", {
        status: 404,
      });
    };
  }

  #withContext(
    req: Request,
    urlPatternResult?: URLPatternResult | null,
  ): RequestWithContext {
    const params = urlPatternResult?.pathname.groups || {};
    const search = urlPatternResult?.search.input
      ? new URLSearchParams(urlPatternResult.search.input)
      : {};
    return Object.assign(req, {
      params,
      search,
    });
  }

  listen(
    onListen?: ({ port, hostname }: { port: number; hostname: string }) => void,
  ) {
    return Deno.serve({
      onListen,
      port: this.port,
      hostname: this.hostname,
      handler: this.#rootHandler(),
    });
  }
}

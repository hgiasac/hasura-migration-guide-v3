const port = 4200;

const AuthorizationHeader = "Authorization";
const XHasuraAdminSecret = "x-hasura-admin-secret";
const XHasuraRole = "x-hasura-role";
const XHasuraUserId = "x-hasura-user-id";

const hello = async (req: Request): Promise<Response> => {
  if (req.method.toUpperCase() !== "POST") {
    return sendResponse(req, 405, "Method Not Allowed");
  }
  const body = await req.json();

  return sendResponse(req, 200, {
    reply: `hello ${body?.input?.name ?? "world"}`,
  });
};

const validateRequest = (req: Request): Response => {
  if (req.method.toUpperCase() !== "GET") {
    return sendResponse(req, 405, "Method Not Allowed");
  }

  if (req.headers.has(AuthorizationHeader)) {
    if (req.headers.get(AuthorizationHeader) !== `Bearer user1`) {
      return sendResponse(req, 401, "Unauthorized");
    }

    const body = JSON.stringify({
      [XHasuraRole]: "user",
      [XHasuraUserId]: "1",
    });

    return sendResponse(req, 200, body);
  }

  if (req.headers.has(XHasuraAdminSecret)) {
    if (
      req.headers.get(XHasuraAdminSecret) !==
      Deno.env.get("HASURA_GRAPHQL_ADMIN_SECRET")
    ) {
      return sendResponse(req, 401, "Unauthorized");
    }

    const body = JSON.stringify({
      [XHasuraRole]: "admin",
    });

    return sendResponse(req, 200, body);
  }

  return sendResponse(req, 200, {
    [XHasuraRole]: "anonymous",
  });
};

const ROUTES: Array<
  [URLPattern, (req: Request) => Response | Promise<Response>]
> = [
  [
    new URLPattern({
      pathname: "/validate-request",
    }),
    validateRequest,
  ],
  [
    new URLPattern({
      pathname: "/hello",
    }),
    hello,
  ],
];

const handler = (req: Request): Response | Promise<Response> => {
  for (const [pattern, handler] of ROUTES) {
    if (pattern.test(req.url)) {
      return handler(req);
    }
  }
  return sendResponse(req, 404, "Not Found");
};

const sendResponse = (
  req: Request,
  status: number,
  body: unknown
): Response => {
  console.log(
    `[${req.method.toUpperCase()}] ${
      req.url
    } status=${status} response=${JSON.stringify(body)}`
  );

  return new Response(JSON.stringify(body), {
    status: status,
    headers: {
      "Content-Type": "application/json",
    },
  });
};

console.log(`HTTP server running. Access it at: http://localhost:4200/`);
Deno.serve({ port }, handler);

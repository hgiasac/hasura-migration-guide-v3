const port = 4200;

const AuthorizationHeader = "Authorization";
const XHasuraAdminSecret = "x-hasura-admin-secret";
const XHasuraRole = "x-hasura-role";
const XHasuraUserId = "x-hasura-user-id";

const handler = (req: Request): Response => {
  if (req.headers.has(AuthorizationHeader)) {
    if (req.headers.get(AuthorizationHeader) !== `Bearer user1`) {
      return new Response("unauthorized", {
        status: 401,
      });
    }

    const body = JSON.stringify({
      [XHasuraRole]: "user",
      [XHasuraUserId]: "1",
    });

    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  if (req.headers.has(XHasuraAdminSecret)) {
    if (
      req.headers.get(XHasuraAdminSecret) !==
      Deno.env.get("HASURA_GRAPHQL_ADMIN_SECRET")
    ) {
      return new Response("unauthorized", {
        status: 401,
      });
    }

    const body = JSON.stringify({
      [XHasuraRole]: "admin",
    });

    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  return new Response(
    JSON.stringify({
      [XHasuraRole]: "anonymous",
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
};

console.log(`HTTP server running. Access it at: http://localhost:4200/`);
Deno.serve({ port }, handler);

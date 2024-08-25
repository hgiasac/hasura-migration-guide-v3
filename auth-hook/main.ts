const port = 4200;

const handler = (req: Request): Response => {
  if (
    req.headers.get("x-hasura-admin-secret") !==
    Deno.env.get("HASURA_GRAPHQL_ADMIN_SECRET")
  ) {
    return new Response("unauthorized", {
      status: 401,
    });
  }

  const body = JSON.stringify({
    "x-hasura-role": "admin",
  });

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
};

console.log(`HTTP server running. Access it at: http://localhost:4200/`);
Deno.serve({ port }, handler);

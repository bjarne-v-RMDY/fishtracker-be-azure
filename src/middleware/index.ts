import { createMiddleware } from 'hono/factory';

const logger = createMiddleware(async (c, next) => {
  const cyan = "\x1b[36m";
  const yellow = "\x1b[33m";
  const reset = "\x1b[0m";

  // Log the request method and URL
  console.log(`${cyan}[${c.req.method}]${reset} ${yellow}${c.req.url}${reset}`);

  // Call the next middleware or route handler
  await next();

  // Log the response status code after the response is sent
  console.log(`${cyan}[Response]${reset} ${yellow}Status Code: ${c.res.status}${reset}`);
});

export {
  logger
};
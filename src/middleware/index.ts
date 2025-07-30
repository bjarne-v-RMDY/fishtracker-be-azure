import { createMiddleware } from 'hono/factory';

const logger = createMiddleware(async (c, next) => {
  const cyan = "\x1b[36m";
  const yellow = "\x1b[33m";
  const reset = "\x1b[0m";
  console.log(`${cyan}[${c.req.method}]${reset} ${yellow}${c.req.url}${reset}`)
  await next()
})

export {
    logger
}
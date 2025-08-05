/*
  RMDY - Fish Tracker APIx
*/


import { Hono } from 'hono'
import { logger } from './middleware'
import { Lander } from './templates'
import { openApiDoc } from './swagger'
import { swaggerUI } from '@hono/swagger-ui'
import { intitateMongoDb } from './db'
import deviceRoute from './routes/device.route'
import fishRoute from './routes/fish.route'
import * as Effect from "effect/Effect"

const app = new Hono()

// Initialize DB with Effect error handling
Effect.runPromise(intitateMongoDb).catch((error) => {
  console.error(error.message)
  process.exit(1)
})

// Middleware
app.use(logger)

/**
 *  SWAGGER
 * - serve doc
 * - serve UI
 */

app.get("/health", (c) => c.json({ status: "ok" }))

app.get("/swagger/doc", (c) => c.json(openApiDoc));
app.get('/swagger/ui', swaggerUI({ url: '/swagger/doc' }))


/*
* Entrypoint for the API
* - serves a small React app
*/
app.get('/', (c) => {
  return c.html(<Lander />)
})


// Device and Fish routes
app.route("/device", deviceRoute)
app.route("/fish", fishRoute)


export default {
  port: Bun.env.PORT || 3000,
  fetch: app.fetch,
}

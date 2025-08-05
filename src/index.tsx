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
import { Debug } from './templates/debug'
import { debug } from './routes/debug.route'

const app = new Hono().basePath("/api")

// Initialize DB with error handling (no Effect)
intitateMongoDb().catch((error) => {
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
app.get('/swagger/ui', swaggerUI({ url: '/api/swagger/doc' }))


/*
* Entrypoint for the API
* - serves a small React app
*/
app.get('/', (c) => {
  return c.html(<Lander />)
})

//Webroute for testing
app.get('/debug', (c) => {
  return c.html(<Debug/>)
})


// Device and Fish routes
app.route("/device", deviceRoute)
app.route("/fish", fishRoute)
app.route("/debug", debug)


export default {
  port: Bun.env.PORT || 3000,
  fetch: app.fetch,
}

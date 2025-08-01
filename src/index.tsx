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


const app = new Hono()

//Intialize DB
intitateMongoDb()

//Middleware
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


//Fish route

//Device route
app.route("/device", deviceRoute)
app.route("/fish", fishRoute)


export default {
  port: Bun.env.PORT || 3000,
  fetch: app.fetch,
} 

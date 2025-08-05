import { Hono } from "hono";

import { Debug } from '../templates/debug/debug';


const debug = new Hono()


debug.get("/", (c) => {
    return c.html(<Debug />)
})



export { debug }
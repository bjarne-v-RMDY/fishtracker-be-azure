import { Hono } from "hono";

import { Debug } from '../templates/debug';


const debug = new Hono()


debug.get("/endpoints", (c) => {
    return c.html(<Debug/>)
})



export {debug}
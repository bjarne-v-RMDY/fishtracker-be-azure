import { Hono } from "hono";
import { Debug } from "../templates/debug/debug";
import { DebugFish } from "../templates/debug/debugFish";

const debugRoute = new Hono();

debugRoute.get("/", async (c) => {
    return c.html(<Debug />);
});

debugRoute.get("/fish", async (c) => {
    return c.html(<DebugFish />);
});

export default debugRoute;
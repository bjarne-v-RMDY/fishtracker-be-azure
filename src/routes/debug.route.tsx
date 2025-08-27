import { Hono } from "hono";
import { Debug } from "../templates/debug/debug";
import { DebugFish } from "../templates/debug/debugFish";
import { DebugChat } from "../templates/debug/debugChat";

const debugRoute = new Hono();

debugRoute.get("/", async (c) => {
    return c.html(<Debug />);
});

debugRoute.get("/fish", async (c) => {
    return c.html(<DebugFish />);
});

debugRoute.get("/chat", async (c) => {
    return c.html(<DebugChat />);
});

export default debugRoute;
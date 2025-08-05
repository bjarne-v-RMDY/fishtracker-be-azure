import { Hono } from "hono";
import { validateDeviceId } from "../validation/device.validation";
import { getDevice } from "../services/device.service";
import { getFishByDevice } from "../services/fish.service";
import * as Effect from "effect/Effect";

const fishRoute = new Hono();

fishRoute.get(
  "/all/:deviceId",
  async (c) => {
    const params = c.req.param();

    const validatedDeviceId = validateDeviceId(params.deviceId);

    if (!validatedDeviceId.success) {
      return c.json(validatedDeviceId.error, 400);
    }

    // Run Effect for device lookup
    const mongoDeviceResult = await Effect.runPromise(getDevice(validatedDeviceId.id as string));

    if (!mongoDeviceResult.success) {
      return c.json(mongoDeviceResult, 404);
    }

    // Run Effect for fish lookup
    const mongoFishResult = await Effect.runPromise(getFishByDevice(mongoDeviceResult.data.id));

    if (!mongoFishResult.success) {
      return c.json(mongoFishResult, 404);
    }

    return c.json(mongoFishResult, 200);
  }
);

export default fishRoute;
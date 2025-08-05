import { Hono } from "hono";
import { createDevice, getDevice } from "../services/device.service";
import { validateDeviceId } from "../validation/device.validation";
import * as Effect from "effect/Effect";

const deviceRoute = new Hono();

deviceRoute.get(
  '/:id',
  async (c) => {
    // Params
    const params = c.req.param();

    // Validate the device
    const validatedDeviceId = validateDeviceId(params.id);

    if (!validatedDeviceId.success) {
      return c.json(validatedDeviceId.error, 400);
    }

    // Check if the device exists using Effect
    const result = await Effect.runPromise(getDevice(validatedDeviceId.id as string));

    if (!result.success) {
      return c.json(result, 404);
    }

    return c.json(result, 200);
  }
);

deviceRoute.post(
  '/register',
  async (c) => {
    let body;
    try {
      body = await c.req.json();
    } catch (error) {
      return c.json({ success: false, message: "No body found on the request" }, 400);
    }

    // Validate the device
    const validatedDeviceId = validateDeviceId(body.id);

    if (!validatedDeviceId.success) {
      return c.json(validatedDeviceId.error, 400);
    }

    // Create device using Effect
    const result = await Effect.runPromise(createDevice(validatedDeviceId.id as string));

    if (!result.success) {
      return c.json(result, 400);
    }

    return c.json(result, 201);
  }
);

export default deviceRoute;
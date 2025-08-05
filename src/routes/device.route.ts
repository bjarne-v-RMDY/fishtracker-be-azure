import { Hono } from "hono";
import { createDevice, getDevice } from "../services/device.service";
import { validateDeviceId } from "../validation/device.validation";

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

    // Check if the device exists
    const result = await getDevice(validatedDeviceId.id as string);

    // Always return JSON, with appropriate status
    return c.json(result, result.success ? 200 : 404);
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
    const validatedDeviceId = validateDeviceId(body.deviceId);

    if (!validatedDeviceId.success) {
      return c.json(validatedDeviceId.error, 400);
    }

    // Create device
    const result = await createDevice(validatedDeviceId.id as string);

    return c.json(result, result.success ? 201 : 400);
  }
);


export default deviceRoute;
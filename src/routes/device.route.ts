import { Hono } from "hono";
import { createDevice, getDevice, upsertDeviceWithFish } from "../services/device.service";
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

deviceRoute.post(
  '/:deviceId/add',
  async (c) => {
    // Get device ID from params
    const params = c.req.param();
    const deviceId = params.deviceId;

    // Validate the device ID
    const validatedDeviceId = validateDeviceId(deviceId);
    if (!validatedDeviceId.success) {
      return c.json(validatedDeviceId.error, 400);
    }

    // Get request body
    let body;
    try {
      body = await c.req.json();
    } catch (error) {
      return c.json({ success: false, message: "No body found on the request" }, 400);
    }

    // Validate required fields
    if (!body.fishName || !body.fish || !body.imageUrl || !body.timestamp || !body.fishId) {
      return c.json({ 
        success: false, 
        message: "Missing required fields: fishName, fish, imageUrl, timestamp, fishId" 
      }, 400);
    }

    try {
      // Upsert device with fish data
      const result = await upsertDeviceWithFish(deviceId, body);
      
      if (result.success) {
        return c.json(result, 200);
      } else {
        return c.json(result, 400);
      }
    } catch (error) {
      return c.json({ 
        success: false, 
        message: "Failed to upsert device with fish data",
        error: error instanceof Error ? error.message : "Unknown error"
      }, 500);
    }
  }
);

export default deviceRoute;
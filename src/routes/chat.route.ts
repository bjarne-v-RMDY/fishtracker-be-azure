import { Hono } from "hono";
import { getFishDataAndChat } from "../services/chat.service";
import { validateDeviceId } from "../validation/device.validation";

const chatRoute = new Hono();

chatRoute.post(
  '/:deviceId',
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
    if (!body.message || typeof body.message !== 'string') {
      return c.json({ 
        success: false, 
        message: "Missing or invalid 'message' field in request body. Must be a string." 
      }, 400);
    }

    try {
      // Process chat request
      const result = await getFishDataAndChat(deviceId, body.message);
      
      if (result.success) {
        return c.json(result, 200);
      } else {
        return c.json(result, 400);
      }
    } catch (error) {
      return c.json({ 
        success: false, 
        message: "Failed to process chat request",
        error: error instanceof Error ? error.message : "Unknown error"
      }, 500);
    }
  }
);

export default chatRoute;

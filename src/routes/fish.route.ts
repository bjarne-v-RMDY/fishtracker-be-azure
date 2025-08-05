import { Hono } from "hono";
import { validateDeviceId } from "../validation/device.validation";
import { getDevice } from "../services/device.service";
import { getFishByDevice } from "../services/fish.service";

const fishRoute = new Hono();

fishRoute.get("/all/:deviceId", async (c) => {
  const params = c.req.param();
  const validatedDeviceId = validateDeviceId(params.deviceId);

  if (!validatedDeviceId.success) {
    return c.json(validatedDeviceId.error, 400);
  }

  const mongoDeviceResult = await getDevice(validatedDeviceId.id as string);
  if (!mongoDeviceResult.success) {
    return c.json(mongoDeviceResult, 404);
  }

  const mongoFishResult = await getFishByDevice(mongoDeviceResult.data.id);
  return c.json(mongoFishResult, mongoFishResult.success ? 200 : 404);
});


export default fishRoute;
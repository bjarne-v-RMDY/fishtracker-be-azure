import { Hono } from "hono";
import { createDevice, getDevice } from "../services/device.service";
import { validateDeviceId } from "../validation/device.validation";

const deviceRoute = new Hono();

deviceRoute.get(
    '/:id',
    async(c) => {

        //Params
        let params = c.req.param()

        //Validate the device
        const validatedDeviceId = validateDeviceId(params.id);

        if (!validatedDeviceId.success) {
            return c.json(validatedDeviceId.error, 400);
        }

        //Check if the device exists
        const mongoResult = await getDevice(validatedDeviceId.id as string);

        if (!mongoResult.success) {
            return c.json(mongoResult, 404);
        }
        
        return c.json(mongoResult, 200);
    }
)

deviceRoute.post(
    '/register',
    async (c) => {

        let body;
        try {
            body = await c.req.json();
        } catch (error) {
            c.json("No body found on the request", 400)
        }

        
        //Validate the device
        const validatedDeviceId = validateDeviceId(body);

        if (!validatedDeviceId.success) {
            return c.json(validatedDeviceId.error, 400);
        }

        const mongoResult = await createDevice(validatedDeviceId.id as string);
        
        if (!mongoResult.success) {
            return c.json(mongoResult, 400);
        }
        
        return c.json(mongoResult, 201);
    }
);

export default deviceRoute;
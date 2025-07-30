import { Hono } from "hono";
import { createDevice, getDevice } from "../services/device.service";
import { deviceFindValidation, deviceRegisterValidation } from "../validation/device.validation";
import { formatZodError } from "../lib/zodErrorFormatter";

const deviceRoute = new Hono();

deviceRoute.get(
    '/:id',
    async(c) => {
        let params = c.req.param()

        const zodResult = deviceFindValidation.safeParse(params)
        if (!zodResult.success) {
            const formattedError = formatZodError(zodResult.error);
            return c.json(formattedError, 400);
        }

        const mongoResult = await getDevice(zodResult.data.id);

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

        
        const zodResult = deviceRegisterValidation.safeParse(body);
        if (!zodResult.success) {
            const formattedError = formatZodError(zodResult.error);
            return c.json(formattedError, 400);
        }

        const mongoResult = await createDevice(zodResult.data.id);
        
        if (!mongoResult.success) {
            return c.json(mongoResult, 400);
        }
        
        return c.json(mongoResult, 201);
    }
);

export default deviceRoute;
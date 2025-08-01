import { Hono } from "hono";
import { deviceFindValidation, validateDeviceId } from "../validation/device.validation";
import { formatZodError } from "../lib/zodErrorFormatter";
import { getDevice } from "../services/device.service";
import { getFishByDevice } from "../services/fish.service";



const fishRoute = new Hono()

fishRoute.get(
    "/all/:deviceId", 
    async(c) => {
        let params = c.req.param()

        const validatedDeviceId = validateDeviceId(params.deviceId);

        if (!validatedDeviceId.success) {
            return c.json(validatedDeviceId.error, 400);
        }

        const mongoDeviceResult = await getDevice(validatedDeviceId.id as string);

        if (!mongoDeviceResult.success) {
            return c.json(mongoDeviceResult, 404);
        }

        const mongoFishResult = await getFishByDevice(mongoDeviceResult.data.id)

        if(!mongoFishResult.success){
            return c.json(mongoFishResult, 404)
        }

        return c.json(mongoFishResult, 200)    

    }
)


export default fishRoute
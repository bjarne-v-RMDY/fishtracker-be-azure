import { Hono } from "hono";
import { deviceFindValidation } from "../validation/device.validation";
import { formatZodError } from "../lib/zodErrorFormatter";
import { getDevice } from "../services/device.service";
import { getFishByDevice } from "../services/fish.service";



const fishRoute = new Hono()

fishRoute.get(
    "/all/:deviceId", 
    async(c) => {
        let params = c.req.param()

        //Verify if device actually exists
        const zodResult = deviceFindValidation.safeParse({id: params.deviceId})
        if (!zodResult.success) {
            const formattedError = formatZodError(zodResult.error);
            return c.json(formattedError, 400);
        }


        const mongoDeviceResult = await getDevice(zodResult.data.id);

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
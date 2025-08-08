import { Hono } from "hono";
import { validateDeviceId } from "../validation/device.validation";
import { getDevice } from "../services/device.service";
import { getFishByDevice, processFishRegistration } from "../services/fish.service";
import { success } from "zod";
import { handleFishDetection } from "../lib/fishDetection";
import { CreateFishWithDataInput } from "../types/fish.types";

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

fishRoute.post("/process-fish-registration", async (c) => {
  let body;

  try {
    body = await c.req.json();
  } catch (error) {
    return c.json({ success: false, message: "No body found on the request" }, 400);
  }

  // Validate that the body contains the required fish data
  console.log(body.fishData.name)  
  
  // Handle the data structure from Azure Function
  let fishData = body.fishData;
  
  // Additional validation to ensure we have the fish data
  if (!fishData) {
    return c.json({ success: false, message: "Fish data is required" }, 400);
  }

  try {
    const result = await processFishRegistration(fishData);
    
    if (result.success) {
      return c.json(result, 200);
    } else {
      return c.json(result, 400);
    }
  } catch (error) {
    return c.json({ 
      success: false, 
      message: "Failed to process fish registration",
      error: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});

/**
 * POST /upload
 * Receives a fish picture and a deviceId, validates the deviceId,
 * and prepares the picture for blob storage (does not store yet).
 */
fishRoute.post("/upload", async (c) => {
  // Parse multipart/form-data
  let formData;
  try {
    formData = await c.req.parseBody();
  } catch (error) {
    return c.json({success: false, message: "No body of type formdata found on the request"}, 400)
  }

  // Extract deviceId and file from the form data
  const deviceId = formData["deviceId"];
  const file = formData["file"]; // Assumes the file field is named 'file'

  // Validate deviceId

  if(typeof deviceId !== "string") {
    return c.json({success: false, message: "deviceId is not a string"}, 400)
  }

  const validatedDeviceId = validateDeviceId(deviceId);
  if (!validatedDeviceId.success) {
    return c.json(validatedDeviceId.error, 400);
  }

  const mongoDeviceResult = await getDevice(validatedDeviceId.id as string);
  if (!mongoDeviceResult.success) {
    return c.json(mongoDeviceResult, 404);
  }

  // Check if file is present and is a file object
  if (!file || typeof file !== "object" || !file.type || !file.name) {
    return c.json({ error: "No file uploaded or invalid file format." }, 400);
  }


  // Prepare file for blob storage (read buffer and gather metadata)
  const fileBuffer = await file.arrayBuffer();

  const fishDetectionResult = await handleFishDetection(fileBuffer, validatedDeviceId.id as string)
  if(!fishDetectionResult.success) {
    return c.json({
      success: false,
      message: fishDetectionResult.message
    }, 400)
  }

  if(fishDetectionResult.data.fishDetected.length == 0){
    return c.json({
      success: true,
      message: fishDetectionResult.message,
      fish: []
    }, 200)
  }

  const fileMeta = {
    originalName: file.name,
    mimeType: file.type,
    size: file.size,
    buffer: Buffer.from(fileBuffer), // This buffer can be sent to blob storage later
  };

  // Respond with metadata (do not store yet)
  return c.json({
    success: true,
    message: "File validated and put into message queue.",
    deviceId: validatedDeviceId.id,
    fileMeta: {
      originalName: fileMeta.originalName,
      mimeType: fileMeta.mimeType,
      size: fileMeta.size,
    },
    fish: fishDetectionResult.data
  });
});

export default fishRoute;
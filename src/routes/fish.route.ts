import { Hono } from "hono";
import { validateDeviceId } from "../validation/device.validation";
import { getDevice } from "../services/device.service";
import { getFishByDevice, processFishRegistration, checkFishByName, addExistingFishToDevice } from "../services/fish.service";
import { handleFishDetection } from "../lib/fishDetection";
import { BlobServiceClient } from "@azure/storage-blob";

const fishRoute = new Hono();

fishRoute.get("/:deviceId", async (c) => {
  const params = c.req.param();
  const validatedDeviceId = validateDeviceId(params.deviceId);

  if (!validatedDeviceId.success) {
    return c.json(validatedDeviceId.error, 400);
  }

  const mongoDeviceResult = await getDevice(validatedDeviceId.id as string);
  if (!mongoDeviceResult.success) {
    return c.json(mongoDeviceResult, 404);
  }

  const mongoFishResult = await getFishByDevice(validatedDeviceId.id as string);
  console.log(mongoFishResult)
  return c.json(mongoFishResult.success ? mongoFishResult : {data: []}, mongoFishResult.success ? 200 : 200);
});

// Check if fish exists by name
fishRoute.get("/name/:fishName", async (c) => {
  const params = c.req.param();
  const fishName = params.fishName;

  if (!fishName) {
    return c.json({ success: false, message: "Fish name is required" }, 400);
  }

  try {
    const result = await checkFishByName(fishName);
    return c.json(result, result.success ? 200 : 404);
  } catch (error) {
    return c.json({ 
      success: false, 
      message: "Failed to check fish by name",
      error: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});

// Add existing fish to device
fishRoute.post("/add-existing/:deviceId/:fishName", async (c) => {
  const params = c.req.param();
  const deviceId = params.deviceId;
  const fishName = params.fishName;

  if (!deviceId || !fishName) {
    return c.json({ success: false, message: "Device ID and Fish Name are required" }, 400);
  }

  // Validate device ID
  const validatedDeviceId = validateDeviceId(deviceId);
  if (!validatedDeviceId.success) {
    return c.json(validatedDeviceId.error, 400);
  }

  // Get image URL from request body
  let body;
  try {
    body = await c.req.json();
  } catch (error) {
    return c.json({ success: false, message: "Request body is required" }, 400);
  }

  const { imageUrl } = body;
  if (!imageUrl) {
    return c.json({ success: false, message: "Image URL is required" }, 400);
  }

  try {
    const result = await addExistingFishToDevice(deviceId, fishName, imageUrl);
    return c.json(result, result.success ? 200 : 400);
  } catch (error) {
    return c.json({ 
      success: false, 
      message: "Failed to add existing fish to device",
      error: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});

// Image proxy endpoint
fishRoute.get("/image/*", async (c) => {
  const imagePath = c.req.path.replace('/api/fish/image/', '');
  
  if (!imagePath) {
    return c.json({ error: "Image path is required" }, 400);
  }

  try {
    const connectionString = Bun.env.SA_CONNECTION_STRING;
    if (!connectionString) {
      return c.json({ error: "Storage connection not configured" }, 500);
    }

    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    const containerClient = blobServiceClient.getContainerClient('fish-images');
    const blobClient = containerClient.getBlobClient(decodeURIComponent(imagePath));

    // Check if blob exists
    const exists = await blobClient.exists();
    if (!exists) {
      return c.json({ error: "Image not found" }, 404);
    }

    // Download the blob
    const downloadResponse = await blobClient.download();
    const imageBuffer = await streamToBuffer(downloadResponse.readableStreamBody);

    // Get content type
    const properties = await blobClient.getProperties();
    const contentType = properties.contentType || 'image/jpeg';

    // Return the image with proper headers
    return new Response(new Uint8Array(imageBuffer), {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error('Error serving image:', error);
    return c.json({ error: "Failed to serve image" }, 500);
  }
});

// Helper function to convert stream to buffer
async function streamToBuffer(readableStream: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    readableStream.on('data', (chunk: Buffer) => chunks.push(chunk));
    readableStream.on('end', () => resolve(Buffer.concat(chunks)));
    readableStream.on('error', reject);
  });
}

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
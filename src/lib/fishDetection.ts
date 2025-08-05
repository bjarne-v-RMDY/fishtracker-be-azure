import { createErrorResponse, createSuccessResponse } from "./mongooseResponseFormatter";
import createClient from "@azure-rest/ai-vision-image-analysis";
import { AzureKeyCredential } from "@azure/core-auth";

export const handleFishDetection = async (image: ArrayBuffer) => {
    const endpoint = Bun.env.VISION_ENDPOINT;
    const key = Bun.env.VISION_KEY;

    if (!endpoint || !key) {
        return createErrorResponse({
            message: `Azure Vision not available due to: ${!endpoint ? "[NO ENDPOINT]" : ""} ${!key ? "[NO KEY]" : ""}`
        });
    }

    const credential = new AzureKeyCredential(key);
    const client = createClient(endpoint, credential);

    // Use the 'Objects' feature for object detection
    const features = ["Objects"];

    try {
        // Send the image buffer to Azure Vision API
        const result = await client.path("/imageanalysis:analyze").post({
            body: Buffer.from(image), // Ensure it's a Node.js Buffer
            queryParameters: { features },
            contentType: "application/octet-stream"
        });

        const iaResult = result.body;

        // Filter for detected fish objects
        const fishObjects = iaResult.objectsResult?.values?.filter(
            (obj: any) => obj.object?.toLowerCase() === "fish"
        ) || [];

        return createSuccessResponse({
            fishDetected: fishObjects.length > 0,
            fishObjects,
            allObjects: iaResult.objectsResult?.values || [],
            raw: iaResult
        });
    } catch (error) {
        return createErrorResponse({
            message: "Azure Vision API error",
            error: error instanceof Error ? error.message : error
        });
    }
};
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
            body: Buffer.from(image),
            queryParameters: { features },
            contentType: "application/octet-stream"
        });

        const iaResult = result.body;

        // Check for error response
        if ("error" in iaResult) {
            return createErrorResponse({
                message: iaResult.error.message || "Azure Vision API error",
                error: iaResult.error
            });
        }

        // List of keywords that are considered "fish-esque"
        const fishKeywords = ["fish", "shark", "dolphin", "eel", "ray", "trout", "salmon", "bass", "carp", "catfish", "tuna", "cod", "mackerel", "anchovy", "sardine", "herring", "perch", "pike", "tilapia", "snapper", "grouper", "barracuda", "flounder", "halibut", "sole", "sturgeon", "swordfish", "marlin", "manta", "stingray"];

        // Filter for detected fish-esque objects
        const fishObjects = (iaResult.objectsResult?.values || []).filter((obj) => {
            const tags = (obj.tags || []).map(el => el.name)
            // Check if the object name or any tag contains a fish keyword
            return fishKeywords.some(keyword =>
                tags.some((tag: string) => tag.includes(keyword))
            );
        });

        return createSuccessResponse({
            fishDetected: fishObjects.length > 0,
            fishObjects,
        });
    } catch (error) {
        console.log(error)
        return createErrorResponse({
            message: "Azure Vision API error",
            error: error instanceof Error ? error.message : error
        });
    }
};
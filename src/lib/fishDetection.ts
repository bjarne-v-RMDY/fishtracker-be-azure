import { createErrorResponse, createSuccessResponse } from "./mongooseResponseFormatter";
import createClient from "@azure-rest/ai-vision-image-analysis";
import { AzureKeyCredential } from "@azure/core-auth";
import { fishKeywords } from "../const/fish";
import { handleImageCutMessageQueue } from "./handleImageCutMessageQueue";

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


        // Filter for detected fish-esque objects
        const fishObjects = (iaResult.objectsResult?.values || []).filter((obj) => {
            const tags = (obj.tags || []).map(el => el.name)
            // Check if the object name or any tag contains a fish keyword
            return fishKeywords.some(keyword =>
                tags.some((tag: string) => tag.includes(keyword))
            );
        });

        const confidentFish = fishObjects.filter(fish => fish.tags[0].confidence > 0.65)


        if(confidentFish.length === 0){
            return createSuccessResponse({
                fishDetected: []
            }, "Successfully processed image but no fish detected")
        }


        //Process the fish cutting etc in azure with a message queue
        const messageQueueResponse = await handleImageCutMessageQueue(confidentFish, image)

        if(!messageQueueResponse.success){
            return messageQueueResponse
        }


        return createSuccessResponse({
            fishDetected: confidentFish.length > 0,
            data: confidentFish,
        });
    } catch (error) {
        return createErrorResponse({
            message: "Azure Vision API error",
            error: error instanceof Error ? error.message : error
        });
    }
};
import { DetectedObjectOutput } from "@azure-rest/ai-vision-image-analysis";
import { ApiResponse, createErrorResponse, createSuccessResponse } from "./mongooseResponseFormatter";
import { QueueServiceClient } from '@azure/storage-queue'; // Import the QueueServiceClient
import { ImageQueueData } from "../types/image.queue";
import { BlobServiceClient } from "@azure/storage-blob";

const messageQueUrl = "https://safishtrackerqueue.queue.core.windows.net/image-cutting";

export const handleImageCutMessageQueue = async (data: DetectedObjectOutput[], image: ArrayBuffer, deviceId: string): Promise<ApiResponse<any>> => {
    // Connection
    const connectionString = Bun.env.SA_CONNECTION_STRING;
    const connectionKey = Bun.env.SA_ACCESS_KEY;

    if (!connectionString || !connectionKey) {
        return createErrorResponse({
            message: `Azure Vision not available due to: ${!connectionString ? "[NO ENDPOINT]" : ""} ${!connectionKey ? "[NO KEY]" : ""}`
        });
    }

    try {
        // Create a QueueServiceClient
        const queueServiceClient = QueueServiceClient.fromConnectionString(connectionString);
        const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
        const containerClient = blobServiceClient.getContainerClient('fish-images'); // Replace with your container name

        // Log the connection status
        console.log("Connecting to Azure Storage Queue for image cutting");
        
        // Check if the queue exists
        const queueClient = queueServiceClient.getQueueClient("image-cutting");
        const queueExists = await queueClient.exists();
        const containerExists = await containerClient.exists()

        if (queueExists && containerExists) {
            console.log("Successfully connected to the message queue.");
            
            const blobName = `pre-cut/${Date.now()}_${crypto.randomUUID()}.jpg`; // Unique blob name
            const blockBlobClient = containerClient.getBlockBlobClient(blobName);
            await blockBlobClient.upload(Buffer.from(image), Buffer.from(image).length); // Upload the image buffer
            const imageUrl = blockBlobClient.url;


            const transferData: ImageQueueData = {
                fishData: data,
                image: imageUrl,
                deviceId
            }
            const message  = JSON.stringify(transferData)
            const messageResult = await queueClient.sendMessage(Buffer.from(message).toString("base64"))
            
            if(messageResult.errorCode){
                console.log(messageResult.errorCode)
                return createErrorResponse({
                    message: messageResult.errorCode
                })
            } else {
                console.log('Message put on queue')
                return createSuccessResponse({
                    message: 'Message has been queued'
                })
            }
       
        } else {
            console.log(`Somethign went wrong [CONTAINER EXISTS? ${containerExists ? "True" : "False"}], [QUEUE EXISTS? ${queueExists ? "True" : "False"}]`);
        }

        return createSuccessResponse({}, "Message queue connection checked.");
    } catch (error) {
        console.error("Error connecting to the message queue:", error);
        return createErrorResponse({ message: "Failed to connect to the message queue." });
    }
};
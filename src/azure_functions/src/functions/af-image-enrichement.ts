import { DetectedObjectOutput } from "@azure-rest/ai-vision-image-analysis";
import { app, InvocationContext } from "@azure/functions";
import { BlobServiceClient } from '@azure/storage-blob';
import * as sharp from "sharp";
import { ImageEnrichementQueueData } from "../types";

export async function afImageCut(queueItem: ImageEnrichementQueueData, context: InvocationContext): Promise<void> {
    context.log('Starting worker for processing image enrichement');
    context.log(queueItem.imageToEnriche)
    context.log('Ended worker');
}



app.storageQueue('af-image-enrichement', {
    queueName: 'image-enrichement',
    connection: 'AZURE_STORAGE_CONNECTION_STRING', // Use the connection string name
    handler: afImageCut
});

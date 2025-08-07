import { DetectedObjectOutput } from "@azure-rest/ai-vision-image-analysis";
import { app, InvocationContext } from "@azure/functions";
import { BlobServiceClient } from '@azure/storage-blob';
import * as sharp from "sharp";

type ImageQueueData = {
    fishData: DetectedObjectOutput[],
    image: string,
    deviceId: string
}

export async function afImageCut(queueItem: ImageQueueData, context: InvocationContext): Promise<void> {
    context.log('Starting worker for processing image cutting');

    const imageUrl = queueItem.image; // Get the image URL from the queue item
    context.log(`Image URL: ${imageUrl} for user ${queueItem.deviceId}`);

    try {
        // Extract the Blob Storage URL components
        const blobUrl = new URL(imageUrl);
        const pathParts = blobUrl.pathname.split('/').filter(part => part.length > 0);
        
        // For URL: https://safishtrackerqueue.blob.core.windows.net/fish-images/pre-cut/filename.jpg
        // pathParts will be: ['fish-images', 'pre-cut', 'filename.jpg']
        const containerName = pathParts[0]; // 'fish-images'
        const blobName = pathParts.slice(1).join('/'); // 'pre-cut/filename.jpg'
        
        context.log(`Container: ${containerName}, Blob: ${blobName}`);

        // Create a BlobServiceClient
        const connectionString = process.env['AZURE_STORAGE_CONNECTION_STRING'];
        if (!connectionString) {
            throw new Error('AZURE_STORAGE_CONNECTION_STRING environment variable is not set');
        }

        const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
        const containerClient = blobServiceClient.getContainerClient(containerName);
        const blobClient = containerClient.getBlobClient(blobName);

        // Download the blob - simpler approach
        context.log('Downloading blob...');
        const downloadBlockBlobResponse = await blobClient.downloadToBuffer();
        context.log(`Downloaded image size: ${downloadBlockBlobResponse.length} bytes`);

        // Log some basic info about the blob
        const properties = await blobClient.getProperties();
        context.log(`Content type: ${properties.contentType}`);
        context.log(`Last modified: ${properties.lastModified}`);

        // Process the fishData along with the image
        context.log(`Processing ${queueItem.fishData.length} detected fish objects`);
        
        // Here you can process the image based on the fish detection data
        // For example, crop fish regions, apply transformations, etc.
        await processImageWithFishData(downloadBlockBlobResponse, queueItem.fishData, queueItem.deviceId,blobName, context);

    } catch (error) {
        context.log(`Error processing image: ${error instanceof Error ? error.message : String(error)}`);
        // Re-throw the error to mark the function as failed
        throw error;
    }

    context.log('Ended worker');
}

// Helper function to convert a Node.js readable stream to a Buffer
async function streamToBuffer(readableStream: NodeJS.ReadableStream | undefined): Promise<Buffer> {
    if (!readableStream) {
        throw new Error('Readable stream is undefined');
    }
    
    return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        
        readableStream.on('data', (chunk: Buffer) => {
            chunks.push(chunk);
        });
        
        readableStream.on('end', () => {
            resolve(Buffer.concat(chunks));
        });
        
        readableStream.on('error', (error) => {
            reject(error);
        });
    });
}

// Example function to process the image with fish data
async function processImageWithFishData(
    imageBuffer: Buffer, 
    fishData: DetectedObjectOutput[], 
    deviceId: string,
    originalBlobName: string,
    context: InvocationContext
): Promise<void> {
    context.log('Processing image with fish detection data...');
    
    // Get the original image dimensions
    const image = sharp(imageBuffer);
    const metadata = await image.metadata();
    const imageWidth = metadata.width!;
    const imageHeight = metadata.height!;
    
    context.log(`Original image dimensions: ${imageWidth}x${imageHeight}`);
    
    // Setup blob storage connection
    const connectionString = process.env['AZURE_STORAGE_CONNECTION_STRING'];
    if (!connectionString) {
        throw new Error('AZURE_STORAGE_CONNECTION_STRING environment variable is not set');
    }
    
    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    const containerClient = blobServiceClient.getContainerClient('fish-images');
    
    // Process each detected fish
    for (let i = 0; i < fishData.length; i++) {
        const fish = fishData[i];
        const fishInfo = {
            confidence: fish.tags?.[0]?.confidence,
            name: fish.tags?.[0]?.name || 'fish',
            boundingBox: fish.boundingBox,
        };
        
        context.log(`Processing Fish ${i + 1}: ${JSON.stringify(fishInfo)}`);
        
        // Extract bounding box coordinates
        const bbox = fish.boundingBox;
        if (!bbox) {
            context.log(`Skipping fish ${i + 1}: No bounding box found`);
            continue;
        }
        
        // Convert normalized coordinates to pixel coordinates
        const left = Math.floor(bbox.x);
        const top = Math.floor(bbox.y);
        const width = Math.floor(bbox.w);
        const height = Math.floor(bbox.h);
        
        // Ensure coordinates are within image bounds
        const cropLeft = Math.max(0, left);
        const cropTop = Math.max(0, top);
        const cropWidth = Math.min(width, imageWidth - cropLeft);
        const cropHeight = Math.min(height, imageHeight - cropTop);
        
        context.log(`Cropping fish ${i + 1}: left=${cropLeft}, top=${cropTop}, width=${cropWidth}, height=${cropHeight}`);
        
        try {
            // Crop the image using Sharp
            const croppedImageBuffer = await sharp(imageBuffer)
                .extract({ 
                    left: cropLeft, 
                    top: cropTop, 
                    width: cropWidth, 
                    height: cropHeight 
                })
                .jpeg({ quality: 90 }) // Convert to JPEG with good quality
                .toBuffer();
            
            // Generate filename for the cropped image
            const timestamp = Date.now();
            const fishName = fishInfo.name.replace(/[^a-zA-Z0-9]/g, '_'); // Clean fish name
            const confidence = Math.round((fishInfo.confidence || 0) * 100);
            const croppedFileName = `post-cut/${deviceId}/${timestamp}_fish_${i + 1}_${fishName}_${confidence}pct.jpg`;
            
            // Upload the cropped image to blob storage
            const blobClient = containerClient.getBlockBlobClient(croppedFileName);
            await blobClient.upload(croppedImageBuffer, croppedImageBuffer.length, {
                blobHTTPHeaders: {
                    blobContentType: 'image/jpeg'
                }
            });
            
            context.log(`Successfully saved cropped fish ${i + 1} to: ${croppedFileName}`);
            
        } catch (error) {
            context.log(`Error processing fish ${i + 1}: ${error instanceof Error ? error.message : String(error)}`);
            // Continue processing other fish even if one fails
        }
    }
    
    context.log(`Completed processing ${fishData.length} fish detections`);

    try {
        context.log('Delete original image...')
        const originalBlobClient = containerClient.getBlockBlobClient(originalBlobName);
        await originalBlobClient.delete();
        context.log('Successfully deleted original image');
    } catch (error) {
        
    }
}

app.storageQueue('af-image-cut', {
    queueName: 'image-cutting',
    connection: 'AZURE_STORAGE_CONNECTION_STRING', // Use the connection string name
    handler: afImageCut
});
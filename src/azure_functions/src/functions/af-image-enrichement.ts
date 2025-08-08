import { app, InvocationContext } from "@azure/functions";
import { CreateFishWithDataInput, ImageEnrichementQueueData } from "../types";
import { AzureOpenAI } from 'openai';
import { imageEnrichementSystemPrompt } from "../prompts/image-enrichement-system-prompt";
import { BlobServiceClient } from "@azure/storage-blob";
import sharp from "sharp";

export async function afImageEnrichement(queueItem: ImageEnrichementQueueData, context: InvocationContext): Promise<void> {
    context.log('Starting worker for processing image enrichement');
    
    // OpenAI client connection
    const apiKey = process.env['AZURE_OPENAI_API_KEY'];
    
    if(!apiKey){
        throw new Error("No azure api key for openai found")
    }
    
    const connectionString = process.env['AZURE_STORAGE_CONNECTION_STRING'];
    if (!connectionString) {
        throw new Error('AZURE_STORAGE_CONNECTION_STRING environment variable is not set');
    }
    
    const containerName = `fish-images`
    const blobName = queueItem.imageToEnriche
    
    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blobClient = containerClient.getBlobClient(blobName);
    
    context.log('Downloading blob...');
    const downloadBlockBlobResponse = await blobClient.downloadToBuffer();
    context.log(`Downloaded image size: ${downloadBlockBlobResponse.length} bytes`);
    
    // Process image with Sharp - resize for optimal API usage and convert to JPEG
    const processedImageBuffer = await sharp(downloadBlockBlobResponse)
        .resize(1024, 1024, { 
            fit: 'inside', 
            withoutEnlargement: true 
        })
        .jpeg({ quality: 85 })
        .toBuffer();
    
    // Convert image to base64
    const base64Image = processedImageBuffer.toString('base64');
    const mimeType = 'image/jpeg';
    const imageDataUrl = `data:${mimeType};base64,${base64Image}`;
    
    context.log(`Processed image size: ${processedImageBuffer.length} bytes`);
    
    const apiVersion = "2024-04-01-preview";
    const endpoint = "https://bjarn-me1dsr5v-swedencentral.cognitiveservices.azure.com/";
    const modelName = "gpt-4o";
    const deployment = "gpt-4o";
    const options = { endpoint, apiKey, deployment, apiVersion }
    
    const client = new AzureOpenAI(options);
    
    try {
        const response = await client.chat.completions.create({
            messages: [
                { 
                    role: "system", 
                    content: imageEnrichementSystemPrompt 
                },
                { 
                    role: "user", 
                    content: [
                        {
                            type: "text",
                            text: "Please analyze this fish image and provide the structured data as requested."
                        },
                        {
                            type: "image_url",
                            image_url: {
                                url: imageDataUrl
                            }
                        }
                    ]
                }
            ],
            max_tokens: 4096,
            temperature: 0.3, // Lower temperature for more consistent structured output
            top_p: 1,
            model: modelName
        });
        
        const aiResponse = response.choices[0].message.content;
        

        try {
            // Clean the response by removing markdown code block wrapper
            let cleanedResponse = aiResponse;
            
            // Remove ```json at the beginning and ``` at the end
            if (cleanedResponse.startsWith('```json')) {
                cleanedResponse = cleanedResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
            } else if (cleanedResponse.startsWith('```')) {
                cleanedResponse = cleanedResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
            }
            
            // Trim any extra whitespace
            cleanedResponse = cleanedResponse.trim();
                        
            const fishData = JSON.parse(cleanedResponse);
            
            //TODO SEND FISH DATA BACK TO API and check if exists or not else create

            const __local__ = process.env["WEBSITE_INSTANCE_ID"]
            let apiEndpoint = __local__ ? "https://wafishtrackerapi-dxekchh4dvdjg0g4.francecentral-01.azurewebsites.net/api" : "http://localhost:3001/api"

            const fishObject: CreateFishWithDataInput = fishData;
            try {
                context.log("Sending fish data to API");
                const response = await fetch(`${apiEndpoint}/fish/process-fish-registration`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json", // Ensure the content type is set
                    },
                    body: JSON.stringify(fishObject)
                });

                // Log the response status and body for debugging
                context.log('Response status:', response.status);
                const responseBody = await response.text(); // Read the response body
                context.log('Response body:', responseBody);

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}, body: ${responseBody}`);
                }

                // Parse the response to get the fish data
                const fishResponse = JSON.parse(responseBody);
                
                if (fishResponse.success && fishResponse.data) {
                    // Send second request to device endpoint
                    const deviceId = queueItem.deviceId; // Assuming deviceId is in the queue item
                    const currentTime = new Date().toISOString();
                    const imageUrl = queueItem.imageToEnriche; // The blob name can serve as image URL
                    
                    const devicePayload = {
                        fishName: fishResponse.data.name,
                        fish: fishResponse.data,
                        imageUrl: imageUrl,
                        timestamp: currentTime,
                        fishId: fishResponse.data._id
                    };

                    context.log("Sending fish data to device endpoint");
                    const deviceResponse = await fetch(`${apiEndpoint}/device/${deviceId}/add`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify(devicePayload)
                    });

                    context.log('Device endpoint response status:', deviceResponse.status);
                    const deviceResponseBody = await deviceResponse.text();
                    context.log('Device endpoint response body:', deviceResponseBody);

                    if (!deviceResponse.ok) {
                        context.log('Warning: Device endpoint request failed:', deviceResponse.status, deviceResponseBody);
                        // Don't throw error here as the main fish registration was successful
                    }
                }
            } catch (error) {
                context.log('Error sending fish data to API:', error);
                throw new Error(`Failed to send fish data to API: ${error instanceof Error ? error.message : 'Unknown error'}`);
            } 


            
        } catch (parseError) {
            context.log('Error parsing AI response as JSON:', parseError);
            context.log('Raw response:', aiResponse);
        }
        
        
    } catch (apiError) {
        context.log('Error calling OpenAI API:', apiError);
        throw apiError;
    }
    
    context.log('Ended worker');
}

app.storageQueue('af-image-enrichement', {
    queueName: 'image-enrichement',
    connection: 'AZURE_STORAGE_CONNECTION_STRING',
    handler: afImageEnrichement
});
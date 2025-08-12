import { app, InvocationContext } from "@azure/functions";
import { CreateFishWithDataInput, ImageEnrichementQueueData } from "../types";
import { AzureOpenAI } from 'openai';
import { imageEnrichementSystemPrompt } from "../prompts/image-enrichement-system-prompt";
import { fishNameSystemPrompt } from "../prompts/fish-name-prompt";
import { BlobServiceClient } from "@azure/storage-blob";
import * as sharp from "sharp";

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
    
    const __local__ = process.env["WEBSITE_INSTANCE_ID"]
    let apiEndpoint = __local__ ? "https://wafishtrackerapi-dxekchh4dvdjg0g4.francecentral-01.azurewebsites.net/api" : "http://localhost:3001/api"

    try {
        // Step 1: Get fish name only
        context.log('Step 1: Getting fish name from image...');
        const nameResponse = await client.chat.completions.create({
            messages: [
                { 
                    role: "system", 
                    content: fishNameSystemPrompt 
                },
                { 
                    role: "user", 
                    content: [
                        {
                            type: "text",
                            text: "Please identify the fish species in this image."
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
            max_tokens: 100,
            temperature: 0.1,
            top_p: 1,
            model: modelName
        });
        
        const nameAiResponse = nameResponse.choices[0].message.content;
        let fishName: string;
        
        try {
            // Clean the response by removing markdown code block wrapper
            let cleanedNameResponse = nameAiResponse;
            
            if (cleanedNameResponse.startsWith('```json')) {
                cleanedNameResponse = cleanedNameResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
            } else if (cleanedNameResponse.startsWith('```')) {
                cleanedNameResponse = cleanedNameResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
            }
            
            cleanedNameResponse = cleanedNameResponse.trim();
            const nameData = JSON.parse(cleanedNameResponse);
            fishName = nameData.fishName;
            
            if (!fishName) {
                throw new Error('No fish name found in AI response');
            }
            
            context.log(`Identified fish name: ${fishName}`);
        } catch (parseError) {
            context.log('Error parsing fish name response:', parseError);
            context.log('Raw name response:', nameAiResponse);
            throw new Error('Failed to parse fish name from AI response');
        }

        // Step 2: Check if fish already exists
        context.log('Step 2: Checking if fish already exists...');
        const checkResponse = await fetch(`${apiEndpoint}/fish/name/${encodeURIComponent(fishName)}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            }
        });

        if (!checkResponse.ok) {
            throw new Error(`HTTP error checking fish name! status: ${checkResponse.status}`);
        }

        const checkResult = await checkResponse.json();
        context.log('Fish check result:', checkResult);

        if (checkResult.success && checkResult.data.known) {
            // Fish is known - skip full enrichment and add to device directly
            context.log(`Fish "${fishName}" is already known, skipping full enrichment`);
            
            const existingFish = checkResult.data;
            const deviceId = queueItem.deviceId;
            const imageUrl = queueItem.imageToEnriche;

            context.log("Adding existing fish to device...");
            const addExistingResponse = await fetch(`${apiEndpoint}/fish/add-existing/${deviceId}/${fishName}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ imageUrl: imageUrl })
            });

            context.log('Add existing fish response status:', addExistingResponse.status);
            const addExistingResponseBody = await addExistingResponse.text();
            context.log('Add existing fish response body:', addExistingResponseBody);

            if (!addExistingResponse.ok) {
                context.log('Warning: Add existing fish request failed:', addExistingResponse.status, addExistingResponseBody);
                // Don't throw error here as the main fish check was successful
            }
            
            context.log('Successfully added existing fish to device');
            return;
        }

        // Step 3: Fish is not known - proceed with full enrichment
        context.log('Step 3: Fish is not known, proceeding with full enrichment...');
        const enrichmentResponse = await client.chat.completions.create({
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
            temperature: 0.3,
            top_p: 1,
            model: modelName
        });
        
        const aiResponse = enrichmentResponse.choices[0].message.content;
        
        try {
            // Clean the response by removing markdown code block wrapper
            let cleanedResponse = aiResponse;
            
            if (cleanedResponse.startsWith('```json')) {
                cleanedResponse = cleanedResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
            } else if (cleanedResponse.startsWith('```')) {
                cleanedResponse = cleanedResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
            }
            
            cleanedResponse = cleanedResponse.trim();
            const fishData = JSON.parse(cleanedResponse);
            
            const fishObject: CreateFishWithDataInput = fishData;
            try {
                context.log("Sending new fish data to API for registration");
                const response = await fetch(`${apiEndpoint}/fish/process-fish-registration`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(fishObject)
                });

                context.log('Response status:', response.status);
                const responseBody = await response.text();
                context.log('Response body:', responseBody);

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}, body: ${responseBody}`);
                }

                const fishResponse = JSON.parse(responseBody);
                
                if (fishResponse.success && fishResponse.data) {
                    // Send second request to device endpoint
                    const deviceId = queueItem.deviceId;
                    const currentTime = new Date().toISOString();
                    const imageUrl = queueItem.imageToEnriche;
                    
                    const devicePayload = {
                        fishName: fishResponse.data.name,
                        fish: fishResponse.data,
                        imageUrl: imageUrl,
                        timestamp: currentTime,
                        fishId: fishResponse.data._id
                    };

                    context.log("Sending new fish data to device endpoint");
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
        context.log('Error in fish enrichment process:', apiError);
        throw apiError;
    }
    
    context.log('Ended worker');
}

app.storageQueue('af-image-enrichement', {
    queueName: 'image-enrichement',
    connection: 'AZURE_STORAGE_CONNECTION_STRING',
    handler: afImageEnrichement
});
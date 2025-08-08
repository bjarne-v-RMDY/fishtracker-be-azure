import { app, InvocationContext } from "@azure/functions";
import { ImageEnrichementQueueData } from "../types";
import { AzureOpenAI } from 'openai';
import { imageEnrichementSystemPrompt } from "../prompts/image-enrichement-system-prompt";
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
            
            context.log('Cleaned response:', cleanedResponse);
            
            const fishData = JSON.parse(cleanedResponse);
            context.log('Parsed fish data:', JSON.stringify(fishData, null, 2));
            
            //TODO SEND FISH DATA BACK TO API AND DO REST OF MANAGEMENT THERE
            
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
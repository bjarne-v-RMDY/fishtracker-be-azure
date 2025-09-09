import { Device } from "../db/models";
import { ApiResponse, createErrorResponse, createSuccessResponse } from "../lib/mongooseResponseFormatter";
import { AzureOpenAI } from 'openai';

export async function getFishDataAndChat(deviceIdentifier: string, userMessage: string): Promise<ApiResponse<any>> {
  try {
    // Get device and populate fish data
    const device = await Device.findOne({ deviceIdentifier }).populate('fish.fish');
    
    if (!device) {
      return createErrorResponse({ message: 'Device not found' }, 'Device has not been registered yet');
    }

    if (!device.fish || device.fish.length === 0) {
      return createErrorResponse({ message: 'No fish data found for this device' }, 'No fish data available');
    }

    // Format fish data for the AI
    const fishData = device.fish.map(fishEntry => {
      const fish = fishEntry.fish as any;
      return {
        name: fish.name,
        family: fish.family,
        minSize: fish.minSize,
        maxSize: fish.maxSize,
        waterType: fish.waterType,
        description: fish.description,
        colorDescription: fish.colorDescription,
        depthRangeMin: fish.depthRangeMin,
        depthRangeMax: fish.depthRangeMax,
        environment: fish.environment,
        region: fish.region,
        conservationStatus: fish.conservationStatus,
        consStatusDescription: fish.consStatusDescription,
        aiAccuracy: fish.aiAccuracy,
        timestamp: fishEntry.timestamp,
        imageUrl: fishEntry.imageUrl
      };
    });

    // Setup OpenAI client
    const apiKey = Bun.env.AZURE_OPENAI_API_KEY;
    if (!apiKey) {
      return createErrorResponse({ message: 'OpenAI API key not configured' }, 'No Azure API key for OpenAI found');
    }

    const apiVersion = "2024-04-01-preview";
    const endpoint = Bun.env.OPENAI_ENDPOINT;
    if (!endpoint) {
      return createErrorResponse({ message: 'OpenAI endpoint not configured' }, 'No OpenAI endpoint found in environment variables');
    }
    const modelName = "gpt-4o";
    const deployment = "gpt-4o";
    const options = { endpoint, apiKey, deployment, apiVersion };

    const client = new AzureOpenAI(options);

    // Create system message with fish data context
    const systemMessage = `You are a helpful assistant with knowledge about the following fish that have been detected:
${fishData.map((fish, index) => `
Fish ${index + 1}:
- Name: ${fish.name}
- Family: ${fish.family}
- Size Range: ${fish.minSize}-${fish.maxSize} cm
- Water Type: ${fish.waterType}
- Description: ${fish.description}
- Color Description: ${fish.colorDescription}
- Depth Range: ${fish.depthRangeMin}-${fish.depthRangeMax} meters
- Environment: ${fish.environment}
- Region: ${fish.region}
- Conservation Status: ${fish.conservationStatus}
- Conservation Details: ${fish.consStatusDescription}
- AI Detection Accuracy: ${fish.aiAccuracy}%
- Detected at: ${new Date(fish.timestamp).toLocaleString()}
`).join('\n')}

Please answer questions about these specific fish detections and provide accurate information based on the data provided. You have detailed information about each fish including their physical characteristics, habitat, conservation status, and when they were detected. Just return a normal string without any special formatting.
reply only to questions about the fish detections, not to other questions. IE don't answer questions about IT, or History ... only answer questions about the fish detections.
`;

    // Get AI response
    const response = await client.chat.completions.create({
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: userMessage }
      ],
      max_tokens: 1000,
      temperature: 0.7,
      model: modelName
    });

    const aiResponse = response.choices[0].message.content;

    return createSuccessResponse({
      response: aiResponse
    }, 'Successfully processed chat request');

  } catch (error) {
    return createErrorResponse(error, 'Failed to process chat request');
  }
}

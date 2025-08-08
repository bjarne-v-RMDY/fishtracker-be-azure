import { BlobServiceClient } from "@azure/storage-blob";
import { Fish, FishColor, FishImage, Predator, FunFact, Device } from "../db/models";
import { ApiResponse, createSuccessResponse, createErrorResponse } from "../lib/mongooseResponseFormatter";
import { CreateFishWithDataInput } from "../types/fish.types";

// Create a new fish with all related data (no Effect)
async function createFishWithData(fishData: any): Promise<ApiResponse<any>> {
  try {
    // Create the fish first - fishData contains the fish properties directly
    const fish = new Fish(fishData);
    const savedFish = await fish.save();

    // Create related data if provided
    const promises: Promise<any>[] = [];

    if (fishData.images && fishData.images.length > 0) {
      const imagePromises = fishData.images.map((imageBlob: Buffer) =>
        new FishImage({ fishId: savedFish._id, imageBlob }).save()
      );
      promises.push(...imagePromises);
    }

    if (fishData.colors && fishData.colors.length > 0) {
      const colorPromises = fishData.colors.map((color: any) =>
        new FishColor({ fishId: savedFish._id, colorName: color.colorName }).save()
      );
      promises.push(...colorPromises);
    }

    if (fishData.predators && fishData.predators.length > 0) {
      const predatorPromises = fishData.predators.map((predator: any) =>
        new Predator({ fishId: savedFish._id, predatorName: predator.predatorName }).save()
      );
      promises.push(...predatorPromises);
    }

    if (fishData.funFacts && fishData.funFacts.length > 0) {
      const funFactPromises = fishData.funFacts.map((funFact: any) =>
        new FunFact({ fishId: savedFish._id, funFactDescription: funFact.funFactDescription }).save()
      );
      promises.push(...funFactPromises);
    }

    if (promises.length > 0) {
      await Promise.all(promises);
    }

    return createSuccessResponse(savedFish, "Fish and related data created successfully");
  } catch (error) {
    return createErrorResponse(error, "Failed to create fish and related data");
  }
}

// Check if fish exists by name and create if it doesn't exist
async function checkAndCreateFish(fishData: any): Promise<ApiResponse<any>> {
  try {
    // Check if fish already exists by name
    const existingFish = await Fish.findOne({ name: fishData.name });
    
    if (existingFish) {
      return createSuccessResponse(existingFish, "Fish already exists with this name");
    }

    // If fish doesn't exist, create it with all related data
    return await createFishWithData(fishData);
  } catch (error) {
    return createErrorResponse(error, "Failed to check and create fish");
  }
}

// Process fish registration - main function for the API endpoint
async function processFishRegistration(fishData: any): Promise<ApiResponse<any>> {
  try {
    // Validate that we have the required fish data
    if (!fishData || !fishData.name) {
      return createErrorResponse({ message: "Fish name is required" }, "Fish name is required");
    }

    // Check if fish exists and create if it doesn't
    const result = await checkAndCreateFish(fishData);
    
    if (result.success) {
      return createSuccessResponse(result.data, "Fish processed successfully");
    } else {
      return result; // Return the error response
    }
  } catch (error) {
    return createErrorResponse(error, "Failed to process fish registration");
  }
}

// Get fish with all related data (no Effect, just Promise)
async function getFishWithAllData(fishId: string) {
  try {
    const fish = await Fish.findById(fishId).populate('deviceId');
    const images = await FishImage.find({ fishId });
    const colors = await FishColor.find({ fishId });
    const predators = await Predator.find({ fishId });
    const funFacts = await FunFact.find({ fishId });

    return {
      fish,
      images,
      colors,
      predators,
      funFacts
    };
  } catch (error) {
    console.error('Error getting fish with data:', error);
    throw error;
  }
}

// Get all fish for a specific device (updated for new structure)
async function getFishByDevice(deviceId: string): Promise<ApiResponse<any>> {
  try {
    // Find the device and populate the fish array with full fish details
    const device = await Device.findOne({ deviceIdentifier: deviceId }).populate({
      path: 'fish.fish',
      model: 'Fish'
    });
    
    if (!device) {
      return createErrorResponse({ message: 'Device not found' }, 'Device not found');
    }
    
    if (!device.fish || device.fish.length === 0) {
      return createErrorResponse({ message: 'No fish found for this device' }, 'No fish found for this device');
    }

    // Add image URLs to each fish entry
    const fishWithImages = device.fish.map((fishEntry: any) => {
      const fishData = fishEntry.toObject();
      return {
        ...fishData,
        imageUrl: `/api/fish/image/${encodeURIComponent(fishData.imageUrl)}`
      };
    });
    
    return createSuccessResponse(fishWithImages, 'Fish found for device');
  } catch (error) {
    return createErrorResponse(error, 'Something went wrong during the fetching of the fish related to the device: ' + deviceId);
  }
}

// Helper function to generate SAS token for blob access
async function generateSasToken(blobClient: any): Promise<string> {
  // For now, we'll use a simple approach - in production you might want to use proper SAS token generation
  // This is a simplified version that works for development
  const accountName = blobClient.accountName;
  const accountKey = process.env['AZURE_STORAGE_ACCOUNT_KEY'];
  
  if (!accountKey) {
    throw new Error('Azure Storage account key not configured');
  }

  // Generate a simple SAS token (this is a basic implementation)
  // In production, you should use proper SAS token generation with proper permissions and expiration
  const expiryDate = new Date();
  expiryDate.setHours(expiryDate.getHours() + 1); // Token expires in 1 hour

  // This is a simplified SAS token - in production use proper Azure SDK methods
  const sasToken = `sv=2020-08-04&sr=b&sig=${encodeURIComponent(accountKey)}&st=${new Date().toISOString()}&se=${expiryDate.toISOString()}&sp=r`;
  
  return sasToken;
}

export {
  createFishWithData,
  getFishWithAllData,
  getFishByDevice,
  processFishRegistration
}
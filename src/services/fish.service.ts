import { Fish, FishColor, FishImage, Predator, FunFact } from "../db/models";
import { ApiResponse, createSuccessResponse, createErrorResponse } from "../lib/mongooseResponseFormatter";
import { CreateFishWithDataInput } from "../types/fish.types";

// Create a new fish with all related data (no Effect)
async function createFishWithData(fishData: CreateFishWithDataInput): Promise<ApiResponse<any>> {
  try {
    // Create the fish first
    const fish = new Fish(fishData.fish);
    const savedFish = await fish.save();

    // Create related data if provided
    const promises: Promise<any>[] = [];

    if (fishData.images && fishData.images.length > 0) {
      const imagePromises = fishData.images.map(imageBlob =>
        new FishImage({ fishId: savedFish._id, imageBlob }).save()
      );
      promises.push(...imagePromises);
    }

    if (fishData.colors && fishData.colors.length > 0) {
      const colorPromises = fishData.colors.map(colorName =>
        new FishColor({ fishId: savedFish._id, colorName }).save()
      );
      promises.push(...colorPromises);
    }

    if (fishData.predators && fishData.predators.length > 0) {
      const predatorPromises = fishData.predators.map(predatorName =>
        new Predator({ fishId: savedFish._id, predatorName }).save()
      );
      promises.push(...predatorPromises);
    }

    if (fishData.funFacts && fishData.funFacts.length > 0) {
      const funFactPromises = fishData.funFacts.map(funFactDescription =>
        new FunFact({ fishId: savedFish._id, funFactDescription }).save()
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

// Get all fish for a specific device (no Effect)
async function getFishByDevice(deviceId: string): Promise<ApiResponse<any>> {
  try {
    const fish = await Fish.find({ deviceId }).populate('deviceId');
    if (!fish || fish.length === 0) {
      return createErrorResponse({ message: 'No fish found related to this device' }, 'No fish found related to this device');
    }
    return createSuccessResponse(fish, 'Fish found');
  } catch (error) {
    return createErrorResponse(error, 'Something went wrong during the fetching of the fish related to the device: ' + deviceId);
  }
}

export {
  createFishWithData,
  getFishWithAllData,
  getFishByDevice
}
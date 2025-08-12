import { Fish, FishColor, FishImage, Predator, FunFact, Device } from "../db/models";
import { ApiResponse, createSuccessResponse, createErrorResponse } from "../lib/mongooseResponseFormatter";

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

// Check if fish exists by name
async function checkFishByName(fishName: string): Promise<ApiResponse<any>> {
  try {
    // Check if fish already exists by name
    const existingFish = await Fish.findOne({ name: fishName });
    
    if (existingFish) {
      return createSuccessResponse({
        ...existingFish.toObject(),
        known: true
      }, "Fish found with this name");
    }

    // If fish doesn't exist, return with known: false
    return createSuccessResponse({
      name: fishName,
      known: false
    }, "Fish not found with this name");
  } catch (error) {
    return createErrorResponse(error, "Failed to check fish by name");
  }
}

// Add existing fish to device
async function addExistingFishToDevice(deviceId: string, fishName: string, imageUrl: string): Promise<ApiResponse<any>> {
  try {
    // Check if device exists
    const device = await Device.findOne({ deviceIdentifier: deviceId });
    if (!device) {
      return createErrorResponse({ message: 'Device not found' }, 'Device not found');
    }

    // Check if fish exists by name
    const fish = await Fish.findOne({ name: fishName });
    if (!fish) {
      return createErrorResponse({ message: 'Fish not found with this name' }, 'Fish not found');
    }

    // Rate-limit: Only add if last sighting of same fish type was > 10s ago
    const TEN_SECONDS_MS = 10 * 1000;
    const now = new Date();

    // Find most recent entry for this fish type on this device
    const entriesForFish = (device.fish || []).filter((entry: any) => entry.fishId?.toString() === fish._id.toString());
    const lastEntry = entriesForFish.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

    if (lastEntry) {
      const lastSeenMs = new Date(lastEntry.timestamp).getTime();
      const diffMs = now.getTime() - lastSeenMs;
      if (diffMs < TEN_SECONDS_MS) {
        return createSuccessResponse({
          deviceId: device.deviceIdentifier,
          fishId: fish._id,
          fishName: fish.name,
          imageUrl,
          lastSeenAt: new Date(lastSeenMs),
          skipped: true,
          reason: 'Seen within the last 10 seconds'
        }, 'Fish sighting skipped to prevent spamming');
      }
    }

    // Add fish to device
    device.fish.push({
      fish: fish._id,
      imageUrl: imageUrl,
      timestamp: now,
      fishId: fish._id
    });

    await device.save();

    return createSuccessResponse({
      deviceId: device.deviceIdentifier,
      fishId: fish._id,
      fishName: fish.name,
      imageUrl: imageUrl,
      timestamp: now,
      skipped: false
    }, 'Fish successfully added to device');
  } catch (error) {
    return createErrorResponse(error, 'Failed to add fish to device');
  }
}

export {
  createFishWithData,
  getFishByDevice,
  processFishRegistration,
  checkFishByName,
  addExistingFishToDevice
}
import { Fish, FishColor, FishImage, Predator, FunFact } from "../db/models";
import { createErrorResponse, createSuccessResponse } from "../lib/mongooseResponseFormatter";

// Create a new fish with all related data
async function createFishWithData(fishData) {
    try {
      // Create the fish first
      const fish = new Fish(fishData.fish);
      const savedFish = await fish.save();
  
      // Create related data if provided
      const promises = [];
  
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
  
      // Wait for all related data to be created
      await Promise.all(promises);
  
      return savedFish;
    } catch (error) {
      console.error('Error creating fish with data:', error);
      throw error;
    }
  }
  
  // Get fish with all related data
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
  
  // Get all fish for a specific device
  async function getFishByDevice(deviceId: string) {
    try {
      const fish = await Fish.find({ deviceId }).populate('deviceId');

      if(fish === null || fish.length === 0){
        return createErrorResponse({}, 'No fish foudn related to this device')
      }

      return createSuccessResponse(fish, 'Fish found')

    } catch (error) {
      console.error('Error getting fish by device:', error);
      return createErrorResponse(error, 'SOmething went wrong during the fetching of the fish related to the device:' + deviceId);
    }
  }


  export {
    createFishWithData,
    getFishWithAllData,
    getFishByDevice
}
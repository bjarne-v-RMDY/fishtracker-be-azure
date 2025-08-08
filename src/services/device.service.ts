import { Device } from "../db/models";
import { ApiResponse, createErrorResponse, createSuccessResponse } from "../lib/mongooseResponseFormatter";

export async function createDevice(deviceIdentifier: string): Promise<ApiResponse<any>> {
  try {
    const device = new Device({ deviceIdentifier });
    const saved = await device.save();
    return createSuccessResponse(saved, 'Device created successfully');
  } catch (error) {
    return createErrorResponse(error, 'Failed to create device');
  }
}

export async function getDevice(deviceIdentifier: string): Promise<ApiResponse<any>> {
  try {
    const device = await Device.findOne({ deviceIdentifier });
    if (!device) {
      return createErrorResponse({ message: 'Device has not been registered yet' }, 'Device has not been registered yet');
    }
    return createSuccessResponse(device, 'Device exists');
  } catch (error) {
    return createErrorResponse(error, 'Device has not been registered yet');
  }
}

export async function upsertDeviceWithFish(deviceIdentifier: string, fishData: any): Promise<ApiResponse<any>> {
  try {
    // Prepare the fish entry for the device
    const fishEntry = {
      fish: fishData.fishId, // Reference to the Fish model
      imageUrl: fishData.imageUrl,
      timestamp: new Date(fishData.timestamp),
      fishId: fishData.fishId
    };

    // Use findOneAndUpdate with upsert to create device if it doesn't exist
    const device = await Device.findOneAndUpdate(
      { deviceIdentifier },
      { 
        $push: { fish: fishEntry } // Add the fish to the fish array
      },
      { 
        upsert: true, // Create if doesn't exist
        new: true, // Return the updated document
        setDefaultsOnInsert: true // Set default values on insert
      }
    );

    return createSuccessResponse(device, 'Device updated with fish data successfully');
  } catch (error) {
    return createErrorResponse(error, 'Failed to upsert device with fish data');
  }
}
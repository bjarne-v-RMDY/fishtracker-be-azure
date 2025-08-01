
import { Device } from "../db/models";
import { ApiResponse, createErrorResponse, createSuccessResponse } from "../lib/mongooseResponseFormatter";


export async function createDevice(deviceIdentifier: string): Promise<ApiResponse> {
    try {
      const device = new Device({ deviceIdentifier });
      const savedDevice = await device.save();
      return createSuccessResponse(savedDevice, 'Device created successfully');
    } catch (error) {
      console.error('Error creating device:', error);
      return createErrorResponse(error, 'Failed to create device');
    }
  }
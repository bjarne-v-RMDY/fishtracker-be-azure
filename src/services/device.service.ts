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
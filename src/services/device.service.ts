import { Device } from "../db/models";
import { ApiResponse, effectifyPromise } from "../lib/mongooseResponseFormatter";
import * as Effect from "effect/Effect";

export function createDevice(deviceIdentifier: string): Effect.Effect<ApiResponse<any>, ApiResponse<any>, never> {
  return effectifyPromise(
    async () => {
      const device = new Device({ deviceIdentifier });
      return await device.save();
    },
    'Device created successfully',
    'Failed to create device'
  );
}

export function getDevice(deviceIdentifier: string): Effect.Effect<ApiResponse<any>, ApiResponse<any>, never> {
  return effectifyPromise(
    async () => {
      const device = await Device.findOne({ deviceIdentifier });
      if (!device) {
        throw { message: 'Device has not been registered yet' };
      }
      return device;
    },
    'Device exists',
    'Device has not been registered yet'
  );
}
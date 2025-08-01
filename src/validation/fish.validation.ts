import { z } from "zod";

// Fish validation
export const fishValidation = z.object({
  deviceId: z.string().min(1),
  name: z.string().min(1),
  captureTimestamp: z.coerce.date(),
  family: z.string().min(1),
  minSize: z.number().min(0),
  maxSize: z.number().min(0),
  waterType: z.enum(['Freshwater', 'Saltwater', 'Brackish']),
  description: z.string().min(1),
  colorDescription: z.string().min(1),
  depthRangeMin: z.number().min(0),
  depthRangeMax: z.number().min(0),
  environment: z.string().min(1),
  region: z.string().min(1),
  conservationStatus: z.enum([
    'Least Concern',
    'Near Threatened',
    'Vulnerable',
    'Endangered',
    'Critically Endangered',
    'Extinct in the Wild',
    'Extinct',
    'Data Deficient'
  ]),
  consStatusDescription: z.string().min(1),
  favoriteIndicator: z.boolean().optional(),
  aiAccuracy: z.number().min(0).max(100)
});

// FishImage validation
export const fishImageValidation = z.object({
  fishId: z.string().min(1),
  imageBlob: z.instanceof(Buffer)
});

// FishColor validation
export const fishColorValidation = z.object({
  fishId: z.string().min(1),
  colorName: z.string().min(1)
});

// Predator validation
export const predatorValidation = z.object({
  fishId: z.string().min(1),
  predatorName: z.string().min(1)
});

// FunFact validation
export const funFactValidation = z.object({
  fishId: z.string().min(1),
  fact: z.string().min(1)
});
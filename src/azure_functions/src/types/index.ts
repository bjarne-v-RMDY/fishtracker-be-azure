import { DetectedObjectOutput } from "@azure-rest/ai-vision-image-analysis"

export type ImageQueueData = {
    fishData: DetectedObjectOutput[],
    image: string,
    deviceId: string
}

export type ImageEnrichementQueueData = {
    imageToEnriche: string,
    deviceId: string,
}

export type FishType = {
    _id?: string;
    deviceId?: string; // Made optional since AI-analyzed fish don't need a device
    name: string;
    captureTimestamp: Date;
    family: string;
    minSize: number; 
    maxSize: number;
    waterType: 'Freshwater' | 'Saltwater' | 'Brackish';
    description: string;
    colorDescription: string;
    depthRangeMin: number;
    depthRangeMax: number;
    environment: string;
    region: string;
    conservationStatus:
      | 'Least Concern'
      | 'Near Threatened'
      | 'Vulnerable'
      | 'Endangered'
      | 'Critically Endangered'
      | 'Extinct in the Wild'
      | 'Extinct'
      | 'Data Deficient';
    consStatusDescription: string;
    favoriteIndicator?: boolean;
    aiAccuracy: number;
    createdAt?: Date;
    updatedAt?: Date;
  };
  
  export type FishColorType = {
    _id?: string;
    fishId: string; // references Fish._id
    colorName: string;
    createdAt?: Date;
    updatedAt?: Date;
  };
  
  export type PredatorType = {
    _id?: string;
    fishId: string; // references Fish._id
    predatorName: string;
    createdAt?: Date;
    updatedAt?: Date;
  };
  
  export type FunFactType = {
    _id?: string;
    fishId: string; // references Fish._id
    funFactDescription: string;
    createdAt?: Date;
    updatedAt?: Date;
  };
  
  // For createFishWithData input
  export type CreateFishWithDataInput = {
    fish: FishType;
    colors?: string[];
    predators?: string[];
    funFacts?: string[];
  };
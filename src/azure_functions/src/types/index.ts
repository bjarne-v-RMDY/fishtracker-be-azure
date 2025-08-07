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
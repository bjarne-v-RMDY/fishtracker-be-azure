import { DetectedObjectOutput } from "@azure-rest/ai-vision-image-analysis"

export type ImageQueueData = {
    fishData: DetectedObjectOutput[],
    image: string,
    deviceId: string
}
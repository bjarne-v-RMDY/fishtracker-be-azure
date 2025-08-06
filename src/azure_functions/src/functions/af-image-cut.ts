import { app, InvocationContext } from "@azure/functions";

export async function afImageCut(queueItem: unknown, context: InvocationContext): Promise<void> {
    context.log('Storage queue function processed work item:', queueItem);
}

app.storageQueue('af-image-cut', {
    queueName: 'image-cutting',
    connection: '',
    handler: afImageCut
});

import { QueueServiceClient } from '@azure/storage-queue'; // Import the QueueServiceClient


export const getMessageQueue = async () => {
    // Connection
    const connectionString = Bun.env.SA_CONNECTION_STRING;
    const connectionKey = Bun.env.SA_ACCESS_KEY;

    if (!connectionString || !connectionKey) {
        console.log('No .env detected')
        return;
    }

    try {
        // Create a QueueServiceClient
        const queueServiceClient = QueueServiceClient.fromConnectionString(connectionString);
        
        // Log the connection status
        console.log("Connecting to Azure Storage Queue for image cutting");
        
        // Check if the queue exists
        const queueClient = queueServiceClient.getQueueClient("image-cutting");
        const exists = await queueClient.exists();

        if (exists) {
            console.log("Successfully connected to the message queue.");

            const queue = await queueClient.peekMessages({numberOfMessages: 32})
            console.log(queue)
       
        } else {
            console.log("Queue does not exist.");
        }

    } catch (error) {
        console.error("Error connecting to the message queue:", error);
    }
};

getMessageQueue()
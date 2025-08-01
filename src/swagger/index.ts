export const openApiDoc = {
    openapi: "3.0.0",
    info: {
        title: "API Documentation",
        version: "1.0.0",
        description: "API documentation for FishTracker",
    },
    paths: {
        "/": {
            get: {
                summary: "Base endpoint",
                responses: {
                    "200": {
                        description: "Webpage",
                    },
                },
            },
        },
        "/device/register": {
            post: {
                summary: "Register a new device",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    id: {
                                        type: "string",
                                        description: "The unique identifier for the device",
                                    },
                                },
                                required: ["id"], // Specify required fields
                            },
                        },
                    },
                },
                responses: {
                    "201": {
                        description: "Device registered successfully",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        success: {
                                            type: "boolean",
                                            example: true,
                                        },
                                        message: {
                                            type: "string",
                                            example: "Device created successfully",
                                        },
                                    },
                                },
                            },
                        },
                    },
                    "400": {
                        description: "Validation error",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        error: {
                                            type: "string",
                                            example: "Validation error: ID is required and must be a string",
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        "/device/:id": {
            get: {
                summary: "Get device by ID",
                parameters: [
                    {
                        name: "id",
                        in: "path",
                        required: true,
                        schema: {
                            type: "string",
                        },
                        description: "The unique identifier for the device",
                    },
                ],
                responses: {
                    "200": {
                        description: "Device found",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        success: { type: "boolean", example: true },
                                        data: { type: "object" }, // Adjust as needed
                                    },
                                },
                            },
                        },
                    },
                    "400": {
                        description: "Validation error",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        error: { type: "string", example: "Validation error: ID is required and must be a string" },
                                    },
                                },
                            },
                        },
                    },
                    "404": {
                        description: "Device not found",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        success: { type: "boolean", example: false },
                                        message: { type: "string", example: "Device not found" },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        "/fish/all/{deviceId}": {
            get: {
                summary: "Get all fish by device ID",
                parameters: [
                    {
                        name: "deviceId",
                        in: "path",
                        required: true,
                        schema: {
                            type: "string",
                        },
                        description: "The unique identifier for the device",
                    },
                ],
                responses: {
                    "200": {
                        description: "Fish data retrieved successfully",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        success: { type: "boolean", example: true },
                                        data: { type: "array", items: { type: "object" } }, // Adjust as needed for fish data structure
                                    },
                                },
                            },
                        },
                    },
                    "400": {
                        description: "Validation error",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        error: { type: "string", example: "Validation error: deviceId is required and must be a string" },
                                    },
                                },
                            },
                        },
                    },
                    "404": {
                        description: "Device not found or no fish associated",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        success: { type: "boolean", example: false },
                                        message: { type: "string", example: "Device not found or no fish associated" },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
    },
};
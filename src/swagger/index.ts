export const openApiDoc = {
    openapi: "3.0.0",
    info: {
        title: "API Documentation",
        version: "1.0.0",
        description: "API documentation for FishTracker",
    },
    tags: [
        {
            name: "General",
            description: "General endpoints such as health checks and base endpoints."
        },
        {
            name: "Device",
            description: "Endpoints related to device management."
        },
        {
            name: "Fish",
            description: "Endpoints related to fish data and uploads."
        }
    ],
    paths: {
        "/": {
            get: {
                tags: ["General"],
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
                tags: ["Device"],
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
                tags: ["Device"],
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
                tags: ["Fish"],
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
        "/fish/upload": {
            post: {
                tags: ["Fish"],
                summary: "Upload a fish picture and deviceId, validate, and prepare for blob storage (not stored yet)",
                requestBody: {
                    required: true,
                    content: {
                        "multipart/form-data": {
                            schema: {
                                type: "object",
                                properties: {
                                    deviceId: {
                                        type: "string",
                                        description: "The unique identifier for the device",
                                    },
                                    file: {
                                        type: "string",
                                        format: "binary",
                                        description: "The fish image file to upload",
                                    },
                                },
                                required: ["deviceId", "file"],
                            },
                        },
                    },
                },
                responses: {
                    "200": {
                        description: "File validated and ready for blob storage.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        success: { type: "boolean", example: true },
                                        message: { type: "string", example: "File validated and ready for blob storage." },
                                        deviceId: { type: "string" },
                                        fileMeta: {
                                            type: "object",
                                            properties: {
                                                originalName: { type: "string" },
                                                mimeType: { type: "string" },
                                                size: { type: "integer" },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    "400": {
                        description: "Validation error or file error.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        success: { type: "boolean", example: false },
                                        message: { type: "string", example: "deviceId is not a string" },
                                    },
                                },
                            },
                        },
                    },
                    "404": {
                        description: "Device not found.",
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
    },
};
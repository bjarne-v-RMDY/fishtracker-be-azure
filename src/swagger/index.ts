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
        "/swagger/doc": {
            get: {
                summary: "Swagger doc",
                responses: {
                    "200": {
                        description: "Swagger docs",
                    },
                },
            },
        },
        "/swagger/ui": {
            get: {
                summary: "Swagger UI",
                responses: {
                    "200": {
                        description: "Swagger UI",
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
    },
};
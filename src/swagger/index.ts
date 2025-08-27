export const openApiDoc = {
    openapi: "3.0.0",
    info: {
        title: "FishTracker API Documentation",
        version: "1.0.0",
        description: "API documentation for FishTracker - A fish detection and tracking system",
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
        },
        {
            name: "Chat",
            description: "Endpoints related to AI chat functionality about detected fish."
        }
    ],
    components: {
        schemas: {
            Device: {
                type: "object",
                properties: {
                    deviceIdentifier: {
                        type: "string",
                        description: "Unique identifier for the device"
                    },
                    fish: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                fish: {
                                    type: "string",
                                    description: "Reference to the Fish model (ObjectId)"
                                },
                                imageUrl: {
                                    type: "string",
                                    description: "URL of the fish image"
                                },
                                timestamp: {
                                    type: "string",
                                    format: "date-time",
                                    description: "When the fish was detected"
                                },
                                fishId: {
                                    type: "string",
                                    description: "ID of the fish (ObjectId)"
                                }
                            }
                        }
                    },
                    createdAt: {
                        type: "string",
                        format: "date-time"
                    },
                    updatedAt: {
                        type: "string",
                        format: "date-time"
                    }
                }
            },
            Fish: {
                type: "object",
                properties: {
                    name: {
                        type: "string",
                        description: "Name of the fish"
                    },
                    family: {
                        type: "string",
                        description: "Fish family"
                    },
                    minSize: {
                        type: "number",
                        description: "Minimum size in cm"
                    },
                    maxSize: {
                        type: "number",
                        description: "Maximum size in cm"
                    },
                    waterType: {
                        type: "string",
                        enum: ["Freshwater", "Saltwater", "Brackish"],
                        description: "Type of water the fish lives in"
                    },
                    description: {
                        type: "string",
                        description: "General description of the fish"
                    },
                    colorDescription: {
                        type: "string",
                        description: "Description of the fish's colors"
                    },
                    depthRangeMin: {
                        type: "number",
                        description: "Minimum depth range in meters"
                    },
                    depthRangeMax: {
                        type: "number",
                        description: "Maximum depth range in meters"
                    },
                    environment: {
                        type: "string",
                        description: "Fish's natural environment"
                    },
                    region: {
                        type: "string",
                        description: "Geographical region where the fish is found"
                    },
                    conservationStatus: {
                        type: "string",
                        enum: ["Least Concern", "Near Threatened", "Vulnerable", "Endangered", "Critically Endangered", "Extinct in the Wild", "Extinct", "Data Deficient"],
                        description: "Conservation status of the fish"
                    },
                    consStatusDescription: {
                        type: "string",
                        description: "Detailed description of conservation status"
                    },
                    favoriteIndicator: {
                        type: "boolean",
                        description: "Whether the fish is marked as favorite"
                    },
                    aiAccuracy: {
                        type: "number",
                        description: "AI detection accuracy percentage"
                    }
                }
            },
            ApiResponse: {
                type: "object",
                properties: {
                    success: {
                        type: "boolean",
                        description: "Whether the operation was successful"
                    },
                    message: {
                        type: "string",
                        description: "Response message"
                    },
                    data: {
                        type: "object",
                        description: "Response data"
                    }
                }
            }
        }
    },
    paths: {
        "/device/{id}": {
            get: {
                tags: ["Device"],
                summary: "Get device by ID",
                parameters: [
                    {
                        name: "id",
                        in: "path",
                        required: true,
                        schema: {
                            type: "string"
                        },
                        description: "Device identifier"
                    }
                ],
                responses: {
                    "200": {
                        description: "Device found",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/ApiResponse"
                                }
                            }
                        }
                    },
                    "400": {
                        description: "Invalid device ID",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/ApiResponse"
                                }
                            }
                        }
                    },
                    "404": {
                        description: "Device not found",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/ApiResponse"
                                }
                            }
                        }
                    }
                }
            }
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
                                    deviceId: {
                                        type: "string",
                                        description: "Device identifier"
                                    }
                                },
                                required: ["deviceId"]
                            }
                        }
                    }
                },
                responses: {
                    "201": {
                        description: "Device registered successfully",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/ApiResponse"
                                }
                            }
                        }
                    },
                    "400": {
                        description: "Invalid request",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/ApiResponse"
                                }
                            }
                        }
                    }
                }
            }
        },
        "/chat/{deviceId}": {
            post: {
                tags: ["Chat"],
                summary: "Chat with AI about detected fish",
                parameters: [
                    {
                        name: "deviceId",
                        in: "path",
                        required: true,
                        schema: {
                            type: "string"
                        },
                        description: "Device identifier"
                    }
                ],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    message: {
                                        type: "string",
                                        description: "Question about the fish"
                                    }
                                },
                                required: ["message"]
                            }
                        }
                    }
                },
                responses: {
                    "200": {
                        description: "Chat response received",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        success: {
                                            type: "boolean"
                                        },
                                        data: {
                                            type: "object",
                                            properties: {
                                                response: {
                                                    type: "string",
                                                    description: "AI's response to the question"
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "400": {
                        description: "Invalid request",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/ApiResponse"
                                }
                            }
                        }
                    },
                    "500": {
                        description: "Server error",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/ApiResponse"
                                }
                            }
                        }
                    }
                }
            }
        },
        "/fish/{deviceId}": {
            get: {
                tags: ["Fish"],
                summary: "Get all fish for a specific device",
                parameters: [
                    {
                        name: "deviceId",
                        in: "path",
                        required: true,
                        schema: {
                            type: "string"
                        },
                        description: "Device identifier"
                    }
                ],
                responses: {
                    "200": {
                        description: "Fish data retrieved successfully",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/ApiResponse"
                                }
                            }
                        }
                    },
                    "400": {
                        description: "Invalid device ID",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/ApiResponse"
                                }
                            }
                        }
                    },
                    "404": {
                        description: "Device not found or no fish data",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/ApiResponse"
                                }
                            }
                        }
                    }
                }
            }
        },
        "/fish/image/{imagePath}": {
            get: {
                tags: ["Fish"],
                summary: "Get a fish image by path",
                parameters: [
                    {
                        name: "imagePath",
                        in: "path",
                        required: true,
                        schema: {
                            type: "string"
                        },
                        description: "Path to the image in blob storage"
                    }
                ],
                responses: {
                    "200": {
                        description: "Image retrieved successfully",
                        content: {
                            "image/*": {
                                schema: {
                                    type: "string",
                                    format: "binary"
                                }
                            }
                        }
                    },
                    "400": {
                        description: "Invalid image path",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/ApiResponse"
                                }
                            }
                        }
                    },
                    "404": {
                        description: "Image not found",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/ApiResponse"
                                }
                            }
                        }
                    },
                    "500": {
                        description: "Server error",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/ApiResponse"
                                }
                            }
                        }
                    }
                }
            }
        },
        "/fish/upload": {
            post: {
                tags: ["Fish"],
                summary: "Upload a fish picture",
                requestBody: {
                    required: true,
                    content: {
                        "multipart/form-data": {
                            schema: {
                                type: "object",
                                properties: {
                                    deviceId: {
                                        type: "string",
                                        description: "Device identifier"
                                    },
                                    file: {
                                        type: "string",
                                        format: "binary",
                                        description: "Fish image file"
                                    }
                                },
                                required: ["deviceId", "file"]
                            }
                        }
                    }
                },
                responses: {
                    "200": {
                        description: "File uploaded successfully",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/ApiResponse"
                                }
                            }
                        }
                    },
                    "400": {
                        description: "Invalid request",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/ApiResponse"
                                }
                            }
                        }
                    }
                }
            }
        }
    }
};
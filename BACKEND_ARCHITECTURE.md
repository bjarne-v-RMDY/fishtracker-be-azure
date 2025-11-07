# FishTracker Backend Architecture Documentation

## Table of Contents
1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Data Flow](#data-flow)
4. [Database Models](#database-models)
5. [API Endpoints](#api-endpoints)
6. [Azure Functions (Serverless)](#azure-functions-serverless)
7. [Utility Functions & Services](#utility-functions--services)
8. [Key Workflows](#key-workflows)
9. [Environment Variables](#environment-variables)

---

## Overview

FishTracker is a fish detection and tracking system that uses AI to identify fish from uploaded images. The system consists of:
- **REST API** - Handles device registration, fish data, and chat functionality
- **Azure Functions** - Serverless workers for image processing and AI enrichment
- **MongoDB Database** - Stores devices, fish data, and relationships
- **Azure Services** - Blob Storage, Queue Storage, Vision API, OpenAI

---

## System Architecture

```
┌─────────────┐
│   Client    │ (Mobile App / Web)
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────┐
│           REST API Server               │
│  - Device Management                    │
│  - Fish Upload & Retrieval              │
│  - AI Chat Interface                    │
└──────┬──────────────────────────────────┘
       │
       ├──────────────┬──────────────┬──────────────┐
       ▼              ▼              ▼              ▼
┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
│ MongoDB  │   │  Azure   │   │  Azure   │   │  Azure   │
│ Database │   │  Blob    │   │  Queue   │   │  Vision  │
│          │   │ Storage  │   │ Storage  │   │   API    │
└──────────┘   └──────────┘   └────┬─────┘   └──────────┘
                                    │
                                    ▼
                          ┌──────────────────┐
                          │ Azure Functions  │
                          │ (Image Workers)  │
                          └──────────────────┘
                                    │
                                    ▼
                          ┌──────────────────┐
                          │  Azure OpenAI    │
                          │   (GPT-4 Vision) │
                          └──────────────────┘
```

---

## Data Flow

### Primary Flow: Image Upload to Fish Detection

```
1. Client uploads image + deviceId
   ↓
2. API validates device exists
   ↓
3. Azure Vision API detects objects
   ↓
4. Filter for fish-like objects (confidence > 65%)
   ↓
5. If fish detected:
   - Cut fish from image
   - Upload to Azure Blob Storage
   - Add message to Queue
   ↓
6. Azure Function (af-image-cut) processes queue:
   - Downloads image from blob
   - Cuts out fish regions
   - Uploads cut images
   - Adds to enrichment queue
   ↓
7. Azure Function (af-image-enrichement) processes:
   - Downloads cut fish image
   - Sends to GPT-4 Vision for identification
   - Checks if fish species already exists
   - If exists: Add to device with rate limiting (10s)
   - If new: Get full fish data from AI and create new fish record
   ↓
8. Fish data stored in MongoDB
   ↓
9. Device updated with fish reference
```

---

## Database Models

### Device Model
Represents a physical device (e.g., underwater camera).

**Fields:**
- `deviceIdentifier` (String, unique) - Unique device ID
- `fish` (Array) - List of fish detected by this device
  - `fish` (ObjectId) - Reference to Fish model
  - `imageUrl` (String) - URL/path to the fish image in blob storage
  - `timestamp` (Date) - When the fish was detected
  - `fishId` (ObjectId) - Duplicate reference for easier querying
- `createdAt` (Date) - Auto-generated
- `updatedAt` (Date) - Auto-generated

### Fish Model
Represents a fish species with all its characteristics.

**Fields:**
- `name` (String) - Common name of the fish
- `family` (String) - Taxonomic family
- `minSize` (Number) - Minimum size in cm
- `maxSize` (Number) - Maximum size in cm
- `waterType` (Enum) - "Freshwater", "Saltwater", or "Brackish"
- `description` (String) - General description
- `colorDescription` (String) - Description of colors/patterns
- `depthRangeMin` (Number) - Minimum depth in meters
- `depthRangeMax` (Number) - Maximum depth in meters
- `environment` (String) - Natural habitat description
- `region` (String) - Geographic region
- `conservationStatus` (Enum) - IUCN status (e.g., "Least Concern", "Endangered")
- `consStatusDescription` (String) - Details about conservation status
- `favoriteIndicator` (Boolean) - User favorite flag
- `aiAccuracy` (Number) - AI detection confidence (0-100)
- `captureTimestamp` (Date) - When first detected
- `createdAt` (Date) - Auto-generated
- `updatedAt` (Date) - Auto-generated

### Supporting Models
- **FishImage** - Stores fish images as binary blobs
- **FishColor** - Individual color entries for a fish
- **Predator** - Predators of a fish species
- **FunFact** - Interesting facts about a fish species

---

## API Endpoints

### Device Endpoints

#### `GET /api/device/:id`
**Purpose:** Retrieve device information by ID

**Parameters:**
- `id` (path) - Device identifier

**Response:**
```json
{
  "success": true,
  "message": "Device exists",
  "data": {
    "deviceIdentifier": "device123",
    "fish": [...],
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
}
```

**Flow:**
1. Validate device ID format
2. Query MongoDB for device
3. Return device data or 404 if not found

---

#### `POST /api/device/register`
**Purpose:** Register a new device

**Request Body:**
```json
{
  "deviceId": "device123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Device created successfully",
  "data": { ... }
}
```

**Flow:**
1. Validate deviceId is a string
2. Create new device in MongoDB
3. Return created device

---

#### `POST /api/device/:deviceId/add`
**Purpose:** Add fish data to a device (used by Azure Functions)

**Parameters:**
- `deviceId` (path) - Device identifier

**Request Body:**
```json
{
  "fishName": "Clownfish",
  "fish": { /* full fish object */ },
  "imageUrl": "path/to/image.jpg",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "fishId": "507f1f77bcf86cd799439011"
}
```

**Flow:**
1. Validate device ID
2. Validate all required fields present
3. Upsert device (create if doesn't exist)
4. Push fish entry to device's fish array
5. Return updated device

---

### Fish Endpoints

#### `GET /api/fish/:deviceId`
**Purpose:** Get all fish detected by a specific device

**Parameters:**
- `deviceId` (path) - Device identifier

**Response:**
```json
{
  "success": true,
  "message": "Fish found for device",
  "data": [
    {
      "fish": { /* full fish details */ },
      "imageUrl": "/api/fish/image/path%2Fto%2Fimage.jpg",
      "timestamp": "2025-01-01T00:00:00.000Z"
    }
  ]
}
```

**Flow:**
1. Validate device ID
2. Check device exists
3. Query device and populate fish references
4. Add image proxy URLs
5. Return fish array

---

#### `GET /api/fish/name/:fishName`
**Purpose:** Check if a fish species exists in the database

**Parameters:**
- `fishName` (path) - Name of the fish to check

**Response:**
```json
{
  "success": true,
  "data": {
    "name": "Clownfish",
    "known": true,
    /* ...other fish fields if found */
  }
}
```

**Flow:**
1. Query Fish collection by name
2. If found: Return fish data with `known: true`
3. If not found: Return `known: false`

**Usage:** Azure Function uses this to avoid re-analyzing known fish species

---

#### `POST /api/fish/add-existing/:deviceId/:fishName`
**Purpose:** Add an already-known fish species to a device

**Parameters:**
- `deviceId` (path) - Device identifier
- `fishName` (path) - Name of the fish

**Request Body:**
```json
{
  "imageUrl": "path/to/image.jpg"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Fish successfully added to device",
  "data": {
    "deviceId": "device123",
    "fishId": "507f1f77bcf86cd799439011",
    "fishName": "Clownfish",
    "skipped": false
  }
}
```

**Flow:**
1. Validate device exists
2. Find fish by name
3. **Rate Limiting:** Check if same fish was seen within last 10 seconds
4. If rate limited: Return with `skipped: true`
5. If not rate limited: Add fish to device
6. Return result

**Important:** This prevents spam when the same fish is detected multiple times in quick succession.

---

#### `GET /api/fish/image/*`
**Purpose:** Proxy endpoint to serve fish images from Azure Blob Storage

**Parameters:**
- `*` (path) - Full path to image in blob storage

**Response:** Binary image data with appropriate Content-Type header

**Flow:**
1. Extract image path from URL
2. Connect to Azure Blob Storage
3. Check if blob exists
4. Download blob to buffer
5. Return image with proper headers and caching (1 hour)

**Why needed:** Provides a unified API for image access and adds caching layer

---

#### `POST /api/fish/process-fish-registration`
**Purpose:** Register a new fish species (called by Azure Functions after AI analysis)

**Request Body:**
```json
{
  "fishData": {
    "name": "Clownfish",
    "family": "Pomacentridae",
    "minSize": 7,
    "maxSize": 11,
    "waterType": "Saltwater",
    /* ...all other fish fields */
  }
}
```

**Flow:**
1. Validate fish data has required fields
2. Check if fish already exists by name
3. If exists: Return existing fish
4. If new: Create fish with all related data
5. Return created/existing fish

---

#### `POST /api/fish/upload`
**Purpose:** Upload a fish image for detection and analysis

**Request:** Multipart form-data
- `deviceId` (string) - Device identifier
- `file` (binary) - Image file

**Response:**
```json
{
  "success": true,
  "message": "File validated and put into message queue",
  "deviceId": "device123",
  "fileMeta": {
    "originalName": "fish.jpg",
    "mimeType": "image/jpeg",
    "size": 245678
  },
  "fish": {
    "fishDetected": true,
    "data": [ /* detected fish objects */ ]
  }
}
```

**Flow:**
1. Parse multipart form data
2. Validate deviceId and file
3. Check device exists in database
4. **Call Azure Vision API** to detect objects
5. Filter detected objects for fish (confidence > 65%)
6. If no fish: Return empty array
7. If fish detected:
   - Cut fish regions from image
   - Upload to Azure Blob Storage
   - Add message to Azure Queue for processing
8. Return detection results

**This is the main entry point for the fish detection workflow!**

---

### Chat Endpoints

#### `POST /api/chat/:deviceId`
**Purpose:** Chat with AI about fish detected by a device

**Parameters:**
- `deviceId` (path) - Device identifier

**Request Body:**
```json
{
  "message": "What types of fish have I seen and where do they live?"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully processed chat request",
  "data": {
    "response": "Based on your device's detections, you've seen 3 types of fish: Clownfish, Blue Tang, and Angelfish. Clownfish live in coral reefs..."
  }
}
```

**Flow:**
1. Validate device ID
2. Retrieve device and populate all fish data
3. Format fish data into context for AI
4. Create system prompt with all fish details:
   - Name, family, size, water type
   - Description, habitat, diet
   - Conservation status
   - Detection timestamp
5. Send user message + context to Azure OpenAI (GPT-4)
6. Return AI's response

**Key Feature:** AI has full context of all fish detected by the device, allowing intelligent answers about the user's specific detections.

---

## Azure Functions (Serverless)

### Function 1: af-image-cut
**Trigger:** Azure Queue Storage message on `image-cut` queue

**Purpose:** Cut detected fish regions from uploaded images

**Input Message:**
```json
{
  "imageUrl": "path/to/original-image.jpg",
  "fishObjects": [
    {
      "boundingBox": { "x": 100, "y": 150, "w": 200, "h": 180 },
      "tags": [{ "name": "fish", "confidence": 0.85 }]
    }
  ],
  "deviceId": "device123"
}
```

**Flow:**
1. Download original image from Azure Blob Storage
2. For each detected fish object:
   - Extract bounding box coordinates
   - Crop image to that region using Sharp (image processing library)
   - Generate unique filename
   - Upload cropped image to blob storage
3. For each cropped fish:
   - Add message to `image-enrichement` queue with:
     - Path to cropped image
     - Device ID
4. Complete successfully

**Output:** Cropped fish images in blob storage + messages in enrichment queue

---

### Function 2: af-image-enrichement
**Trigger:** Azure Queue Storage message on `image-enrichement` queue

**Purpose:** Use AI to identify fish species and enrich with data

**Input Message:**
```json
{
  "imageToEnriche": "path/to/cropped-fish.jpg",
  "deviceId": "device123"
}
```

**Flow:**

#### Step 1: Get Fish Name
1. Download cropped fish image from blob storage
2. Resize image to 1024x1024 (optimize for API)
3. Convert to base64 JPEG
4. Send to Azure OpenAI (GPT-4 Vision) with prompt:
   - "Identify the fish species in this image"
   - Returns JSON: `{ "fishName": "Clownfish" }`
5. Parse fish name from response

#### Step 2: Check if Fish Exists
1. Call API endpoint: `GET /api/fish/name/{fishName}`
2. If fish exists (`known: true`):
   - **Rate Limiting Path:**
   - Call `POST /api/fish/add-existing/{deviceId}/{fishName}`
   - This adds fish to device (with 10-second rate limiting)
   - **Exit function** (no need for full AI analysis)

#### Step 3: Full AI Enrichment (New Fish)
1. Send image to Azure OpenAI with detailed prompt requesting:
   - Scientific classification
   - Size range
   - Habitat and environment
   - Diet and behavior
   - Conservation status
   - Color description
   - Depth range
   - Geographic region
   - AI confidence score
2. Parse structured JSON response

#### Step 4: Register New Fish
1. Call `POST /api/fish/process-fish-registration` with fish data
2. Receive created fish record with database ID

#### Step 5: Add to Device
1. Call `POST /api/device/{deviceId}/add` with:
   - Fish name
   - Full fish object
   - Image URL
   - Timestamp
   - Fish ID
2. Complete successfully

**Environment Detection:**
- Uses `WEBSITE_INSTANCE_ID` environment variable
- If present: Running in Azure (use production API URL)
- If absent: Running locally (use localhost URL)

**Error Handling:**
- Retries automatically (Azure Queue default behavior)
- Logs all steps for debugging
- Gracefully handles parsing errors

---

## Utility Functions & Services

### mongooseResponseFormatter
**Purpose:** Standardize API responses

**Functions:**
- `createSuccessResponse(data, message)` - Returns `{ success: true, data, message }`
- `createErrorResponse(error, message)` - Returns `{ success: false, message, error }`

**Why:** Consistent response format across all endpoints makes client development easier

---

### fishDetection.ts - handleFishDetection()
**Purpose:** Detect fish in uploaded images using Azure Vision API

**Parameters:**
- `image` (ArrayBuffer) - Image binary data
- `deviceId` (string) - Device identifier

**Process:**
1. Connect to Azure Vision API
2. Send image for object detection
3. Filter results for fish-related objects using keywords:
   - "fish", "aquatic", "marine", etc.
4. Filter by confidence (> 65%)
5. If fish found:
   - Call `handleImageCutMessageQueue()` to queue for processing
6. Return detection results

**Returns:**
```json
{
  "success": true,
  "data": {
    "fishDetected": true,
    "data": [ /* fish objects with bounding boxes */ ]
  }
}
```

---

### handleImageCutMessageQueue()
**Purpose:** Add detected fish to Azure Queue for cutting and processing

**Parameters:**
- `fishObjects` (Array) - Detected fish with bounding boxes
- `image` (ArrayBuffer) - Original image
- `deviceId` (string) - Device identifier

**Process:**
1. Generate unique filename for original image
2. Upload original image to Azure Blob Storage
3. Create queue message with:
   - Image URL
   - Fish objects (bounding boxes)
   - Device ID
4. Add message to `image-cut` queue
5. Return success

**Why separate function:** Decouples detection from processing, allows async handling

---

### validateDeviceId()
**Purpose:** Validate device ID format

**Validation:**
- Must be a string
- Must not be empty
- Must be trimmed

**Returns:**
```json
{
  "success": true,
  "id": "device123"
}
// or
{
  "success": false,
  "error": { "message": "Invalid device ID" }
}
```

---

### Device Service Functions

#### createDevice(deviceIdentifier)
Creates a new device in the database.

#### getDevice(deviceIdentifier)
Retrieves a device by its identifier.

#### upsertDeviceWithFish(deviceIdentifier, fishData)
Creates device if doesn't exist, then adds fish to its array.

---

### Fish Service Functions

#### createFishWithData(fishData)
Creates a fish and all related data (colors, predators, fun facts).

#### checkAndCreateFish(fishData)
Checks if fish exists by name, creates if it doesn't.

#### processFishRegistration(fishData)
Main function for registering new fish species.

#### getFishByDevice(deviceId)
Gets all fish detected by a specific device with populated data.

#### checkFishByName(fishName)
Checks if a fish species exists in the database.

#### addExistingFishToDevice(deviceId, fishName, imageUrl)
Adds a known fish species to a device with rate limiting.

---

### Chat Service Functions

#### getFishDataAndChat(deviceIdentifier, userMessage)
**Purpose:** Enable AI chat about detected fish

**Process:**
1. Retrieve device and populate all fish data
2. Format fish data into structured context
3. Build system prompt with all fish details
4. Send to Azure OpenAI with user's question
5. Return AI response

**Context includes:**
- All fish detected by the device
- Full details: name, habitat, diet, size, etc.
- Detection timestamps

---

## Key Workflows

### Complete Fish Detection Workflow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. CLIENT UPLOADS IMAGE                                     │
│    POST /api/fish/upload                                    │
│    - deviceId: "device123"                                  │
│    - file: image.jpg                                        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. API VALIDATES & DETECTS                                  │
│    - Check device exists                                    │
│    - Send to Azure Vision API                               │
│    - Filter for fish (confidence > 65%)                     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. QUEUE IMAGE FOR PROCESSING                               │
│    - Upload original image to blob storage                  │
│    - Add message to "image-cut" queue                       │
│    - Return detection results to client                     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. AZURE FUNCTION: af-image-cut                             │
│    - Download original image                                │
│    - Crop each fish region                                  │
│    - Upload cropped images                                  │
│    - Add to "image-enrichement" queue                       │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. AZURE FUNCTION: af-image-enrichement                     │
│    Step 1: Identify fish name (GPT-4 Vision)                │
│    Step 2: Check if fish exists in database                 │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
        ▼                         ▼
┌──────────────────┐    ┌──────────────────────────────────┐
│ FISH EXISTS      │    │ NEW FISH                         │
│ - Add to device  │    │ - Get full data from GPT-4       │
│ - Rate limit     │    │ - Create fish in database        │
│   (10 seconds)   │    │ - Add to device                  │
└──────────────────┘    └──────────────────────────────────┘
        │                         │
        └────────────┬────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. FISH STORED IN DATABASE                                  │
│    - Fish record in Fish collection                         │
│    - Device updated with fish reference                     │
│    - Image stored in blob storage                           │
└─────────────────────────────────────────────────────────────┘
```

### Rate Limiting Logic

**Problem:** Same fish detected multiple times in quick succession

**Solution:** 10-second rate limiting per fish species per device

**Implementation:**
```
When adding existing fish to device:
1. Get all entries for this fish type on this device
2. Sort by timestamp (newest first)
3. Check if most recent entry < 10 seconds ago
4. If yes: Skip adding, return { skipped: true }
5. If no: Add fish entry normally
```

**Why 10 seconds:** Balances between avoiding spam and capturing legitimate multiple detections

---

## Environment Variables

### API Server
```
PORT=3000
MONGODB_URI=mongodb://...
VISION_ENDPOINT=https://...
VISION_KEY=...
SA_CONNECTION_STRING=DefaultEndpointsProtocol=https;...
AZURE_OPENAI_API_KEY=...
OPENAI_ENDPOINT=https://...
```

### Azure Functions
```
AZURE_OPENAI_API_KEY=...
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;...
WEBSITE_INSTANCE_ID=(auto-set by Azure, indicates production)
```

---

## Important Design Decisions

### 1. Why Two-Step Fish Identification?
**Step 1:** Get just the fish name (fast, cheap)
**Step 2:** Only get full details if fish is new

**Reason:** 
- Saves API costs (GPT-4 Vision is expensive)
- Faster for known fish
- Reduces redundant data generation

### 2. Why Queue-Based Processing?
**Instead of:** Synchronous processing during upload

**Benefits:**
- Upload endpoint returns immediately
- Processing happens asynchronously
- Automatic retries on failure
- Scales independently
- Handles traffic spikes

### 3. Why Separate Cut and Enrichment Functions?
**Could be:** One function does everything

**Separation benefits:**
- Cut function is fast, enrichment is slow
- Can scale differently
- Easier to debug
- Failed enrichment doesn't require re-cutting

### 4. Why Rate Limiting on Fish Additions?
**Problem:** Camera might detect same fish 10 times in 5 seconds

**Solution:** Only add if last detection was > 10 seconds ago

**Result:** Clean data without spam

### 5. Why Image Proxy Endpoint?
**Could be:** Return blob storage URLs directly

**Proxy benefits:**
- Hides blob storage implementation
- Adds caching layer
- Centralizes access control
- Easier to migrate storage later

---

## Common Integration Points

### For Mobile App Developers

**Basic Flow:**
1. Register device: `POST /api/device/register`
2. Upload images: `POST /api/fish/upload`
3. Get fish for device: `GET /api/fish/:deviceId`
4. Chat about fish: `POST /api/chat/:deviceId`

**Image Display:**
- Use image URLs from API responses
- They point to proxy: `/api/fish/image/...`
- Images are cached for 1 hour

**Error Handling:**
- All responses have `success` boolean
- Check `success` before accessing `data`
- Display `message` to user on errors

### For .NET Developers

**Key Concepts to Implement:**

1. **Async/Await Pattern:**
   - All database operations are async
   - All HTTP requests are async
   - Use Task<T> return types

2. **Dependency Injection:**
   - Services (DeviceService, FishService, ChatService)
   - Database context
   - HTTP clients for Azure services

3. **DTOs (Data Transfer Objects):**
   - ApiResponse<T> for all responses
   - Separate models for requests/responses

4. **Middleware:**
   - Logging
   - Error handling
   - CORS if needed

5. **Azure SDK Integration:**
   - Azure.Storage.Blobs for blob storage
   - Azure.Storage.Queues for queue storage
   - Azure.AI.Vision for vision API
   - Azure.AI.OpenAI for GPT-4

6. **Background Services:**
   - Azure Functions = Azure Functions in .NET
   - Same trigger types (Queue, Blob, HTTP)

---

## Testing Recommendations

### Unit Tests
- Service functions (fish creation, device management)
- Validation functions
- Response formatters

### Integration Tests
- API endpoints with test database
- Azure service mocks
- Queue message handling

### E2E Tests
- Full upload flow with real Azure services (dev environment)
- Chat functionality
- Rate limiting behavior

---

## Common Pitfalls to Avoid

1. **Forgetting Rate Limiting:**
   - Always check last detection time before adding fish
   - 10-second window is critical

2. **Not Handling Queue Failures:**
   - Azure Functions retry automatically
   - But log errors for monitoring
   - Consider dead letter queues

3. **Image Path Encoding:**
   - Always URL encode image paths
   - Blob storage paths can have special characters

4. **Environment Detection:**
   - Check `WEBSITE_INSTANCE_ID` correctly
   - Local vs production API URLs matter

5. **Database Population:**
   - Always populate fish references when querying devices
   - Otherwise you get ObjectIds instead of fish data

6. **Async/Await:**
   - Don't forget await on database operations
   - Don't forget await on HTTP requests
   - Missing await = race conditions

---

## Performance Considerations

### Database Queries
- Index on `deviceIdentifier` (unique)
- Index on `fish.name` for lookups
- Use `.populate()` wisely (can be slow)

### Image Processing
- Resize images before sending to AI (1024x1024)
- Use JPEG compression (quality: 85)
- Cache image responses (1 hour)

### API Rate Limits
- Azure OpenAI has rate limits
- Azure Vision API has rate limits
- Consider retry logic with exponential backoff

### Queue Processing
- Functions process messages in parallel
- Scale out automatically under load
- Monitor queue length

---

## Monitoring & Debugging

### What to Log
- All API requests (middleware)
- Azure Function start/end
- AI API calls (request/response)
- Database errors
- Queue message processing

### Key Metrics
- Upload success rate
- Fish detection accuracy
- Processing time per image
- Queue message age
- API response times

### Common Issues
- **Fish not detected:** Check confidence threshold (65%)
- **Function timeout:** Increase function timeout setting
- **Connection refused:** Check API URL environment variable
- **Rate limiting triggered:** Check 10-second window logic

---

## Summary

This backend is designed as a **microservices architecture** with:
- **REST API** for client communication
- **Azure Functions** for async processing
- **Queue-based workflow** for reliability
- **AI integration** for fish identification
- **Rate limiting** for data quality
- **Caching** for performance

The key insight is the **two-step identification process**:
1. Quick name check (is fish known?)
2. Full AI analysis only for new fish

This saves costs and improves performance while maintaining accuracy.

---

## Questions for .NET Implementation

1. **Entity Framework Core** for database?
2. **ASP.NET Core** for REST API?
3. **Azure Functions** for serverless?
4. **Dependency Injection** for services?
5. **DTOs** for request/response?
6. **AutoMapper** for model mapping?
7. **Serilog** for logging?

These are the .NET equivalents of the patterns used in this TypeScript implementation.

Good luck with your .NET recreation! 🐠


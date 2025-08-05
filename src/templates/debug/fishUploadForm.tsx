export const FishUploadForm = () => (
    <div>
        <div class="font-bold text-white mb-2">Fish Upload</div>
        <form
            id="fish-upload-form"
            class="space-y-2"
            enctype="multipart/form-data"
            hx-post="/api/fish/upload"
            hx-target="#api-result"
            hx-swap="innerHTML"
        >
            <input
                type="text"
                name="deviceId"
                placeholder="Device ID"
                class="w-full px-3 py-2 bg-gray-800 border border-gray-600 text-white rounded"
                required
            />
            <input
                type="file"
                name="file"
                accept="image/*"
                class="w-full text-white border border-gray-600 rounded bg-gray-800 p-2 cursor-pointer"
                required
            />
            <button
                type="submit"
                class="border border-green-500 text-white px-4 py-2 w-full"
            >
                Upload Fish Picture
            </button>
        </form>
    </div>
);
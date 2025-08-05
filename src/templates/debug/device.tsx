export const DeviceButtons = () => (
    <div>
        <div class="font-bold text-white mb-2">Device</div>
        <div class="mb-3">
            <input
                type="text"
                id="device-id-input"
                placeholder="Enter device ID"
                class="w-full px-3 py-2 bg-gray-800 border border-gray-600 text-white rounded focus:border-blue-500 focus:outline-none"
            />
        </div>
        <button
            class="border border-blue-500 text-white px-4 py-2 w-full"
            onclick="fetchDeviceData()"
        >
            Get Device
        </button>
    </div>
);
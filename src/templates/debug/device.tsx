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
            class="border border-blue-500 text-white px-4 py-2 w-full mb-3"
            onclick="fetchDevice()"
        >
            Get Device
        </button>

        <form
            hx-post="/api/device/register"
            hx-target="#api-result"
            hx-ext="json-enc"
            class="mb-3"
        >
            <div class="mb-3">
                <input
                    type="text"
                    name="deviceId"
                    placeholder="Enter device ID"
                    class="w-full px-3 py-2 bg-gray-800 border border-gray-600 text-white rounded focus:border-blue-500 focus:outline-none"
                    required
                />
            </div>
            <button type="submit" class="border border-blue-500 text-white px-4 py-2 w-full mb-3">
                Register Device
            </button>
        </form>

        <script src="https://unpkg.com/htmx.org/dist/ext/json-enc.js"></script>
        <script
            dangerouslySetInnerHTML={{
                __html: `
                    function fetchDevice() {
                        let deviceId = document.getElementById("device-id-input").value.trim();
                        if (!deviceId) {
                            deviceId = "id"; // default fallback
                        }
                        
                        htmx.ajax('GET', '/api/device/' + encodeURIComponent(deviceId), {
                            target: '#api-result',
                            swap: 'innerHTML'
                        });
                    }
                `
            }}
        ></script>
    </div>
);
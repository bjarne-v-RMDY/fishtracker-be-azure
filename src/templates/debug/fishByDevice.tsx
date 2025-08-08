export const FishByDeviceForm = () => (
    <div>
        <div class="font-bold text-white mb-2">Fish by Device</div>
        <div class="mb-3">
            <input
                type="text"
                id="fish-device-id-input"
                placeholder="Enter device ID"
                class="w-full px-3 py-2 bg-gray-800 border border-gray-600 text-white rounded focus:border-blue-500 focus:outline-none"
            />
        </div>
        <button
            class="border border-green-500 text-white px-4 py-2 w-full mb-3"
            onclick="fetchFishByDevice()"
        >
            Get Fish by Device
        </button>

        <script
            dangerouslySetInnerHTML={{
                __html: `
                    function fetchFishByDevice() {
                        let deviceId = document.getElementById("fish-device-id-input").value.trim();
                        if (!deviceId) {
                            alert("Please enter a device ID");
                            return;
                        }
                        
                        htmx.ajax('GET', '/api/fish/' + encodeURIComponent(deviceId), {
                            target: '#api-result',
                            swap: 'innerHTML'
                        });
                    }
                `
            }}
        ></script>
    </div>
);

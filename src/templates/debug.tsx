import { Layout } from ".";

const GeneralButtons = () => (
  <div class="mb-6">
    <div class="font-bold text-white mb-2">General</div>
    <button
      class="border border-red-500 text-white px-4 py-2 w-full"
      hx-get="/api/health"
      hx-target="#api-result"
      hx-swap="innerHTML"
    >
      API Status
    </button>
  </div>
);

const DeviceButtons = () => (
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

const DebugScript = () => (
  <script
    dangerouslySetInnerHTML={{
      __html: `
        function fetchDeviceData() {
          let deviceId = document.getElementById("device-id-input").value.trim();
          if (!deviceId) {
            deviceId = "id"
          }
          
          // Use htmx to make the request
          htmx.ajax('GET', '/api/device/' + encodeURIComponent(deviceId), {
            target: '#api-result',
            swap: 'innerHTML'
          });
        }

        function handleResponse(event) {
          const target = document.getElementById("api-result");
          const responseText = event.detail.xhr.responseText;
          const status = event.detail.xhr.status;
                     
          try {
            const json = JSON.parse(responseText);
            const statusColor = status >= 400 ? 'text-red-400' : 'text-green-400';
            target.innerHTML = \`
              <div class="\${statusColor} mb-2">HTTP \${status}</div>
              <pre style='white-space:pre-wrap'>\${JSON.stringify(json, null, 2)}</pre>
            \`;
          } catch (e) {
            target.innerHTML = \`
              <div class="text-red-400 mb-2">HTTP \${status}</div>
              <pre style='white-space:pre-wrap'>\${responseText}</pre>
            \`;
          }
        }

        // Handle successful responses
        document.body.addEventListener('htmx:afterSwap', function(evt) {
          if (evt.detail.target.id === "api-result") {
            try {
              const el = document.getElementById("api-result");
              const json = JSON.parse(el.textContent);
              el.innerHTML = \`
                <div class="text-green-400 mb-2">HTTP 200</div>
                <pre style='white-space:pre-wrap'>\${JSON.stringify(json, null, 2)}</pre>
              \`;
            } catch (e) {}
          }
        });

        // Handle error responses
        document.body.addEventListener('htmx:responseError', handleResponse);
      `
    }}
  />
);

export const Debug = () => {
  return (
    <Layout>
      <div class="bg-black w-full min-h-svh grid grid-cols-2">
        {/* Left: Buttons */}
        <div class="p-4 space-y-6">
          <GeneralButtons />
          <DeviceButtons />
        </div>
        {/* Right: Result window */}
        <div id="api-result" class="bg-gray-900 text-white p-4 rounded min-h-40">
          {/* API responses will appear here */}
        </div>
        <DebugScript />
      </div>
    </Layout>
  )
}
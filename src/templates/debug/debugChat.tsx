import { Layout } from "..";

const DebugChatScript = () => (
    <script
        dangerouslySetInnerHTML={{
            __html: `
        function sendChatMessage() {
          const deviceId = document.getElementById("device-id-input").value.trim();
          const message = document.getElementById("message-input").value.trim();
          
          if (!deviceId) {
            alert("Please enter a device ID");
            return;
          }
          
          if (!message) {
            alert("Please enter a message");
            return;
          }
          
          // Show loading state
          document.getElementById("chat-results").innerHTML = '<div class="text-blue-400">Loading...</div>';
          
          fetch('/api/chat/' + encodeURIComponent(deviceId), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message })
          })
            .then(response => response.json())
            .then(data => {
              displayChatResults(data);
            })
            .catch(error => {
              document.getElementById("chat-results").innerHTML = '<div class="text-red-400">Error: ' + error.message + '</div>';
            });
        }
        
        function displayChatResults(data) {
          const resultsDiv = document.getElementById("chat-results");
          
          if (!data.success) {
            resultsDiv.innerHTML = '<div class="text-red-400">' + data.message + '</div>';
            return;
          }
          
          const aiResponse = data.data.response;
          
          resultsDiv.innerHTML = \`
            <div class="bg-gray-800 border border-gray-600 rounded-lg p-4">
              <div class="prose prose-invert max-w-none">
                <p class="text-gray-300">\${aiResponse}</p>
              </div>
            </div>
          \`;
        }
      `
        }}
    />
);

export const DebugChat = () => {
    return (
        <Layout>
            <div class="bg-black w-full min-h-svh p-6">
                <div class="max-w-6xl mx-auto">
                    {/* Header */}
                    <div class="mb-8">
                        <h1 class="text-3xl font-bold text-white mb-2">Chat Debug View</h1>
                        <p class="text-gray-400">Ask questions about fish detected by a specific device</p>
                    </div>

                    {/* Chat Input Section */}
                    <div class="bg-gray-900 rounded-lg p-6 mb-8">
                        <h2 class="text-xl font-bold text-white mb-4">Chat with AI about Fish</h2>
                        <div class="space-y-4">
                            <div>
                                <label for="device-id-input" class="block text-sm font-medium text-gray-300 mb-2">
                                    Device ID
                                </label>
                                <input
                                    type="text"
                                    id="device-id-input"
                                    placeholder="Enter device ID"
                                    class="w-full px-4 py-2 bg-gray-800 border border-gray-600 text-white rounded focus:border-blue-500 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label for="message-input" class="block text-sm font-medium text-gray-300 mb-2">
                                    Your Question
                                </label>
                                <textarea
                                    id="message-input"
                                    placeholder="Ask a question about the fish detected by this device..."
                                    rows="3"
                                    class="w-full px-4 py-2 bg-gray-800 border border-gray-600 text-white rounded focus:border-blue-500 focus:outline-none resize-none"
                                ></textarea>
                            </div>
                            <div>
                                <button
                                    onclick="sendChatMessage()"
                                    class="w-full px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                                >
                                    Send Question
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Results Section */}
                    <div id="chat-results" class="space-y-4">
                        <div class="text-gray-400 text-center py-8">
                            Enter a device ID and your question above to start chatting
                        </div>
                    </div>
                </div>

                <DebugChatScript />
            </div>
        </Layout>
    );
};

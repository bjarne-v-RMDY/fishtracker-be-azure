const ChatFormScript = () => (
    <script
        dangerouslySetInnerHTML={{
            __html: `
        document.body.addEventListener('htmx:configRequest', function(evt) {
          if (evt.detail.elt.id === 'chat-form') {
            const deviceId = evt.detail.elt.querySelector('input[name="deviceId"]').value;
            if (deviceId) {
              evt.detail.path = '/api/chat/' + encodeURIComponent(deviceId);
            }
          }
        });
      `
        }}
    />
);

export const ChatForm = () => {
    return (
        <div class="bg-gray-900 rounded-lg p-4">
            <h2 class="text-xl font-bold text-white mb-4">Chat with Fish AI</h2>
            <form
                id="chat-form"
                class="space-y-4"
                hx-ext="json-enc"
                hx-post="/api/chat/"
                hx-target="#api-result"
                hx-swap="innerHTML"
            >
                <div>
                    <label class="block text-sm font-medium text-gray-300 mb-2">
                        Device ID
                    </label>
                    <input
                        type="text"
                        name="deviceId"
                        placeholder="Enter device ID"
                        class="w-full px-4 py-2 bg-gray-800 border border-gray-600 text-white rounded focus:border-blue-500 focus:outline-none"
                        required
                    />
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-300 mb-2">
                        Message
                    </label>
                    <textarea
                        name="message"
                        placeholder="Ask a question about the fish..."
                        class="w-full px-4 py-2 bg-gray-800 border border-gray-600 text-white rounded focus:border-blue-500 focus:outline-none resize-none"
                        required
                    ></textarea>
                </div>
                <button
                    type="submit"
                    class="w-full px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                    Send Question
                </button>
            </form>
            <ChatFormScript />
        </div>
    );
};

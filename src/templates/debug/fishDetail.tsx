export const FishDetailForm = () => (
    <div>
        <div class="font-bold text-white mb-2">Fish Detail by ID</div>
        <div class="mb-3">
            <input
                type="text"
                id="fish-detail-id-input"
                placeholder="Enter fish ID"
                class="w-full px-3 py-2 bg-gray-800 border border-gray-600 text-white rounded focus:border-blue-500 focus:outline-none"
            />
        </div>
        <button
            class="border border-green-500 text-white px-4 py-2 w-full mb-3"
            onclick="fetchFishDetail()"
        >
            Get Fish Detail
        </button>

        <script
            dangerouslySetInnerHTML={{
                __html: `
                    function fetchFishDetail() {
                        let fishId = document.getElementById("fish-detail-id-input").value.trim();
                        if (!fishId) {
                            alert("Please enter a fish ID");
                            return;
                        }
                        
                        htmx.ajax('GET', '/api/fish/detail/' + encodeURIComponent(fishId), {
                            target: '#api-result',
                            swap: 'innerHTML'
                        });
                    }
                `
            }}
        ></script>
    </div>
);


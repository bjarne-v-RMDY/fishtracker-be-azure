import { Layout } from "..";

const DebugFishScript = () => (
  <script
    dangerouslySetInnerHTML={{
      __html: `
        function searchFish() {
          const deviceId = document.getElementById("device-id-input").value.trim();
          if (!deviceId) {
            alert("Please enter a device ID");
            return;
          }
          
          // Show loading state
          document.getElementById("fish-results").innerHTML = '<div class="text-blue-400">Loading...</div>';
          
          fetch('/api/fish/' + encodeURIComponent(deviceId))
            .then(response => response.json())
            .then(data => {
              displayFishResults(data);
            })
            .catch(error => {
              document.getElementById("fish-results").innerHTML = '<div class="text-red-400">Error: ' + error.message + '</div>';
            });
        }
        
        function displayFishResults(data) {
          const resultsDiv = document.getElementById("fish-results");
          
          if (!data.success) {
            resultsDiv.innerHTML = '<div class="text-red-400">' + data.message + '</div>';
            return;
          }
          
          if (!data.data || data.data.length === 0) {
            resultsDiv.innerHTML = '<div class="text-yellow-400">No fish found for this device</div>';
            return;
          }
          
          const fishList = data.data.map(fish => {
            const fishData = fish.fish;
            const timestamp = new Date(fish.timestamp).toLocaleString();
            
            return \`
              <div class="bg-gray-800 border border-gray-600 rounded-lg p-4 mb-4">
                <div class="flex justify-between items-start mb-3">
                  <h3 class="text-xl font-bold text-white">\${fishData.name}</h3>
                  <span class="text-sm text-gray-400">\${timestamp}</span>
                </div>
                
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-3">
                  <div class="lg:col-span-2">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p class="text-gray-300"><strong>Family:</strong> \${fishData.family}</p>
                        <p class="text-gray-300"><strong>Water Type:</strong> \${fishData.waterType}</p>
                        <p class="text-gray-300"><strong>Size:</strong> \${fishData.minSize}-\${fishData.maxSize} cm</p>
                        <p class="text-gray-300"><strong>Environment:</strong> \${fishData.environment}</p>
                        <p class="text-gray-300"><strong>Region:</strong> \${fishData.region}</p>
                      </div>
                      <div>
                        <p class="text-gray-300"><strong>Conservation:</strong> \${fishData.conservationStatus}</p>
                        <p class="text-gray-300"><strong>AI Accuracy:</strong> \${fishData.aiAccuracy}%</p>
                        <p class="text-gray-300"><strong>Depth Range:</strong> \${fishData.depthRangeMin}-\${fishData.depthRangeMax} m</p>
                      </div>
                    </div>
                  </div>
                  <div class="flex justify-center">
                    <div class="w-full max-w-xs">
                      <img 
                        src="\${fish.imageUrl}" 
                        alt="\${fishData.name}" 
                        class="w-full h-48 object-cover rounded-lg border border-gray-600"
                        onerror="this.style.display='none'; this.nextElementSibling.style.display='block';"
                      />
                      <div class="hidden w-full h-48 bg-gray-700 rounded-lg border border-gray-600 flex items-center justify-center">
                        <p class="text-gray-400 text-sm text-center">Image not available</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div class="mb-3">
                  <p class="text-gray-300"><strong>Description:</strong></p>
                  <p class="text-gray-400 text-sm">\${fishData.description}</p>
                </div>
                
                <div class="mb-3">
                  <p class="text-gray-300"><strong>Color Description:</strong></p>
                  <p class="text-gray-400 text-sm">\${fishData.colorDescription}</p>
                </div>
                
                <div class="mb-3">
                  <p class="text-gray-300"><strong>Conservation Status Description:</strong></p>
                  <p class="text-gray-400 text-sm">\${fishData.consStatusDescription}</p>
                </div>
              </div>
            \`;
          }).join('');
          
          resultsDiv.innerHTML = \`
            <div class="mb-4">
              <h2 class="text-2xl font-bold text-white mb-2">Fish Found: \${data.data.length}</h2>
            </div>
            \${fishList}
          \`;
        }
      `
    }}
  />
);

export const DebugFish = () => {
  return (
    <Layout>
      <div class="bg-black w-full min-h-svh p-6">
        <div class="max-w-6xl mx-auto">
          {/* Header */}
          <div class="mb-8">
            <h1 class="text-3xl font-bold text-white mb-2">Fish Debug View</h1>
            <p class="text-gray-400">Search for fish by device ID and view detailed information</p>
          </div>

          {/* Search Section */}
          <div class="bg-gray-900 rounded-lg p-6 mb-8">
            <h2 class="text-xl font-bold text-white mb-4">Search Fish by Device</h2>
            <div class="flex gap-4">
              <input
                type="text"
                id="device-id-input"
                placeholder="Enter device ID"
                class="flex-1 px-4 py-2 bg-gray-800 border border-gray-600 text-white rounded focus:border-blue-500 focus:outline-none"
              />
              <button
                onclick="searchFish()"
                class="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Search
              </button>
            </div>
          </div>

          {/* Results Section */}
          <div id="fish-results" class="space-y-4">
            <div class="text-gray-400 text-center py-8">
              Enter a device ID above to search for fish
            </div>
          </div>
        </div>
        <DebugFishScript />
      </div>
    </Layout>
  );
};

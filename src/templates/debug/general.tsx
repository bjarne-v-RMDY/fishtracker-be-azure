export const GeneralButtons = () => (
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
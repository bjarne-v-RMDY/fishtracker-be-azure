import type { FC } from 'hono/jsx'


const Layout: FC = (props) => {
    return (
        <html>
            <head>
                <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
            </head>
            <body>{props.children}</body>
        </html>
    )
}

export const Lander: FC = () => {
    return (
        <Layout>
            <div class="w-full h-svh bg-black grid place-items-center text-white">
                <div class="flex flex-col gap-2">
                    <h1 class="text-2xl font-bold">Fish Tracker</h1>
                    <p>Swagger UI available at <a class="text-blue-500 cursor-pointer" href="/api/swagger/ui">UI</a></p>
                    <p>Swagger DOC available at <a class="text-blue-500 cursor-pointer" href="/api/swagger/doc">DOC</a></p>
                </div>
            </div>
        </Layout>
    )
}